import { useMemo, useRef, useState, type ReactNode } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { productionPracticePageMeta } from "@/lib/pages/practice-pages";
import { recognizeDaKanji, warmupDaKanji } from "@/lib/dakanji-adapter";
import { recognizeKanji, warmupKanjiCanvas } from "@/lib/kanjicanvas-adapter";
import type { DrawingSubmitPayload } from "@/lib/stroke-types";
import { InitialScreen } from "./InitialScreen";
import { ModelLoadingScreen } from "./ModelLoadingScreen";
import { ModelErrorLighterRecognizer } from "./ModelErrorLighterRecognizer";
import { ModelErrorNoRecognizer } from "./ModelErrorNoRecognizer";
import { formatModelLoadErrorReport } from "./format-model-load-error";
import { Game } from "./Game";
import {
  DEFAULT_SETTINGS,
  RECOGNIZE_TOP_K,
  SESSION_SIZE,
  SETTINGS_KEY,
} from "./constants";
import { ProductionPracticeSettings, SessionResult } from "./types";

type RecognitionBackend = "dakanji" | "kanjicanvas" | "none";

type LoadPhase =
  | { status: "loading-dakanji" }
  | { status: "loading-backup" }
  | { status: "error-lighter"; errorReport: string | null }
  | { status: "error-none"; errorReport: string | null };

const recognizeWithBackend = (
  backend: RecognitionBackend,
  payload: DrawingSubmitPayload
): Promise<string[]> => {
  if (backend === "dakanji") {
    return recognizeDaKanji(payload, RECOGNIZE_TOP_K);
  }
  if (backend === "kanjicanvas") {
    return recognizeKanji(payload.strokes);
  }
  return Promise.resolve([]);
};

const FadeIn = ({ children }: { children: ReactNode }) => (
  <div className="h-full animate-fade-in">{children}</div>
);

const ProductionPracticeV1 = () => {
  useHtmlDocumentTitle(productionPracticePageMeta.heading);

  const [settings] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [loadPhase, setLoadPhase] = useState<LoadPhase>({
    status: "loading-dakanji",
  });
  // Sticky for the visit once the user commits to a backend (or none).
  const [backend, setBackend] = useState<RecognitionBackend | null>(null);
  const pendingCommitRef = useRef<(() => void) | null>(null);

  const session = usePracticeSession<SessionResult>({
    activityKind: "production",
    sessionSize: SESSION_SIZE,
    onGoToInitial: () => {
      setLoadPhase({ status: "loading-dakanji" });
      pendingCommitRef.current = null;
    },
    // Warm recognition before "playing"; park on loading / confirm-fallback
    // while backends spin up.
    onPlay: (commitPlaying) => {
      void warmThenCommit(commitPlaying);
    },
  });
  const { phase, results, hasMore } = session;

  const warmThenCommit = async (commitPlaying: () => void) => {
    if (backend != null) {
      commitPlaying();
      return;
    }

    pendingCommitRef.current = commitPlaying;
    setLoadPhase({ status: "loading-dakanji" });
    session.setPhase("loading");

    try {
      await warmupDaKanji();
      setBackend("dakanji");
      pendingCommitRef.current = null;
      commitPlaying();
      return;
    } catch (daKanjiError) {
      console.error("DaKanji warmup failed", daKanjiError);
      const errorReport = formatModelLoadErrorReport(daKanjiError);

      setLoadPhase({ status: "loading-backup" });
      try {
        await warmupKanjiCanvas();
        setLoadPhase({ status: "error-lighter", errorReport });
      } catch (canvasError) {
        console.error("KanjiCanvas warmup failed", canvasError);
        setLoadPhase({ status: "error-none", errorReport });
      }
    }
  };

  const continueWithChosenBackend = (chosen: RecognitionBackend) => {
    setBackend(chosen);
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

  const activeBackend = backend ?? "none";
  const gradingEnabled = activeBackend !== "none";

  const renderPhase = (): ReactNode => {
    if (phase === "initial") {
      return (
        <FadeIn key="initial">
          <InitialScreen onStart={session.startGame} />
        </FadeIn>
      );
    }

    if (phase === "loading" && loadPhase.status === "loading-dakanji") {
      return (
        <FadeIn key="loading-dakanji">
          <ModelLoadingScreen message="Loading handwriting model…" />
        </FadeIn>
      );
    }

    if (phase === "loading" && loadPhase.status === "loading-backup") {
      return (
        <FadeIn key="loading-backup">
          <ModelLoadingScreen message="Trying a lighter recognizer…" />
        </FadeIn>
      );
    }

    if (phase === "loading" && loadPhase.status === "error-lighter") {
      return (
        <FadeIn key="error-lighter">
          <ModelErrorLighterRecognizer
            errorReport={loadPhase.errorReport}
            onContinue={() => continueWithChosenBackend("kanjicanvas")}
            onCancel={session.goToInitial}
          />
        </FadeIn>
      );
    }

    if (phase === "loading" && loadPhase.status === "error-none") {
      return (
        <FadeIn key="error-none">
          <ModelErrorNoRecognizer
            errorReport={loadPhase.errorReport}
            onContinue={() => continueWithChosenBackend("none")}
            onCancel={session.goToInitial}
          />
        </FadeIn>
      );
    }

    if (phase === "playing" && session.sessionItems.length > 0) {
      return (
        <FadeIn key={`playing-${session.sessionKey}`}>
          <Game
            sessionItems={session.sessionItems}
            settings={settings}
            randomKanjiPool={randomKanjiPool}
            gradingEnabled={gradingEnabled}
            recognize={(payload) =>
              recognizeWithBackend(activeBackend, payload)
            }
            onProgress={session.setProgress}
            onComplete={session.finishSession}
            onEnd={session.goToInitial}
          />
        </FadeIn>
      );
    }

    if (phase === "ended" && results) {
      return (
        <FadeIn key={hasMore ? "ended" : "complete"}>
          <EndSession
            results={hasMore ? results : session.runResults}
            hasMore={hasMore}
            wordsCleared={session.deck.length}
            onNext={session.startNextSession}
            onEnd={session.goToInitial}
          />
        </FadeIn>
      );
    }

    return null;
  };

  return (
    <>
      <PracticeShell progress={session.progress}>{renderPhase()}</PracticeShell>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default ProductionPracticeV1;
