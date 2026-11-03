import type { GenericChallengeSummary, LocalDate } from "engine-contract";
import { sentencesInBatches } from "./batches";
import type { FillTheKanjiSetId } from "./sets";

/**
 * Stats for one finished batch. Only full batches are recorded, and only how
 * often and when: scores are deliberately not stored.
 */
export type BatchStats = {
  attemptCount: number;
  /** Day of the most recent finished attempt. */
  lastAttemptedAt: LocalDate;
};

/** Per-set map of 1-based batch number → stats; only batches with an attempt. */
export type SetBatchStats = Record<number, BatchStats>;

/** Every set's stats; a set with no attempts has an empty map. */
export type AllSetBatchStats = ReadonlyMap<FillTheKanjiSetId, SetBatchStats>;

export const toSetBatchStats = (
  summaries: GenericChallengeSummary[]
): SetBatchStats => {
  const stats: SetBatchStats = {};
  for (const { challengeId, attemptCount, lastAttemptedAt } of summaries) {
    stats[challengeId] = { attemptCount, lastAttemptedAt };
  }
  return stats;
};

/** Rows (phrases) seen in a set: every row of its finished batches. */
export const rowsSeen = (
  setId: FillTheKanjiSetId,
  stats: SetBatchStats
): number => sentencesInBatches(setId, Object.keys(stats));

export const countPlayedBatches = (stats: SetBatchStats): number =>
  Object.keys(stats).length;

export const countAllPlayedBatches = (all: AllSetBatchStats): number => {
  let sum = 0;
  for (const stats of all.values()) sum += countPlayedBatches(stats);
  return sum;
};
