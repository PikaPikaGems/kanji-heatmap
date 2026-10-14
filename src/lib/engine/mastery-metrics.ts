import type { CardProgress, ReviewPileItemView } from "engine-contract";

/**
 * How review-pile cards are bucketed for mastery views (design 5.9 / 5.10).
 * Pure functions over `reviews.pile.watchAll()` rows.
 */

/** A kanji's reading card, its writing card, or the weaker of the two. */
export type MasteryCardKind = "reading" | "writing" | "combined";
export type MasteryMetric = "stability" | "difficulty";

export type CardMetrics = { stability: number; difficulty: number };

/** A card counts once it has left `new`; pile items start with two new cards. */
export const isCardStarted = (card: CardProgress): boolean =>
  card.learningState !== "new";

/**
 * Upper bounds (exclusive, in days) of every stability band but the last.
 * Stability is "days until recall probability drops to the target retention".
 */
const STABILITY_BAND_MAX_DAYS = [1, 7, 30, 90, 365] as const;

export const STABILITY_BAND_LABELS: readonly string[] = [
  "<1d",
  "1–7d",
  "7–30d",
  "30–90d",
  "90–365d",
  "≥365d (burned)",
];

export const STABILITY_BAND_COUNT = STABILITY_BAND_LABELS.length;

/** 0-based band of a stability in days; the last band is burned. */
export const stabilityBand = (stability: number): number => {
  const band = STABILITY_BAND_MAX_DAYS.findIndex((max) => stability < max);
  return band === -1 ? STABILITY_BAND_MAX_DAYS.length : band;
};

// FSRS difficulty runs 1..10 (higher = harder), split into equal bands.
const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;
const DIFFICULTY_BAND_COUNT = 5;
const DIFFICULTY_BAND_WIDTH =
  (DIFFICULTY_MAX - DIFFICULTY_MIN) / DIFFICULTY_BAND_COUNT;

const trimNumber = (n: number): string => String(Number(n.toFixed(1)));

export const DIFFICULTY_BAND_LABELS: readonly string[] = Array.from(
  { length: DIFFICULTY_BAND_COUNT },
  (_, band) =>
    `${trimNumber(DIFFICULTY_MIN + band * DIFFICULTY_BAND_WIDTH)}–${trimNumber(
      DIFFICULTY_MIN + (band + 1) * DIFFICULTY_BAND_WIDTH
    )}`
);

// Absorbs float error so a value on a band edge (2.8 - 1 is 1.7999999999999998)
// lands in the upper band like its label says.
const EDGE_EPSILON = 1e-9;

/** 0-based band of an FSRS difficulty (0 = easiest band). */
export const difficultyBand = (difficulty: number): number =>
  Math.min(
    DIFFICULTY_BAND_COUNT - 1,
    Math.max(
      0,
      Math.floor(
        (difficulty - DIFFICULTY_MIN) / DIFFICULTY_BAND_WIDTH + EDGE_EPSILON
      )
    )
  );

/**
 * The numbers a pile item contributes for one card kind, or `null` for "Not
 * started". Combined needs both cards started: the lower stability and the
 * higher difficulty of the two.
 */
export const cardMetrics = (
  item: ReviewPileItemView,
  kind: MasteryCardKind
): CardMetrics | null => {
  if (kind === "reading" || kind === "writing") {
    const card = item[kind];
    return isCardStarted(card) ? card : null;
  }
  if (!isCardStarted(item.reading) || !isCardStarted(item.writing)) {
    return null;
  }
  return {
    stability: Math.min(item.reading.stability, item.writing.stability),
    difficulty: Math.max(item.reading.difficulty, item.writing.difficulty),
  };
};
