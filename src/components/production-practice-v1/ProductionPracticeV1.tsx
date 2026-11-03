import { useMemo, type ReactNode } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { productionPracticePageMeta } from "@/lib/pages/practice-pages";
import type { DrawingSubmitPayload } from "@/lib/stroke-types";
import { InitialScreen } from "./InitialScreen";
import { ModelLoadingScreen } from "./ModelLoadingScreen";
import { ModelErrorLighterRecognizer } from "./ModelErrorLighterRecognizer";
import { ModelErrorNoRecognizer } from "./ModelErrorNoRecognizer";
import { Game } from "./Game";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import {
  useHandwritingBackend,
  type LoadPhase,
} from "./use-handwriting-backend";
import { ProductionPracticeSettings, SessionResult } from "./types";

const FadeIn = ({ children }: { children: ReactNode }) => (
  <div className="h-full animate-fade-in">{children}</div>
);

type ProductionPracticePhaseProps = {
  loadPhase: LoadPhase;
  session: ReturnType<typeof usePracticeSession<SessionResult>>;
  settings: ProductionPracticeSettings;
  randomKanjiPool: string[];
  gradingEnabled: boolean;
  recognize: (payload: DrawingSubmitPayload) => Promise<string[]>;
  continueWithChosenBackend: (chosen: "kanjicanvas" | "none") => void;
};

const ProductionPracticePhase = ({
  loadPhase,
  session,
  settings,
  randomKanjiPool,
  gradingEnabled,
  recognize,
  continueWithChosenBackend,
}: ProductionPracticePhaseProps) => {
  const { phase } = session;

  if (phase === "initial") {
    return (
      <FadeIn>
        <InitialScreen onStart={session.startGame} />
      </FadeIn>
    );
  }

  if (phase === "loading" && loadPhase.status === "loading-dakanji") {
    return (
      <FadeIn>
        <ModelLoadingScreen message="Loading handwriting model…" />
      </FadeIn>
    );
  }

  if (phase === "loading" && loadPhase.status === "loading-backup") {
    return (
      <FadeIn>
        <ModelLoadingScreen message="Trying a lighter recognizer…" />
      </FadeIn>
    );
  }

  if (phase === "loading" && loadPhase.status === "error-lighter") {
    return (
      <FadeIn>
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
      <FadeIn>
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
      <FadeIn>
        <Game
          sessionItems={session.sessionItems}
          settings={settings}
          randomKanjiPool={randomKanjiPool}
          gradingEnabled={gradingEnabled}
          recognize={recognize}
          onProgress={session.setProgress}
          onComplete={session.finishSession}
          onEnd={session.goToInitial}
        />
      </FadeIn>
    );
  }

  if (phase === "ended" && session.results) {
    return (
      <FadeIn>
        <EndSession
          results={session.hasMore ? session.results : session.runResults}
          hasMore={session.hasMore}
          wordsCleared={session.deck.length}
          saveError={session.saveError}
          onNext={session.startNextSession}
          onEnd={session.goToInitial}
        />
      </FadeIn>
    );
  }

  return null;
};

const ProductionPracticeV1 = () => {
  useHtmlDocumentTitle(productionPracticePageMeta.heading);

  const [settings] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const handwriting = useHandwritingBackend();
  const { loadPhase } = handwriting;

  const session = usePracticeSession<SessionResult>({
    activityType: "writing_practice",
    sessionSize: SESSION_SIZE,
    onGoToInitial: handwriting.reset,
    // Warm recognition before "playing"; park on loading / confirm-fallback
    // while backends spin up.
    onPlay: (commitPlaying) => {
      void handwriting.warmThenCommit(commitPlaying, () =>
        session.setPhase("loading")
      );
    },
  });
  const { phase, hasMore } = session;

  const continueWithChosenBackend = (chosen: "kanjicanvas" | "none") => {
    const commit = handwriting.chooseBackend(chosen);
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

  const phaseKey =
    phase === "loading"
      ? loadPhase.status
      : phase === "playing"
        ? `playing-${session.sessionKey}`
        : phase === "ended"
          ? hasMore
            ? "ended"
            : "complete"
          : phase;

  return (
    <>
      <PracticeShell progress={session.progress}>
        <ProductionPracticePhase
          key={phaseKey}
          loadPhase={loadPhase}
          session={session}
          settings={settings}
          randomKanjiPool={randomKanjiPool}
          gradingEnabled={handwriting.gradingEnabled}
          recognize={handwriting.recognize}
          continueWithChosenBackend={continueWithChosenBackend}
        />
      </PracticeShell>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default ProductionPracticeV1;
