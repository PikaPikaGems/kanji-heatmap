import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { PracticeShell } from "@/components/shared-practice";
import { Game } from "@/components/production-practice-v1/Game";
import { ModelErrorLighterRecognizer } from "@/components/production-practice-v1/ModelErrorLighterRecognizer";
import { ModelErrorNoRecognizer } from "@/components/production-practice-v1/ModelErrorNoRecognizer";
import { ModelLoadingScreen } from "@/components/production-practice-v1/ModelLoadingScreen";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from "@/components/production-practice-v1/constants";
import type { ProductionPracticeSettings } from "@/components/production-practice-v1/types";
import { useHandwritingBackend } from "@/components/production-practice-v1/use-handwriting-backend";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { REVIEW_PILE_ALL_KEY, useDueCount } from "@/lib/engine/use-due-count";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { writingMasteryPageMeta } from "@/lib/pages/practice-pages";
import { getMasteryBlocker } from "./get-mastery-blocker";
import { MasteryEndScreen } from "./MasteryEndScreen";
import { MasteryGateScreen } from "./MasteryGateScreen";
import { MasteryLoading } from "./MasteryLoading";
import { MasteryStartScreen } from "./MasteryStartScreen";
import { useMasteryItemLookup } from "./use-mastery-item-lookup";
import { useMasterySession } from "./use-mastery-session";
import { useNextDueAt } from "./use-next-due-at";

const ignoreProgress = () => {};

type WritingMasterySession = ReturnType<typeof useMasterySession>;
type Handwriting = ReturnType<typeof useHandwritingBackend>;

const WritingMasteryPhase = ({
  session,
  handwriting,
  ready,
  blocker,
  onStart,
  onChooseBackend,
  onCancelPrepare,
}: {
  session: WritingMasterySession;
  handwriting: Handwriting;
  ready: boolean;
  blocker: string | null;
  onStart: () => void;
  onChooseBackend: (chosen: "kanjicanvas" | "none") => void;
  onCancelPrepare: () => void;
}) => {
  const [settings] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const due = useDueCount();
  const nextDueAt = useNextDueAt("writing");
  // Filler for the look-alike grid: the other kanji in the review pile.
  const pile = snapshotValue(
    useEngineQuery(REVIEW_PILE_ALL_KEY, (api) => api.reviews.pile.watchAll())
  );
  const { state } = session;
  const { loadPhase } = handwriting;

  if (state.status === "start") {
    return (
      <div className="h-full animate-fade-in">
        <MasteryStartScreen
          heading={writingMasteryPageMeta.heading}
          description={writingMasteryPageMeta.description}
          due={due?.writing ?? null}
          nextDueAt={nextDueAt}
          ready={ready}
          blocker={blocker}
          error={state.error}
          onStart={onStart}
        />
      </div>
    );
  }

  if (state.status === "preparing") {
    if (loadPhase.status === "loading-dakanji") {
      return <ModelLoadingScreen message="Loading handwriting model…" />;
    }
    if (loadPhase.status === "loading-backup") {
      return <ModelLoadingScreen message="Trying a lighter recognizer…" />;
    }
    if (loadPhase.status === "error-lighter") {
      return (
        <ModelErrorLighterRecognizer
          errorReport={loadPhase.errorReport}
          onContinue={() => onChooseBackend("kanjicanvas")}
          onCancel={onCancelPrepare}
        />
      );
    }
    return (
      <ModelErrorNoRecognizer
        errorReport={loadPhase.errorReport}
        onContinue={() => onChooseBackend("none")}
        onCancel={onCancelPrepare}
      />
    );
  }

  if (state.status === "ended") {
    return (
      <MasteryEndScreen
        tally={session.tally}
        saveError={session.saveError}
        due={due?.writing ?? null}
        nextDueAt={nextDueAt}
        onMore={onStart}
        onDone={session.leave}
      />
    );
  }

  if (state.status !== "card") return <MasteryLoading />;

  return (
    <div key={state.review.handleId} className="h-full animate-fade-in">
      <Game
        sessionItems={[state.item]}
        settings={settings}
        randomKanjiPool={pile?.map((item) => item.kanji) ?? []}
        gradingEnabled={handwriting.gradingEnabled}
        grading={{ intervals: state.intervals, onGrade: session.grade }}
        recognize={handwriting.recognize}
        onProgress={ignoreProgress}
        onComplete={() => void session.next()}
        onEnd={session.leave}
      />
    </div>
  );
};

const WritingMasteryRun = ({ blocker }: { blocker: string | null }) => {
  const { getItem } = useMasteryItemLookup();
  const session = useMasterySession({ cardType: "writing", getItem });
  const handwriting = useHandwritingBackend();

  // Warm the handwriting recognizer first (a confirm screen if it falls
  // back), then fetch the round.
  const start = () => {
    void handwriting.warmThenCommit(
      () => void session.start(),
      session.markPreparing
    );
  };

  const chooseBackend = (chosen: "kanjicanvas" | "none") => {
    const commit = handwriting.chooseBackend(chosen);
    if (commit) {
      commit();
      return;
    }
    session.leave();
  };

  const cancelPrepare = () => {
    handwriting.reset();
    session.leave();
  };

  return (
    <PracticeShell progress={session.progress}>
      <WritingMasteryPhase
        session={session}
        handwriting={handwriting}
        ready={getItem != null}
        blocker={blocker}
        onStart={start}
        onChooseBackend={chooseBackend}
        onCancelPrepare={cancelPrepare}
      />
    </PracticeShell>
  );
};

/** /writing-mastery: review due writing cards from the review pile. */
const WritingMastery = () => {
  useHtmlDocumentTitle(writingMasteryPageMeta.heading);
  const status = useAccountStatus();

  if (status.kind !== "active") {
    return (
      <PracticeShell progress={0}>
        <MasteryGateScreen status={status} />
      </PracticeShell>
    );
  }

  return <WritingMasteryRun blocker={getMasteryBlocker(status)} />;
};

export default WritingMastery;
