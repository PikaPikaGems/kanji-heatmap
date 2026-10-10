import { notifyStorage, safeReadJson } from "@/lib/storage";
import { FILL_THE_KANJI_SETS, FillTheKanjiSetId } from "./sets";

/** Stats for one finished round. Only full rounds are recorded. */
export type RoundStats = {
  attemptCount: number;
  /** ms since epoch of the most recent finished attempt. */
  lastAttempted: number;
  /** Sentences answered correctly in the latest / best attempt. */
  latestCorrect: number;
  bestCorrect: number;
  /** Sentences in the round when last played (20, or more for the last round). */
  itemCount: number;
};

/** Per-set map of 1-based round number → stats. */
export type SetRoundStats = Record<string, RoundStats>;

export const STATS_KEY_PREFIX = "fill-the-kanji-stats-";

const statsKey = (setId: FillTheKanjiSetId) => `${STATS_KEY_PREFIX}${setId}`;

export const readSetRoundStats = (setId: FillTheKanjiSetId): SetRoundStats =>
  safeReadJson<SetRoundStats>(statsKey(setId), {});

export const readRoundStats = (
  setId: FillTheKanjiSetId,
  round: number
): RoundStats | null => readSetRoundStats(setId)[String(round)] ?? null;

export const countAttemptedRounds = (setId: FillTheKanjiSetId): number =>
  Object.keys(readSetRoundStats(setId)).length;

export const countAllAttemptedRounds = (): number =>
  FILL_THE_KANJI_SETS.reduce(
    (sum, set) => sum + countAttemptedRounds(set.id),
    0
  );

/** Merges one finished round into the stored stats for its set. */
export const recordRoundAttempt = (
  setId: FillTheKanjiSetId,
  round: number,
  correct: number,
  itemCount: number,
  at: Date = new Date()
): void => {
  const all = readSetRoundStats(setId);
  const prev = all[String(round)];
  all[String(round)] = {
    attemptCount: (prev?.attemptCount ?? 0) + 1,
    lastAttempted: at.getTime(),
    latestCorrect: correct,
    bestCorrect: Math.max(correct, prev?.bestCorrect ?? 0),
    itemCount,
  };
  try {
    localStorage.setItem(statsKey(setId), JSON.stringify(all));
    notifyStorage(statsKey(setId));
  } catch {
    // ignore storage write failures (e.g. private mode quota)
  }
};
