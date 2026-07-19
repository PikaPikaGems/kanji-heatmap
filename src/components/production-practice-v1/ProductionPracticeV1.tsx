import { useMemo, useRef, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { productionPracticePageMeta } from "@/lib/pages/practice-pages";
import { warmupDaKanji } from "@/lib/dakanji-adapter";
import { InitialScreen } from "./InitialScreen";
import { ModelLoadingScreen } from "./ModelLoadingScreen";
import { ModelErrorScreen } from "./ModelErrorScreen";
import { formatModelLoadErrorReport } from "./format-model-load-error";
import { Game } from "./Game";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import { ProductionPracticeSettings, SessionResult } from "./types";

const ProductionPracticeV1 = () => {
  useHtmlDocumentTitle(productionPracticePageMeta.heading);

  const [settings] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [loadStatus, setLoadStatus] = useState<"loading" | "error">("loading");
  const [loadErrorReport, setLoadErrorReport] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [playWithoutGrading, setPlayWithoutGrading] = useState(false);
  const pendingCommitRef = useRef<(() => void) | null>(null);

  const session = usePracticeSession<SessionResult>({
    activityKind: "production",
    sessionSize: SESSION_SIZE,
    onGoToInitial: () => {
      setLoadStatus("loading");
      setLoadErrorReport(null);
      pendingCommitRef.current = null;
    },
    // Warm the handwriting model before entering "playing"; park on the
    // "loading" phase (with retry / continue-without-grading) while it spins up.
    onPlay: (commitPlaying) => {
      void warmThenCommit(commitPlaying);
    },
  });
  const { phase, results, hasMore } = session;

  const warmThenCommit = async (commitPlaying: () => void) => {
    if (modelReady) {
      commitPlaying();
      return;
    }
    // User already chose to play without grading this visit — don't re-block.
    if (playWithoutGrading) {
      commitPlaying();
      return;
    }
    pendingCommitRef.current = commitPlaying;
    setLoadStatus("loading");
    setLoadErrorReport(null);
    session.setPhase("loading");
    try {
      await warmupDaKanji();
      setModelReady(true);
      pendingCommitRef.current = null;
      commitPlaying();
    } catch (error) {
      console.error("DaKanji warmup failed", error);
      setLoadErrorReport(formatModelLoadErrorReport(error));
      setLoadStatus("error");
    }
  };

  const retryWarmup = () => {
    if (session.sessionItems.length === 0) {
      session.goToInitial();
      return;
    }
    session.play(session.sessionItems, session.cursor);
  };

  const continueWithoutGrading = () => {
    setPlayWithoutGrading(true);
    const commit = pendingCommitRef.current;
    pendingCommitRef.current = null;
    if (commit) {
      commit();
      return;
    }
    if (session.sessionItems.length > 0) {
      session.setPhase("playing");
      return;
    }
    session.goToInitial();
  };

  // Derived from the deck (the pool is always the deck's kanji).
  const randomKanjiPool = useMemo(
    () => session.deck.map((item) => item.kanji),
    [session.deck]
  );

  return (
    <>
      <PracticeShell progress={session.progress}>
        {phase === "initial" && (
          <div key="initial" className="h-full animate-fade-in">
            <InitialScreen onStart={session.startGame} />
          </div>
        )}

        {phase === "loading" && loadStatus === "loading" && (
          <div key="loading" className="h-full animate-fade-in">
            <ModelLoadingScreen />
          </div>
        )}

        {phase === "loading" && loadStatus === "error" && (
          <div key="error" className="h-full animate-fade-in">
            <ModelErrorScreen
              errorReport={loadErrorReport}
              onRetry={retryWarmup}
              onContinueWithoutGrading={continueWithoutGrading}
              onCancel={session.goToInitial}
            />
          </div>
        )}

        {phase === "playing" && session.sessionItems.length > 0 && (
          <div
            key={`playing-${session.sessionKey}`}
            className="h-full animate-fade-in"
          >
            <Game
              sessionItems={session.sessionItems}
              settings={settings}
              randomKanjiPool={randomKanjiPool}
              gradingEnabled={modelReady}
              onProgress={session.setProgress}
              onComplete={session.finishSession}
              onEnd={session.goToInitial}
            />
          </div>
        )}

        {phase === "ended" && results && (
          <div
            key={hasMore ? "ended" : "complete"}
            className="h-full animate-fade-in"
          >
            <EndSession
              results={hasMore ? results : session.runResults}
              hasMore={hasMore}
              wordsCleared={session.deck.length}
              onNext={session.startNextSession}
              onEnd={session.goToInitial}
            />
          </div>
        )}
      </PracticeShell>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default ProductionPracticeV1;
