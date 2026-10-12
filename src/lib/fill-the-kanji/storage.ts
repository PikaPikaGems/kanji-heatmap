import { notifyStorage, safeReadJson } from "@/lib/storage";
import { FILL_THE_KANJI_SETS, FillTheKanjiSetId } from "./sets";

/**
 * Stats for one finished batch. Only full batches are recorded, and only how
 * often and when: scores are deliberately not stored.
 */
export type BatchStats = {
  attemptCount: number;
  /** ms since epoch of the most recent finished attempt. */
  lastAttempted: number;
};

/** Per-set map of 1-based batch number → stats. */
export type SetBatchStats = Record<string, BatchStats>;

export const STATS_KEY_PREFIX = "fill-the-kanji-stats-";

const statsKey = (setId: FillTheKanjiSetId) => `${STATS_KEY_PREFIX}${setId}`;

export const readSetBatchStats = (setId: FillTheKanjiSetId): SetBatchStats =>
  safeReadJson<SetBatchStats>(statsKey(setId), {});

export const readBatchStats = (
  setId: FillTheKanjiSetId,
  batch: number
): BatchStats | null => readSetBatchStats(setId)[String(batch)] ?? null;

export const countAttemptedBatches = (setId: FillTheKanjiSetId): number =>
  Object.keys(readSetBatchStats(setId)).length;

export const countAllAttemptedBatches = (): number =>
  FILL_THE_KANJI_SETS.reduce(
    (sum, set) => sum + countAttemptedBatches(set.id),
    0
  );

/**
 * Merges one finished batch into the stored stats for its set. Rewrites every
 * batch with only the BatchStats fields, which also drops the scores
 * (latestCorrect / bestCorrect / itemCount) that older versions stored.
 */
export const recordBatchAttempt = (
  setId: FillTheKanjiSetId,
  batch: number,
  at: Date = new Date()
): void => {
  const all: SetBatchStats = {};
  for (const [key, { attemptCount, lastAttempted }] of Object.entries(
    readSetBatchStats(setId)
  )) {
    all[key] = { attemptCount, lastAttempted };
  }
  all[String(batch)] = {
    attemptCount: (all[String(batch)]?.attemptCount ?? 0) + 1,
    lastAttempted: at.getTime(),
  };
  try {
    localStorage.setItem(statsKey(setId), JSON.stringify(all));
    notifyStorage(statsKey(setId));
  } catch {
    // ignore storage write failures (e.g. private mode quota)
  }
};
