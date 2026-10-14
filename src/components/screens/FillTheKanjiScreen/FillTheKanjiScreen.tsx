import { useRef, useState } from "react";
import type { EngineAPI } from "engine-contract";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useAllSetBatchStats } from "@/hooks/use-all-set-batch-stats";
import { PracticeShell } from "@/components/shared-practice";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { recordActivity } from "@/lib/activity";
import { copyForCode } from "@/lib/engine/engine-copy";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { useEngineApi } from "@/lib/engine/use-engine-query";
import {
  batchCount,
  batchLabel,
  setLabel,
  totalBatchCount,
} from "@/lib/fill-the-kanji/batches";
import { batchCompletedRecord } from "@/lib/fill-the-kanji/activity";
import { countAllPlayedBatches } from "@/lib/fill-the-kanji/progress";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { ItemResult } from "./types";
import { useFillTheKanjiSettings } from "./use-fill-the-kanji-settings";

type Phase = "initial" | "playing" | "ended";

const FillTheKanjiScreen = () => {
  useHtmlDocumentTitle(fillTheKanjiPageMeta.heading);

  const { settings, setId, batch, selectBatch } = useFillTheKanjiSettings();
  const account = useAccountStatus();
  const api = useEngineApi();
  const allStats = useAllSetBatchStats();
  const [phase, setPhase] = useState<Phase>("initial");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ItemResult[] | null>(null);
  // Bumped per start so "Retry mistakes" remounts the game with new blanks.
  const [playKey, setPlayKey] = useState(0);
  // Sentences being retried; null while playing a full batch. A retry isn't
  // a batch attempt, so it isn't recorded in the stats.
  const [retryJp, setRetryJp] = useState<string[] | null>(null);
  // When the current batch started playing; sent with its engine record.
  const startedAtRef = useRef(0);
  // Why the finished batch couldn't be saved, shown on the end screen. Tagged
  // with the play it belongs to so a late answer never shows on a later one.
  const [saveFailure, setSaveFailure] = useState<{
    playKey: number;
    message: string;
  } | null>(null);

  const headerProgress =
    phase === "initial"
      ? ((allStats ? countAllPlayedBatches(allStats) : 0) / totalBatchCount()) *
        100
      : progress;

  const play = (onlyJp: string[] | null = null) => {
    startedAtRef.current = Date.now();
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

  const saveBatch = async (engine: EngineAPI) => {
    const forPlay = playKey;
    const result = await engine.activity.record(
      batchCompletedRecord(setId, batch, startedAtRef.current)
    );
    if (!result.ok) {
      setSaveFailure({
        playKey: forPlay,
        message: copyForCode(result.error.code),
      });
    }
  };

  const finishBatch = (batchResults: ItemResult[]) => {
    if (retryJp == null) {
      recordActivity("fillTheKanji");
      if (account.kind === "active" && api) void saveBatch(api);
    }
    setResults(batchResults);
    setPhase("ended");
  };

  const startSelectedBatch = () => {
    // Pin the shown batch: until one is remembered it follows the first
    // unplayed batch, which moves on as soon as this one is saved.
    selectBatch(setId, batch);
    play();
  };

  const playNextBatch = () => {
    selectBatch(setId, batch >= batchCount(setId) ? 1 : batch + 1);
    play();
  };

  return (
    <>
      <PracticeShell progress={headerProgress}>
        {phase === "initial" && (
          <div key="initial" className="h-full animate-fade-in">
            <InitialScreen onStart={startSelectedBatch} />
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
              saveError={
                saveFailure?.playKey === playKey ? saveFailure.message : null
              }
              onNext={playNextBatch}
              onRetryMistakes={() =>
                play(results.filter((r) => !r.correct).map((r) => r.item.jp))
              }
              onEnd={goToInitial}
            />
          </div>
        )}
      </PracticeShell>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default FillTheKanjiScreen;
