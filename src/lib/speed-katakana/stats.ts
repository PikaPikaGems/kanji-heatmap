import type { LocalDate, SpeedKatakanaChallengeSummary } from "engine-contract";
import { roundedMean } from "@/lib/utils";

export type PointerType = "fine" | "coarse";

/**
 * One challenge set's stats for one pointer type, as the game and dashboard
 * show them. Speed (cpm) and accuracy are the engine's `*Val` numbers.
 */
export type ChallengeSetStats = {
  latestAccuracy: number;
  bestAccuracy: number;
  latestCpm: number;
  bestCpm: number;
  timesTaken: number;
  /** Day of the most recent attempt. */
  lastAttemptedAt: LocalDate;
};

/** Every attempted set's stats by set number; unattempted sets are absent. */
export type AllChallengeSetStats = ReadonlyMap<number, ChallengeSetStats>;

/** The engine summary's figures for `pointerType`, or null if never attempted with it. */
export const toChallengeSetStats = (
  summary: SpeedKatakanaChallengeSummary,
  pointerType: PointerType
): ChallengeSetStats | null => {
  const ptr =
    pointerType === "coarse"
      ? summary.coarsePtrSummary
      : summary.finePtrSummary;
  if (!ptr) return null;
  return {
    latestAccuracy: ptr.latest.accuracyVal,
    bestAccuracy: ptr.best.accuracy.value,
    latestCpm: ptr.latest.cpmVal,
    bestCpm: ptr.best.cpm.value,
    timesTaken: ptr.attemptCount,
    lastAttemptedAt: ptr.latest.attemptedAt,
  };
};

export const toAllChallengeSetStats = (
  summaries: SpeedKatakanaChallengeSummary[],
  pointerType: PointerType
): AllChallengeSetStats => {
  const all = new Map<number, ChallengeSetStats>();
  for (const summary of summaries) {
    const stats = toChallengeSetStats(summary, pointerType);
    if (stats) all.set(summary.challengeId, stats);
  }
  return all;
};

/** How many sets have been attempted, and the average of their latest speeds. */
export const summarizeChallengeSetStats = (
  stats: AllChallengeSetStats | null
): { completed: number; averageCpm: number | null } => {
  const all = [...(stats?.values() ?? [])];
  return {
    completed: all.length,
    averageCpm: roundedMean(all.map((s) => s.latestCpm)),
  };
};
