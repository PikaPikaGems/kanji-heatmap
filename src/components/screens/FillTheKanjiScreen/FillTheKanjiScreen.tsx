import { useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { PracticeShell } from "@/components/shared-practice";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { recordActivity } from "@/lib/activity";
import {
  batchCount,
  batchLabel,
  setLabel,
  totalBatchCount,
} from "@/lib/fill-the-kanji/batches";
import {
  countAllAttemptedBatches,
  recordBatchAttempt,
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

  const { settings, setId, batch, selectBatch } = useFillTheKanjiSettings();
  const [phase, setPhase] = useState<Phase>("initial");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ItemResult[] | null>(null);
  // Bumped per start so "Retry mistakes" remounts the game with new blanks.
  const [playKey, setPlayKey] = useState(0);
  // Sentences being retried; null while playing a full batch. A retry isn't
  // a batch attempt, so it isn't recorded in the stats.
  const [retryJp, setRetryJp] = useState<string[] | null>(null);

  // Re-render the start screen's counts when a batch is recorded.
  useStorageRevision((key) => key == null || key.startsWith(STATS_KEY_PREFIX));

  const headerProgress =
    phase === "initial"
      ? (countAllAttemptedBatches() / totalBatchCount()) * 100
      : progress;

  const play = (onlyJp: string[] | null = null) => {
    setRetryJp(onlyJp);
    setProgress(0);
    setResults(null);
    setPlayKey((k) => k + 1);
    setPhase("playing");
  };

  const goToInitial = () => {
    setProgress(0);
    setPhase("initial");
  };

  const finishBatch = (batchResults: ItemResult[]) => {
    if (retryJp == null) {
      recordBatchAttempt(setId, batch);
      recordActivity("fillTheKanji");
    }
    setResults(batchResults);
    setPhase("ended");
  };

  const playNextBatch = () => {
    selectBatch(setId, batch >= batchCount(setId) ? 1 : batch + 1);
    play();
  };

  return (
    <PracticeShell progress={headerProgress}>
      {phase === "initial" && (
        <div key="initial" className="h-full animate-fade-in">
          <InitialScreen onStart={() => play()} />
        </div>
      )}

      {phase === "playing" && (
        <div key={`playing-${playKey}`} className="h-full animate-fade-in">
          <Game
            setId={setId}
            batch={batch}
            onlyJp={retryJp}
            settings={settings}
            onProgress={setProgress}
            onComplete={finishBatch}
            onEnd={goToInitial}
          />
        </div>
      )}

      {phase === "ended" && results && (
        <div key="ended" className="h-full animate-fade-in">
          <EndSession
            results={results}
            batchLabel={`${setLabel(setId)} · Batch ${batchLabel(batch)}`}
            onNext={playNextBatch}
            onRetryMistakes={() =>
              play(results.filter((r) => !r.correct).map((r) => r.item.jp))
            }
            onEnd={goToInitial}
          />
        </div>
      )}
    </PracticeShell>
  );
};

export default FillTheKanjiScreen;
