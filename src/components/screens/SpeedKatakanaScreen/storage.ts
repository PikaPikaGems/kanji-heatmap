import { SessionStats } from "./types";

export type ChallengeSetStats = {
  latestAccuracy: number;
  bestAccuracy: number;
  latestCpm: number;
  bestCpm: number;
  timesTaken: number;
};

const statsKey = (setNumber: number) =>
  `speed-katakana-stats-${setNumber}`;

/** Returns the stored stats for a challenge set, or null if never attempted. */
export const readSetStats = (setNumber: number): ChallengeSetStats | null => {
  try {
    const raw = localStorage.getItem(statsKey(setNumber));
    return raw ? (JSON.parse(raw) as ChallengeSetStats) : null;
  } catch {
    return null;
  }
};

/** Returns how many unique sets have recorded stats out of totalSets. */
export const countCompletedSets = (totalSets: number): number => {
  let count = 0;
  for (let i = 1; i <= totalSets; i++) {
    if (readSetStats(i) !== null) count++;
  }
  return count;
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
  };
  try {
    localStorage.setItem(statsKey(setNumber), JSON.stringify(next));
  } catch {
    // ignore storage write failures (e.g. private mode quota)
  }
};
