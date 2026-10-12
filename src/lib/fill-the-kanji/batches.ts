import setSizes from "./set-sizes.json";
import chunking from "./chunking.json";
import { formatApproxCount } from "@/lib/format-count";
import { FILL_THE_KANJI_SETS, FillTheKanjiSetId } from "./sets";

/**
 * Sentences per batch, from chunking.json (generated, like the set files).
 * Leftovers (< BATCH_SIZE) join the last batch.
 */
export const BATCH_SIZE = chunking.batchSize;

/**
 * Batches per set file: the generator splits each set into files of this many
 * batches, so a batch only downloads its own file, not the whole set.
 */
export const BATCHES_PER_CHUNK = chunking.batchesPerChunk;

const SET_SIZES = setSizes as Record<string, number>;

/** Number of rows in a set, from the generator's committed size file. */
export const setRowCount = (setId: FillTheKanjiSetId): number =>
  SET_SIZES[setId] ?? 0;

/** Row count rounded down to the hundred, e.g. 1,944 → "1,900+". */
export const approxRowCountLabel = (setId: FillTheKanjiSetId): string =>
  formatApproxCount(setRowCount(setId));

/** Batches in a set: rows cut into BATCH_SIZE chunks, remainder merged. */
export const batchCount = (setId: FillTheKanjiSetId): number =>
  Math.max(1, Math.floor(setRowCount(setId) / BATCH_SIZE));

/**
 * Row range [start, end) for a 1-based batch. Batches follow file order, so a
 * batch is always the same sentences; the last batch also takes the leftover
 * rows (e.g. 4,793 rows → batch 239 has 33).
 */
export const batchRowRange = (
  setId: FillTheKanjiSetId,
  batch: number
): [number, number] => {
  const batches = batchCount(setId);
  const start = (batch - 1) * BATCH_SIZE;
  const end = batch >= batches ? setRowCount(setId) : start + BATCH_SIZE;
  return [start, end];
};

/** 0-based index of the set file (chunk) that holds a 1-based batch. */
export const chunkOfBatch = (batch: number): number =>
  Math.floor((batch - 1) / BATCHES_PER_CHUNK);

/** First set row in a chunk; the last chunk also holds the leftover rows. */
export const chunkRowStart = (chunk: number): number =>
  chunk * BATCHES_PER_CHUNK * BATCH_SIZE;

export const isValidBatch = (setId: FillTheKanjiSetId, batch: number) =>
  Number.isInteger(batch) && batch >= 1 && batch <= batchCount(setId);

export const isFillTheKanjiSetId = (
  value: string
): value is FillTheKanjiSetId =>
  FILL_THE_KANJI_SETS.some((set) => set.id === value);

export const setLabel = (setId: FillTheKanjiSetId): string =>
  FILL_THE_KANJI_SETS.find((set) => set.id === setId)?.label ?? setId;

export const totalBatchCount = (): number =>
  FILL_THE_KANJI_SETS.reduce((sum, set) => sum + batchCount(set.id), 0);

/**
 * Batches are grouped into levels of 10 for picking and labels, like speed
 * katakana's challenges: batch 27 is "3-7" (level 3, 7th batch in it).
 */
export const BATCHES_PER_LEVEL = 10;

export const levelCount = (setId: FillTheKanjiSetId): number =>
  Math.ceil(batchCount(setId) / BATCHES_PER_LEVEL);

export const levelOfBatch = (batch: number): number =>
  Math.ceil(batch / BATCHES_PER_LEVEL);

export const positionInLevel = (batch: number): number =>
  ((batch - 1) % BATCHES_PER_LEVEL) + 1;

export const batchFromLevelAndPos = (level: number, pos: number): number =>
  (level - 1) * BATCHES_PER_LEVEL + pos;

/** Batches in a level: 10, except possibly fewer in a set's last level. */
export const batchesInLevel = (
  setId: FillTheKanjiSetId,
  level: number
): number =>
  Math.max(
    0,
    Math.min(
      BATCHES_PER_LEVEL,
      batchCount(setId) - (level - 1) * BATCHES_PER_LEVEL
    )
  );

/** "3-7" for batch 27. */
export const batchLabel = (batch: number): string =>
  `${levelOfBatch(batch)}-${positionInLevel(batch)}`;
