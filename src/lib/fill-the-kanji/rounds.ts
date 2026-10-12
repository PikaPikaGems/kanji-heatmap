import setSizes from "./set-sizes.json";
import chunking from "./chunking.json";
import { FILL_THE_KANJI_SETS, FillTheKanjiSetId } from "./sets";

/**
 * Sentences per round. Leftovers (< ROUND_SIZE) join the last round. Shared
 * with jp-misc-data's kanji-heatmap-build/scripts/generate-fill-the-kanji.mjs through chunking.json,
 * which that build owns and copies here.
 */
export const ROUND_SIZE = chunking.roundSize;

/**
 * Rounds per set file: the generator splits each set into files of this many
 * rounds, so a round only downloads its own file, not the whole set.
 */
export const ROUNDS_PER_CHUNK = chunking.roundsPerChunk;

const SET_SIZES = setSizes as Record<string, number>;

/** Number of rows in a set, from the generator's committed size file. */
export const setRowCount = (setId: FillTheKanjiSetId): number =>
  SET_SIZES[setId] ?? 0;

/** Row count rounded down to the hundred, e.g. 1,944 → "1,900+". */
export const approxRowCountLabel = (setId: FillTheKanjiSetId): string =>
  `${(Math.floor(setRowCount(setId) / 100) * 100).toLocaleString("en-US")}+`;

/** Rounds in a set: rows cut into ROUND_SIZE chunks, remainder merged. */
export const roundCount = (setId: FillTheKanjiSetId): number =>
  Math.max(1, Math.floor(setRowCount(setId) / ROUND_SIZE));

/**
 * Row range [start, end) for a 1-based round. Rounds follow file order, so a
 * round is always the same sentences; the last round also takes the leftover
 * rows (e.g. 4,803 rows → round 240 has 23).
 */
export const roundRowRange = (
  setId: FillTheKanjiSetId,
  round: number
): [number, number] => {
  const rounds = roundCount(setId);
  const start = (round - 1) * ROUND_SIZE;
  const end = round >= rounds ? setRowCount(setId) : start + ROUND_SIZE;
  return [start, end];
};

/** 0-based index of the set file (chunk) that holds a 1-based round. */
export const chunkOfRound = (round: number): number =>
  Math.floor((round - 1) / ROUNDS_PER_CHUNK);

/** First set row in a chunk; the last chunk also holds the leftover rows. */
export const chunkRowStart = (chunk: number): number =>
  chunk * ROUNDS_PER_CHUNK * ROUND_SIZE;

export const isValidRound = (setId: FillTheKanjiSetId, round: number) =>
  Number.isInteger(round) && round >= 1 && round <= roundCount(setId);

export const isFillTheKanjiSetId = (
  value: string
): value is FillTheKanjiSetId =>
  FILL_THE_KANJI_SETS.some((set) => set.id === value);

export const setLabel = (setId: FillTheKanjiSetId): string =>
  FILL_THE_KANJI_SETS.find((set) => set.id === setId)?.label ?? setId;

export const totalRoundCount = (): number =>
  FILL_THE_KANJI_SETS.reduce((sum, set) => sum + roundCount(set.id), 0);

/**
 * Rounds are grouped into levels of 10 for picking and labels, like speed
 * katakana's challenges: round 27 is "3-7" (level 3, 7th round in it).
 */
export const ROUNDS_PER_LEVEL = 10;

export const levelCount = (setId: FillTheKanjiSetId): number =>
  Math.ceil(roundCount(setId) / ROUNDS_PER_LEVEL);

export const levelOfRound = (round: number): number =>
  Math.ceil(round / ROUNDS_PER_LEVEL);

export const positionInLevel = (round: number): number =>
  ((round - 1) % ROUNDS_PER_LEVEL) + 1;

export const roundFromLevelAndPos = (level: number, pos: number): number =>
  (level - 1) * ROUNDS_PER_LEVEL + pos;

/** Rounds in a level: 10, except possibly fewer in a set's last level. */
export const roundsInLevel = (
  setId: FillTheKanjiSetId,
  level: number
): number =>
  Math.max(
    0,
    Math.min(
      ROUNDS_PER_LEVEL,
      roundCount(setId) - (level - 1) * ROUNDS_PER_LEVEL
    )
  );

/** "3-7" for round 27. */
export const roundLabel = (round: number): string =>
  `${levelOfRound(round)}-${positionInLevel(round)}`;
