import { useRef } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { PracticeShell } from "@/components/shared-practice";
import { Game } from "@/components/recognition-practice-v1/Game";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from "@/components/recognition-practice-v1/constants";
import type { RecognitionPracticeSettings } from "@/components/recognition-practice-v1/types";
import { useLockVisualViewportScroll } from "@/components/recognition-practice-v1/use-lock-visual-viewport-scroll";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { readingMasteryPageMeta } from "@/lib/pages/practice-pages";
import { getMasteryBlocker } from "./get-mastery-blocker";
import { MasteryEndScreen } from "./MasteryEndScreen";
import { MasteryGateScreen } from "./MasteryGateScreen";
import { MasteryLoading } from "./MasteryLoading";
import { MasteryStartScreen } from "./MasteryStartScreen";
import { useMasteryItemLookup } from "./use-mastery-item-lookup";
import { useMasterySession } from "./use-mastery-session";

const ignoreProgress = () => {};

type ReadingMasterySession = ReturnType<typeof useMasterySession>;

const ReadingMasteryPhase = ({
  session,
  ready,
  blocker,
  onStart,
  onNext,
}: {
  session: ReadingMasterySession;
  ready: boolean;
  blocker: string | null;
  onStart: () => void;
  onNext: () => void;
}) => {
  const [settings] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const { state } = session;

  if (state.status === "start") {
    return (
      <div className="h-full animate-fade-in">
        <MasteryStartScreen
          heading={readingMasteryPageMeta.heading}
          description={readingMasteryPageMeta.description}
          cardType="reading"
          ready={ready}
          blocker={blocker}
          error={state.error}
          onStart={onStart}
        />
      </div>
    );
  }

  if (state.status === "ended") {
    return (
      <MasteryEndScreen
        results={session.results}
        saveError={session.saveError}
        saveFailures={session.saveFailures}
        cardType="reading"
        moreDue={state.moreDue}
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
        sound={settings.sound ?? { enabled: true, type: "correct" }}
        grading={{ intervals: state.intervals, onGrade: session.grade }}
        onProgress={ignoreProgress}
        onComplete={onNext}
        onEnd={session.leave}
      />
    </div>
  );
};

const ReadingMasteryRun = ({ blocker }: { blocker: string | null }) => {
  const { getItem } = useMasteryItemLookup();
  const session = useMasterySession({ cardType: "reading", getItem });
  const primerRef = useRef<HTMLInputElement | null>(null);

  useLockVisualViewportScroll();

  // Focus the sr-only primer inside the tap itself, so the soft keyboard
  // opens with the round and stays open while the next card loads.
  const start = () => {
    primerRef.current?.focus();
    void session.start();
  };
  // After the round's last card the end screen has no input, so the
  // keyboard must not be kept open for it.
  const next = () => {
    const { state } = session;
    const isLast = state.status === "card" && state.position >= state.total;
    if (!isLast) primerRef.current?.focus();
    void session.next();
  };

  return (
    <>
      <input
        ref={primerRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      <PracticeShell progress={session.progress}>
        <ReadingMasteryPhase
          session={session}
          ready={getItem != null}
          blocker={blocker}
          onStart={start}
          onNext={next}
        />
      </PracticeShell>

      {/* The start screen suggests a kanji and the end screen's tiles link to
          theirs; both open the kanji drawer. */}
      {(session.state.status === "start" ||
        session.state.status === "ended") && <KanjiDrawerGlobal />}
    </>
  );
};

/** /reading-mastery: review due reading cards from the review pile. */
const ReadingMastery = () => {
  useHtmlDocumentTitle(readingMasteryPageMeta.heading);
  const status = useAccountStatus();

  if (status.kind !== "active") {
    return (
      <PracticeShell progress={0}>
        <MasteryGateScreen
          status={status}
          feature={readingMasteryPageMeta.title}
        />
      </PracticeShell>
    );
  }

  return <ReadingMasteryRun blocker={getMasteryBlocker(status)} />;
};

export default ReadingMastery;
