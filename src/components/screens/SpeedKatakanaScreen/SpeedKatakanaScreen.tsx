import { useMemo, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { SPEED_KATAKANA_TOTAL_SETS } from "@/lib/assets-paths";
import { SpeedKatakanaHeader } from "./SpeedKatakanaHeader";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { SessionStats, SpeedKatakanaSettings } from "./types";
import { countCompletedSets, recordSetResult } from "./storage";

type Phase = "initial" | "playing" | "ended";

const DEFAULT_SETTINGS: SpeedKatakanaSettings = {
  setNumber: 1,
  randomizeFont: false,
  randomizeOrder: false,
  displayEnglish: true,
  wordCount: 24,
  soundEnabled: false,
  soundMode: "correct",
};

const nextSetNumber = (current: number) =>
  current >= SPEED_KATAKANA_TOTAL_SETS ? 1 : current + 1;

const SpeedKatakanaScreen = () => {
  useHtmlDocumentTitle("Speed Katakana");

  const [phase, setPhase] = useState<Phase>("initial");
  const [settings, setSettings] =
    useState<SpeedKatakanaSettings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);

  // Recomputes whenever phase changes so the count reflects newly recorded sets.
  const completedSetsCount = useMemo(
    () => countCompletedSets(SPEED_KATAKANA_TOTAL_SETS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase]
  );

  const headerProgress =
    phase === "initial"
      ? (completedSetsCount / SPEED_KATAKANA_TOTAL_SETS) * 100
      : progress;

  const goToInitial = () => {
    setProgress(0);
    setPhase("initial");
  };

  const startGame = (next: SpeedKatakanaSettings) => {
    setSettings(next);
    setProgress(0);
    setPhase("playing");
  };

  const finishGame = (sessionStats: SessionStats) => {
    if (settings.wordCount === 48) {
      recordSetResult(settings.setNumber, sessionStats);
    }
    setStats(sessionStats);
    setPhase("ended");
  };

  const startNextChallenge = () => {
    setSettings((prev) => ({
      ...prev,
      setNumber: nextSetNumber(prev.setNumber),
    }));
    setProgress(0);
    setPhase("playing");
  };

  return (
    <>
      <SpeedKatakanaHeader progress={headerProgress} />
      <main className="px-4 pt-12 h-dvh bg-background">
        {phase === "initial" && (
          <InitialScreen initialSettings={settings} onStart={startGame} />
        )}

        {phase === "playing" && (
          // Remount per challenge set so all game state resets cleanly.
          <Game
            key={settings.setNumber}
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
            totalSets={SPEED_KATAKANA_TOTAL_SETS}
          />
        )}
      </main>
    </>
  );
};

export default SpeedKatakanaScreen;
