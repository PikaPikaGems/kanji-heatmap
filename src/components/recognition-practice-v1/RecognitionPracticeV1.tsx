import { useEffect, useRef } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { usePracticeSession } from "@/components/shared-practice/use-practice-session";
import { recognitionPracticePageMeta } from "@/lib/pages/practice-pages";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import { RecognitionPracticeSettings, SessionResult } from "./types";

/** Toggle off to size the shell with `bottom-0` instead of visualViewport height. */
const visualPortOn = true;

const RecognitionPracticeV1 = () => {
  useHtmlDocumentTitle(recognitionPracticePageMeta.heading);

  const [settings] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const viewport = useVisualViewport();
  const primerRef = useRef<HTMLInputElement | null>(null);

  const session = usePracticeSession<SessionResult>({
    activityKind: "recognition",
    sessionSize: SESSION_SIZE,
    // Focus the sr-only primer so the soft keyboard opens with the session.
    onSessionStart: () => primerRef.current?.focus(),
  });
  const { phase, results, hasMore } = session;

  // Effect needed (external DOM): keeps the play shell pinned to the layout
  // top. Chasing visualViewport.offsetTop while iOS animates the keyboard
  // makes the whole UI bob; "/" doesn't do that because ListScreen isn't
  // viewport-pinned at all.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const lockScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    vv.addEventListener("scroll", lockScroll);
    vv.addEventListener("resize", lockScroll);
    lockScroll();
    return () => {
      vv.removeEventListener("scroll", lockScroll);
      vv.removeEventListener("resize", lockScroll);
    };
  }, []);

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
