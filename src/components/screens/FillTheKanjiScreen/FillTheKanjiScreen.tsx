import { useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { PracticeShell } from "@/components/shared-practice";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { recordActivity } from "@/lib/activity";
import {
  roundCount,
  roundLabel,
  setLabel,
  totalRoundCount,
} from "@/lib/fill-the-kanji/rounds";
import {
  countAllAttemptedRounds,
  recordRoundAttempt,
  STATS_KEY_PREFIX,
} from "@/lib/fill-the-kanji/storage";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { ItemResult } from "./types";
import { useFillTheKanjiSettings } from "./use-fill-the-kanji-settings";

type Phase = "initial" | "playing" | "ended";

const FillTheKanjiScreen = () => {
  useHtmlDocumentTitle(fillTheKanjiPageMeta.heading);

  const { settings, setId, round, selectRound } = useFillTheKanjiSettings();
  const [phase, setPhase] = useState<Phase>("initial");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ItemResult[] | null>(null);
  // Bumped per start so "Retry this round" remounts the game with new blanks.
  const [playKey, setPlayKey] = useState(0);

  // Re-render the start screen's counts when a round is recorded.
  useStorageRevision((key) => key == null || key.startsWith(STATS_KEY_PREFIX));

  const headerProgress =
    phase === "initial"
      ? (countAllAttemptedRounds() / totalRoundCount()) * 100
      : progress;

  const play = () => {
    setProgress(0);
    setResults(null);
    setPlayKey((k) => k + 1);
    setPhase("playing");
  };

  const goToInitial = () => {
    setProgress(0);
    setPhase("initial");
  };

  const finishRound = (roundResults: ItemResult[]) => {
    recordRoundAttempt(setId, round);
    recordActivity("fillTheKanji");
    setResults(roundResults);
    setPhase("ended");
  };

  const playNextRound = () => {
    selectRound(setId, round >= roundCount(setId) ? 1 : round + 1);
    play();
  };

  return (
    <PracticeShell progress={headerProgress}>
      {phase === "initial" && (
        <div key="initial" className="h-full animate-fade-in">
          <InitialScreen onStart={play} />
        </div>
      )}

      {phase === "playing" && (
        <div key={`playing-${playKey}`} className="h-full animate-fade-in">
          <Game
            setId={setId}
            round={round}
            settings={settings}
            onProgress={setProgress}
            onComplete={finishRound}
            onEnd={goToInitial}
          />
        </div>
      )}

      {phase === "ended" && results && (
        <div key="ended" className="h-full animate-fade-in">
          <EndSession
            results={results}
            roundLabel={`${setLabel(setId)} · Round ${roundLabel(round)}`}
            onNext={playNextRound}
            onRetry={play}
            onEnd={goToInitial}
          />
        </div>
      )}
    </PracticeShell>
  );
};

export default FillTheKanjiScreen;
