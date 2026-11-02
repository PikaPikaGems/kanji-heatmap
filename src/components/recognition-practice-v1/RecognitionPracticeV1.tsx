import { useRef } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { recognitionPracticePageMeta } from "@/lib/pages/practice-pages";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { useLockVisualViewportScroll } from "./use-lock-visual-viewport-scroll";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import { RecognitionPracticeSettings, SessionResult } from "./types";

/** Toggle off to size the shell with `bottom-0` instead of visualViewport height. */
const visualPortOn = false;

const RecognitionPracticeV1 = () => {
  useHtmlDocumentTitle(recognitionPracticePageMeta.heading);

  const [settings] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const viewport = useVisualViewport();
  const primerRef = useRef<HTMLInputElement | null>(null);

  const session = usePracticeSession<SessionResult>({
    recordType: "reading_practice_round_completed",
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
            <InitialScreen onStart={session.startGame} />
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

export default RecognitionPracticeV1;
