import { useMemo, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { productionPracticePageMeta } from "@/components/items/practice-pages";
import { warmupDaKanji } from "@/lib/dakanji-adapter";
import { InitialScreen } from "./InitialScreen";
import { ModelLoadingScreen } from "./ModelLoadingScreen";
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
  const [modelReady, setModelReady] = useState(false);

  const session = usePracticeSession<SessionResult>({
    activityKind: "production",
    sessionSize: SESSION_SIZE,
    onGoToInitial: () => setLoadStatus("loading"),
    // Warm the handwriting model before entering "playing"; park on the
    // "loading" phase (with retry) while the model spins up.
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
    setLoadStatus("loading");
    session.setPhase("loading");
    try {
      await warmupDaKanji();
      setModelReady(true);
      commitPlaying();
    } catch {
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

  // Derived from the deck (the pool is always the deck's kanji).
  const randomKanjiPool = useMemo(
    () => session.deck.map((item) => item.kanji),
    [session.deck]
  );

  return (
    <>
      <PracticeShell progress={session.progress} playing={phase === "playing"}>
        {phase === "initial" && (
          <div key="initial" className="h-full animate-fade-in">
            <InitialScreen onStart={session.startGame} />
          </div>
        )}

        {phase === "loading" && (
          <div key="loading" className="h-full animate-fade-in">
            <ModelLoadingScreen
              status={loadStatus}
              onRetry={retryWarmup}
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
