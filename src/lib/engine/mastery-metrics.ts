import type { CardProgress, ReviewPileItemView } from "engine-contract";

/**
 * How review-pile cards are bucketed for mastery views (design 5.9 / 5.10).
 * Pure functions over `reviews.pile.watchAll()` rows.
 */

/** A kanji's reading card, its writing card, or the weaker of the two. */
export type MasteryCardKind = "reading" | "writing" | "combined";
export type MasteryMetric = "mastery" | "stability" | "difficulty";

/** In the order the dashboard toggle lists them. */
export const MASTERY_METRICS: readonly MasteryMetric[] = [
  "mastery",
  "stability",
  "difficulty",
];

export const MASTERY_METRIC_TITLES: Record<MasteryMetric, string> = {
  mastery: "Mastery",
  stability: "Stability",
  difficulty: "Difficulty",
};

/** A card counts once it has left `new`; pile items start with two new cards. */
export const isCardStarted = (card: CardProgress): boolean =>
  card.learningState !== "new";

const DAY_MS = 24 * 60 * 60 * 1000;

// Mastery levels (design 5.12, guide/REVIEWS "Progress levels for UIs"), in
// days. `age` is time since the first review; `interval` is `dueAt -
// lastReviewedAt`, the interval set at the last review, which does not shrink
// as the card nears its due date. A lapse shortens the interval, so a
// forgotten card falls back to Fresh by itself.
const BURNED_MIN_AGE_DAYS = 300;
const BURNED_MIN_INTERVAL_DAYS = 330;
const MATURE_MIN_AGE_DAYS = 180;
const MATURE_MIN_INTERVAL_DAYS = 180;
const FRESH_BELOW_DAYS = 30;

/** Lowest level first. */
export const MASTERY_LEVEL_LABELS: readonly string[] = [
  "Fresh",
  "Growing",
  "Mature",
  "Burned",
];

/** The rules in words (from the constants above), for UI hints. */
export const MASTERY_RULES_HINT = [
  `Fresh: first studied under ${FRESH_BELOW_DAYS} days ago, or its last review set the next one less than ${FRESH_BELOW_DAYS} days out.`,
  `Mature: studied for ${MATURE_MIN_AGE_DAYS}+ days and the next review was set ${MATURE_MIN_INTERVAL_DAYS}+ days out.`,
  `Burned: ${BURNED_MIN_AGE_DAYS}+ days and ${BURNED_MIN_INTERVAL_DAYS}+ days.`,
  "Growing is everything between.",
].join(" ");

const FRESH_LEVEL = 0;
const GROWING_LEVEL = 1;
const MATURE_LEVEL = 2;
const BURNED_LEVEL = 3;

/**
 * 0-based mastery level of a started card at time `now` (ms): first match
 * wins. Started cards always carry both review times; without them nothing
 * proves the card has lasted, so it stays Fresh.
 */
export const masteryLevel = (card: CardProgress, now: number): number => {
  if (!card.firstReviewedAt || !card.lastReviewedAt) return FRESH_LEVEL;
  const ageDays = (now - Date.parse(card.firstReviewedAt)) / DAY_MS;
  const intervalDays =
    (Date.parse(card.dueAt) - Date.parse(card.lastReviewedAt)) / DAY_MS;

  if (
    ageDays >= BURNED_MIN_AGE_DAYS &&
    intervalDays >= BURNED_MIN_INTERVAL_DAYS
  ) {
    return BURNED_LEVEL;
  }
  if (
    ageDays >= MATURE_MIN_AGE_DAYS &&
    intervalDays >= MATURE_MIN_INTERVAL_DAYS
  ) {
    return MATURE_LEVEL;
  }
  if (ageDays < FRESH_BELOW_DAYS || intervalDays < FRESH_BELOW_DAYS) {
    return FRESH_LEVEL;
  }
  return GROWING_LEVEL;
};

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
  "≥365d",
];

export const STABILITY_BAND_COUNT = STABILITY_BAND_LABELS.length;

/** 0-based band of a stability in days. */
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

const cardBand = (
  card: CardProgress,
  measure: MasteryMetric,
  now: number
): number => {
  if (measure === "mastery") return masteryLevel(card, now);
  if (measure === "stability") return stabilityBand(card.stability);
  return difficultyBand(card.difficulty);
};

/**
 * The 0-based band (lowest value first) a pile item falls in for one card
 * kind and measure, or `null` for "Not started". Combined needs both cards
 * started and takes the lower mastery level or stability band, but the higher
 * difficulty band. `now` (ms) only matters for mastery.
 */
export const itemBand = (
  item: ReviewPileItemView,
  kind: MasteryCardKind,
  measure: MasteryMetric,
  now: number
): number | null => {
  if (kind === "reading" || kind === "writing") {
    const card = item[kind];
    return isCardStarted(card) ? cardBand(card, measure, now) : null;
  }
  if (!isCardStarted(item.reading) || !isCardStarted(item.writing)) {
    return null;
  }
  const reading = cardBand(item.reading, measure, now);
  const writing = cardBand(item.writing, measure, now);
  return measure === "difficulty"
    ? Math.max(reading, writing)
    : Math.min(reading, writing);
};
