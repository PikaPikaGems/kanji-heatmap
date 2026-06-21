import { useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SpeedKatakanaHeader } from "./SpeedKatakanaHeader";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { SessionStats, SpeedKatakanaSettings } from "./types";
import { recordSetResult } from "./storage";
import { useCompletedSetsCount } from "./use-completed-sets-count";
import { DEFAULT_SETTINGS, SETTINGS_KEY, SPEED_KATAKANA_TOTAL_SETS } from "./constants";


type Phase = "initial" | "playing" | "ended";


const nextChallengeSet = (current: number) =>
  current >= SPEED_KATAKANA_TOTAL_SETS ? 1 : current + 1;

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

  const headerProgress =
    phase === "initial"
      ? (completedSetsCount / SPEED_KATAKANA_TOTAL_SETS) * 100
      : progress;

  const goToInitial = () => {
    setProgress(0);
    setPhase("initial");
  };

  const startGame = () => {
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
    setSetting("challengeSet", nextChallengeSet(settings.challengeSet));
    setProgress(0);
    setPhase("playing");
  };

  return (
    <>
      <SpeedKatakanaHeader progress={headerProgress} />
      <main className="px-4 pt-12 h-dvh bg-background">
        {phase === "initial" && (
          <InitialScreen onStart={startGame} />
        )}

        {phase === "playing" && (
          // Remount per challenge set so all game state resets cleanly.
          <Game
            key={settings.challengeSet}
            settings={settings}
            onProgress={setProgress}
            onComplete={finishGame}
            onEnd={goToInitial}
          />
        )}

        {phase === "ended" && stats && (
          <EndSession
            stats={stats}
            onNext={startNextChallenge}
            onEnd={goToInitial}
            completedSets={completedSetsCount}
          />
        )}
      </main>
    </>
  );
};

export default SpeedKatakanaScreen;
