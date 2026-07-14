import { useRef, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { SpeedKatakanaHeader } from "./SpeedKatakanaHeader";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { SessionStats, SpeedKatakanaSettings } from "./types";
import { recordSetResult } from "./storage";
import { useCompletedSetsCount } from "./use-completed-sets-count";
import { DEFAULT_SETTINGS, SETTINGS_KEY, SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";


type Phase = "initial" | "playing" | "ended";


const nextChallengeSet = (current: number) =>
  current >= SPEED_KATAKANA_TOTAL_CHALLENGES ? 1 : current + 1;

const SpeedKatakanaScreen = () => {
  useHtmlDocumentTitle("Speed Katakana");

  const [phase, setPhase] = useState<Phase>("initial");
  const [settings, setSetting] = useLocalStorage<SpeedKatakanaSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const completedSetsCount = useCompletedSetsCount();

  // Pin the play area to the area above the on-screen keyboard. See the hook.
  const viewport = useVisualViewport();

  // iOS only opens the keyboard when focus() runs inside the user gesture, but
  // the game's real input doesn't exist yet at click time (the challenge set is
  // still loading). So we focus this always-mounted primer synchronously in the
  // Start handler to open the keyboard; the game then transfers focus to its own
  // input once it mounts, which iOS keeps the keyboard open across.
  const primerRef = useRef<HTMLInputElement | null>(null);

  const headerProgress =
    phase === "initial"
      ? (completedSetsCount / SPEED_KATAKANA_TOTAL_CHALLENGES) * 100
      : progress;

  const goToInitial = () => {
    setProgress(0);
    setPhase("initial");
  };

  const startGame = () => {
    // Must run inside the click's call stack for iOS to open the keyboard.
    primerRef.current?.focus();
    setProgress(0);
    setPhase("playing");
  };

  const finishGame = (sessionStats: SessionStats) => {
    if (settings.wordCount === 48) {
      recordSetResult(settings.challengeSet, sessionStats);
    }
    setStats(sessionStats);
    setPhase("ended");
  };

  const startNextChallenge = () => {
    primerRef.current?.focus();
    setSetting("challengeSet", nextChallengeSet(settings.challengeSet));
    setProgress(0);
    setPhase("playing");
  };

  return (
    <>
      {/*
        Off-screen but focusable. Focusing it inside the Start gesture opens the
        iOS keyboard before the game's input has mounted; focus then transfers.
      */}
      <input
        ref={primerRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      {/*
        One container pinned to the visual viewport — the area above the on-screen
        keyboard. The header lives in-flow at its top and the play area fills the
        rest, so both stay glued to the visible region (iOS anchors `position:
        fixed` to the layout viewport, which drifts when the keyboard opens).
        `top` tracks any iOS scroll-into-view shift; normally 0.
      */}
      <div
        className="fixed inset-x-0 flex flex-col overflow-hidden bg-background"
        style={{ top: viewport.offsetTop, height: viewport.height }}
      >
        <SpeedKatakanaHeader progress={headerProgress} />
        <main className="flex-1 min-h-0 py-4 overflow-hidden">
          {phase === "initial" && (
            <div key="initial" className="h-full animate-fade-in">
              <InitialScreen onStart={startGame} />
            </div>
          )}

          {phase === "playing" && (
            <div
              key={`playing-${settings.challengeSet}`}
              className="h-full animate-fade-in"
            >
              <Game
                settings={settings}
                onProgress={setProgress}
                onComplete={finishGame}
                onEnd={goToInitial}
              />
            </div>
          )}

          {phase === "ended" && stats && (
            <div key="ended" className="h-full animate-fade-in">
              <EndSession
                stats={stats}
                onNext={startNextChallenge}
                onEnd={goToInitial}
                completedSets={completedSetsCount}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default SpeedKatakanaScreen;
