import { safeReadJson, notifyStorage } from "@/lib/storage";
import { roundedMean } from "@/lib/utils";
import { SessionStats } from "./types";

export type ChallengeSetStats = {
  latestAccuracy: number;
  bestAccuracy: number;
  latestCpm: number;
  bestCpm: number;
  timesTaken: number;
  /**
   * Best CPM among attempts with accuracy > 70%.
   * Missing/0 means no qualifying attempt yet (dashboard treats as not attempted).
   */
  bestCpmWithAccuracyOver70?: number;
};

export const STATS_KEY_PREFIX = "speed-katakana-stats-";

const statsKey = (setNumber: number) => `${STATS_KEY_PREFIX}${setNumber}`;

/** Returns the stored stats for a challenge set, or null if never attempted. */
export const readSetStats = (setNumber: number): ChallengeSetStats | null =>
  safeReadJson<ChallengeSetStats | null>(statsKey(setNumber), null);

/** Returns how many unique sets have recorded stats out of totalSets. */
export const countCompletedSets = (totalSets: number): number => {
  let count = 0;
  for (let i = 1; i <= totalSets; i++) {
    if (readSetStats(i) !== null) count++;
  }
  return count;
};

/** Returns the average latestCpm across all completed sets, or null if none. */
export const computeAverageCpm = (totalSets: number): number | null => {
  const cpms: number[] = [];
  for (let i = 1; i <= totalSets; i++) {
    const stats = readSetStats(i);
    if (stats) cpms.push(stats.latestCpm);
  }
  return roundedMean(cpms);
};

/** Merges a finished session's result into the stored stats for a set. */
export const recordSetResult = (
  setNumber: number,
  { accuracy, charsPerMinute }: SessionStats
): void => {
  const prev = readSetStats(setNumber);
  const next: ChallengeSetStats = {
    latestAccuracy: accuracy,
    bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
    latestCpm: charsPerMinute,
    bestCpm: Math.max(charsPerMinute, prev?.bestCpm ?? 0),
    timesTaken: (prev?.timesTaken ?? 0) + 1,
    bestCpmWithAccuracyOver70:
      accuracy > 70
        ? Math.max(charsPerMinute, prev?.bestCpmWithAccuracyOver70 ?? 0)
        : prev?.bestCpmWithAccuracyOver70,
  };
  try {
    localStorage.setItem(statsKey(setNumber), JSON.stringify(next));
    notifyStorage(statsKey(setNumber));
  } catch {
    // ignore storage write failures (e.g. private mode quota)
  }
};
