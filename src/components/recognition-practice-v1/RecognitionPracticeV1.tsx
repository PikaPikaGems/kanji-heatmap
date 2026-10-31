import { useRef } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import {
  recognitionPracticePageMeta,
  type PracticePageMeta,
} from "@/lib/pages/practice-pages";
import type { PracticeActivityType } from "@/lib/practice/activity";
import type { DeckAnchor } from "@/components/shared-practice/use-practice-deck";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { useLockVisualViewportScroll } from "./use-lock-visual-viewport-scroll";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import { RecognitionPracticeSettings, SessionResult } from "./types";

/** Toggle off to size the shell with `bottom-0` instead of visualViewport height. */
const visualPortOn = false;

/**
 * A reading practice game: type the reading of each kanji's main word
 * (/reading-practice) or secondary word (/reading-practice-2).
 */
export const ReadingPracticeGame = ({
  page,
  anchor,
  activityType,
}: {
  page: PracticePageMeta;
  anchor: DeckAnchor;
  activityType: PracticeActivityType;
}) => {
  useHtmlDocumentTitle(page.heading);

  const [settings] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const viewport = useVisualViewport();
  const primerRef = useRef<HTMLInputElement | null>(null);

  const session = usePracticeSession<SessionResult>({
    activityType,
    sessionSize: SESSION_SIZE,
    // Focus the sr-only primer so the soft keyboard opens with the session.
    onSessionStart: () => primerRef.current?.focus(),
  });
  const { phase, results, hasMore } = session;

  useLockVisualViewportScroll();

  return (
    <>
      <input
        ref={primerRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      <PracticeShell
        progress={session.progress}
        height={visualPortOn ? viewport.height : undefined}
      >
        {phase === "initial" && (
          <div key="initial" className="h-full animate-fade-in">
            <InitialScreen
              page={page}
              anchor={anchor}
              onStart={session.startGame}
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
              sound={settings.sound ?? { enabled: true, type: "correct" }}
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
              saveError={session.saveError}
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

/** /reading-practice: Reading Practice I, the main words. */
const RecognitionPracticeV1 = () => (
  <ReadingPracticeGame
    page={recognitionPracticePageMeta}
    anchor="main"
    activityType="reading_practice"
  />
);

export default RecognitionPracticeV1;
