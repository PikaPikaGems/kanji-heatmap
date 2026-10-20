import { useCallback, useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "@/hooks/routing-hooks";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAllSetBatchStats } from "@/hooks/use-all-set-batch-stats";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import {
  isFillTheKanjiSetId,
  isValidBatch,
  batchCount,
} from "@/lib/fill-the-kanji/batches";
import { AllSetBatchStats } from "@/lib/fill-the-kanji/progress";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { FillTheKanjiSettings } from "./types";

const SET_PARAM = URL_PARAMS.fillTheKanjiSet;
const BATCH_PARAM = URL_PARAMS.fillTheKanjiBatch;

/**
 * First batch of a set with no recorded attempt, or 1 when all are played or
 * the stats aren't available (logged out, still loading).
 */
const firstUnplayedBatch = (
  setId: FillTheKanjiSetId,
  allStats: AllSetBatchStats | null
): number => {
  const stats = allStats?.get(setId);
  if (!stats) return 1;
  const total = batchCount(setId);
  for (let batch = 1; batch <= total; batch++) {
    if (!stats[batch]) return batch;
  }
  return 1;
};

/** The batch to show for a set: the remembered one, else the first unplayed. */
export const selectedBatchFor = (
  settings: FillTheKanjiSettings,
  setId: FillTheKanjiSetId,
  allStats: AllSetBatchStats | null
): number => {
  const remembered = settings.batchBySet[setId];
  return remembered != null && isValidBatch(setId, remembered)
    ? remembered
    : firstUnplayedBatch(setId, allStats);
};

/**
 * Settings for the start screen, kept in sync with `?set=` and `?batch=`:
 * - Valid URL params → settings (so a dashboard "Practice Now" link lands on
 *   that batch)
 * - Invalid params → removed from the URL (replace)
 * - Selecting a set or batch → URL (replace, so browsing doesn't spam history)
 */
export const useFillTheKanjiSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSetting] = useLocalStorage<FillTheKanjiSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  // Stored settings may be from an older shape or name a removed set.
  const setId = isFillTheKanjiSetId(settings.setId)
    ? settings.setId
    : DEFAULT_SETTINGS.setId;
  const storedBatchBySet = settings.batchBySet;
  const batchBySet = useMemo(() => storedBatchBySet ?? {}, [storedBatchBySet]);
  const resolved: FillTheKanjiSettings = { ...settings, setId, batchBySet };
  const allStats = useAllSetBatchStats();
  const batch = selectedBatchFor(resolved, setId, allStats);

  const rawSet = searchParams.get(SET_PARAM);
  const rawBatch = searchParams.get(BATCH_PARAM);
  const setFromUrl =
    rawSet != null && isFillTheKanjiSetId(rawSet) ? rawSet : null;
  const batchNumber = rawBatch == null ? NaN : Number(rawBatch);
  const batchFromUrl =
    setFromUrl != null && isValidBatch(setFromUrl, batchNumber)
      ? batchNumber
      : null;

  useLayoutEffect(() => {
    const badSet = rawSet != null && setFromUrl == null;
    const badBatch = rawBatch != null && batchFromUrl == null;
    if (badSet || badBatch) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (badSet) next.delete(SET_PARAM);
          if (badBatch) next.delete(BATCH_PARAM);
          return next;
        },
        { replace: true }
      );
    }

    if (setFromUrl != null && setFromUrl !== setId) {
      setSetting("setId", setFromUrl);
    }
    if (
      setFromUrl != null &&
      batchFromUrl != null &&
      batchBySet[setFromUrl] !== batchFromUrl
    ) {
      setSetting("batchBySet", { ...batchBySet, [setFromUrl]: batchFromUrl });
    }
  }, [
    rawSet,
    rawBatch,
    setFromUrl,
    batchFromUrl,
    setId,
    batchBySet,
    setSetting,
    setSearchParams,
  ]);

  const syncToUrl = useCallback(
    (nextSet: FillTheKanjiSetId, nextBatch: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SET_PARAM, nextSet);
          next.set(BATCH_PARAM, String(nextBatch));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectBatch = useCallback(
    (nextSet: FillTheKanjiSetId, nextBatch: number) => {
      setSetting("setId", nextSet);
      setSetting("batchBySet", { ...batchBySet, [nextSet]: nextBatch });
      syncToUrl(nextSet, nextBatch);
    },
    [batchBySet, setSetting, syncToUrl]
  );

  const selectSet = (nextSet: FillTheKanjiSetId) => {
    const remembered = { ...DEFAULT_SETTINGS, batchBySet };
    selectBatch(nextSet, selectedBatchFor(remembered, nextSet, allStats));
  };

  return {
    settings: resolved,
    setId,
    batch,
    setSetting,
    selectSet,
    selectBatch,
  };
};
