import type {
  CardProgress,
  CardType,
  ReviewPileItemView,
} from "engine-contract";
import { ALL_CARD_TYPES, cardProgress } from "./card-types";

/**
 * How review-pile cards are bucketed for mastery views (design 5.9 / 5.10).
 * Pure functions over `reviews.pile.watchAll()` rows.
 */

/** One of a kanji's cards, or all of them together (the weakest). */
export type MasteryCardKind = CardType | "combined";
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

/** A band's name and, in a few words, what puts a card in it. */
export type BandInfo = { label: string; rule: string };

// Mastery levels (design 5.12, guide/REVIEWS "Progress levels for UIs"), in
// days. `age` is time since the first review; `interval` is `dueAt -
// lastReviewedAt`, the interval set at the last review, which does not shrink
// as the card nears its due date. A lapse shortens the interval, so a
// forgotten card falls back to Fresh by itself.
export const MASTERED_MIN_DAYS = 330;
const MATURE_MIN_DAYS = 180;
const FRESH_BELOW_DAYS = 45;

/** Lowest level first; the rules are written from the constants above. */
export const MASTERY_LEVELS: readonly BandInfo[] = [
  {
    label: "Fresh",
    rule: `First reviewed under ${FRESH_BELOW_DAYS} days ago, or next review under ${FRESH_BELOW_DAYS} days out`,
  },
  { label: "Growing", rule: "Past Fresh, not yet Mature" },
  {
    label: "Mature",
    rule: `First reviewed ${MATURE_MIN_DAYS}+ days ago, and next review ${MATURE_MIN_DAYS}+ days out`,
  },
  {
    label: "Mastered",
    rule: `First reviewed ${MASTERED_MIN_DAYS}+ days ago, and next review ${MASTERED_MIN_DAYS}+ days out`,
  },
];

export const MASTERY_LEVEL_LABELS: readonly string[] = MASTERY_LEVELS.map(
  ({ label }) => label
);

const FRESH_LEVEL = 0;
const GROWING_LEVEL = 1;
const MATURE_LEVEL = 2;
const MASTERED_LEVEL = 3;

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

  if (ageDays >= MASTERED_MIN_DAYS && intervalDays >= MASTERED_MIN_DAYS) {
    return MASTERED_LEVEL;
  }
  if (ageDays >= MATURE_MIN_DAYS && intervalDays >= MATURE_MIN_DAYS) {
    return MATURE_LEVEL;
  }
  if (ageDays < FRESH_BELOW_DAYS || intervalDays < FRESH_BELOW_DAYS) {
    return FRESH_LEVEL;
  }
  return GROWING_LEVEL;
};

/**
 * Upper bounds (exclusive, in days) of every stability band but the last:
 * 45 days, 8 months, 1 year. Stability is "days until recall probability
 * drops to the target retention".
 */
const STABILITY_BAND_MAX_DAYS = [45, 240, 365] as const;

/** Lowest stability first. */
export const STABILITY_BANDS: readonly BandInfo[] = [
  { label: "Under 45 days", rule: "Fades within weeks" },
  { label: "45 days – 8 months", rule: "Lasts a few months" },
  { label: "8 months – 1 year", rule: "Lasts most of a year" },
  { label: "At least 1 year", rule: "Lasts a year or more" },
];

/** 0-based band of a stability in days. */
export const stabilityBand = (stability: number): number => {
  const band = STABILITY_BAND_MAX_DAYS.findIndex((max) => stability < max);
  return band === -1 ? STABILITY_BAND_MAX_DAYS.length : band;
};

// FSRS difficulty runs 1..10 (higher = harder), split into equal bands.
const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;

// Hardest first: brighter is always better, so the easiest band is the
// brightest.
const DIFFICULTY_BAND_RULES = [
  "Missed a lot",
  "Often tricky",
  "Takes some effort",
  "Comes easily",
] as const;

const DIFFICULTY_BAND_COUNT = DIFFICULTY_BAND_RULES.length;
const DIFFICULTY_BAND_WIDTH =
  (DIFFICULTY_MAX - DIFFICULTY_MIN) / DIFFICULTY_BAND_COUNT;

const trimNumber = (n: number): string => String(Number(n.toFixed(2)));

/** Hardest first. */
export const DIFFICULTY_BANDS: readonly BandInfo[] = DIFFICULTY_BAND_RULES.map(
  (rule, band) => {
    const fromTop = DIFFICULTY_BAND_COUNT - band;
    const min = DIFFICULTY_MIN + (fromTop - 1) * DIFFICULTY_BAND_WIDTH;
    const max = DIFFICULTY_MIN + fromTop * DIFFICULTY_BAND_WIDTH;
    return { label: `${trimNumber(min)}–${trimNumber(max)}`, rule };
  }
);

// Absorbs float error so a value on a band edge lands in the harder band like
// its label says.
const EDGE_EPSILON = 1e-9;

/** 0-based band of an FSRS difficulty (0 = hardest band). */
export const difficultyBand = (difficulty: number): number => {
  const fromEasiest = Math.min(
    DIFFICULTY_BAND_COUNT - 1,
    Math.max(
      0,
      Math.floor(
        (difficulty - DIFFICULTY_MIN) / DIFFICULTY_BAND_WIDTH + EDGE_EPSILON
      )
    )
  );
  return DIFFICULTY_BAND_COUNT - 1 - fromEasiest;
};

const cardBand = (
  card: CardProgress,
  measure: MasteryMetric,
  now: number
): number => {
  if (measure === "mastery") return masteryLevel(card, now);
  if (measure === "stability") return stabilityBand(card.stability);
  return difficultyBand(card.difficulty);
};

/** A pile item's cards: writing, Reading I and, when it has one, Reading II. */
export const itemCards = (item: ReviewPileItemView): CardProgress[] =>
  ALL_CARD_TYPES.flatMap((cardType) => cardProgress(item, cardType) ?? []);

/**
 * The 0-based band a pile item falls in for one card kind and measure, or
 * `null` for "Not started". Band 0 is always the weakest (Fresh, the lowest
 * stability, the hardest difficulty), so Combined, which needs every card the
 * item has started, takes the lowest band of them. `now` (ms) only matters
 * for mastery.
 */
export const itemBand = (
  item: ReviewPileItemView,
  kind: MasteryCardKind,
  measure: MasteryMetric,
  now: number
): number | null => {
  if (kind !== "combined") {
    const card = cardProgress(item, kind);
    return card && isCardStarted(card) ? cardBand(card, measure, now) : null;
  }
  const cards = itemCards(item);
  if (!cards.every(isCardStarted)) return null;
  return Math.min(...cards.map((card) => cardBand(card, measure, now)));
};

/**
 * One emoji per band, weakest first, shared by every measure since band 0 is
 * always the weakest: a waxing moon that ends in a flame. Not started is the
 * new moon.
 */
const NOT_STARTED_EMOJI = "🌑";
const BAND_EMOJIS = ["🌒", "🌓", "🌖", "🔥"] as const;

/** The emoji of a band from `itemBand` and friends; `null` is Not started. */
export const bandEmoji = (band: number | null): string =>
  band == null ? NOT_STARTED_EMOJI : BAND_EMOJIS[band];
