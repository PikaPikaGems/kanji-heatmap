import type { ReviewPileItemView } from "engine-contract";
import {
  type BandInfo,
  DIFFICULTY_BANDS,
  itemBand,
  type MasteryCardKind,
  MASTERY_LEVELS,
  type MasteryMetric,
  STABILITY_BANDS,
} from "./mastery-metrics";

/**
 * The /mastery heatmap's picker (design 5.9): which card kind and which
 * measure a tile is colored by. The band math itself is in `mastery-metrics`.
 */

/**
 * In the order the picker lists them. Reading I keeps its old "reading-" ids
 * so saved picks still work.
 */
export const HEATMAP_METRICS = [
  "writing-mastery",
  "writing-stability",
  "writing-difficulty",
  "reading-mastery",
  "reading-stability",
  "reading-difficulty",
  "secondary-reading-mastery",
  "secondary-reading-stability",
  "secondary-reading-difficulty",
  "combined-mastery",
  "combined-stability",
  "combined-difficulty",
] as const;

export type HeatmapMetric = (typeof HEATMAP_METRICS)[number];

export const DEFAULT_HEATMAP_METRIC: HeatmapMetric = "combined-mastery";

export const isHeatmapMetric = (value: unknown): value is HeatmapMetric =>
  HEATMAP_METRICS.some((metric) => metric === value);

type MetricInfo = {
  label: string;
  /** What the metric means, under its label in the picker. */
  description: string;
  card: MasteryCardKind;
  measure: MasteryMetric;
};

/** Mastery, stability and difficulty of one card kind, e.g. "the reading of each main word". */
const cardMetrics = (
  card: MasteryCardKind,
  title: string,
  what: { mastery: string; stability: string; difficulty: string }
): MetricInfo[] => [
  {
    label: `${title} mastery`,
    description: `How far along ${what.mastery} is, from Fresh to Mastered.`,
    card,
    measure: "mastery",
  },
  {
    label: `${title} stability`,
    description: `How long you're likely to remember ${what.stability}.`,
    card,
    measure: "stability",
  },
  {
    label: `${title} difficulty`,
    description: `How hard ${what.difficulty} has been for you, from 1 to 10.`,
    card,
    measure: "difficulty",
  },
];

const [writingMastery, writingStability, writingDifficulty] = cardMetrics(
  "writing",
  "Writing",
  {
    mastery: "writing each kanji",
    stability: "how to write each kanji",
    difficulty: "writing each kanji",
  }
);
const [readingMastery, readingStability, readingDifficulty] = cardMetrics(
  "reading",
  "Reading I",
  {
    mastery: "the reading of each main word",
    stability: "the reading of each main word",
    difficulty: "the reading of each main word",
  }
);
const [secondaryMastery, secondaryStability, secondaryDifficulty] = cardMetrics(
  "secondaryReading",
  "Reading II",
  {
    mastery: "the reading of each second word",
    stability: "the reading of each second word",
    difficulty: "the reading of each second word",
  }
);

const METRIC_INFO: Record<HeatmapMetric, MetricInfo> = {
  "writing-mastery": writingMastery,
  "writing-stability": writingStability,
  "writing-difficulty": writingDifficulty,
  "reading-mastery": readingMastery,
  "reading-stability": readingStability,
  "reading-difficulty": readingDifficulty,
  "secondary-reading-mastery": secondaryMastery,
  "secondary-reading-stability": secondaryStability,
  "secondary-reading-difficulty": secondaryDifficulty,
  "combined-mastery": {
    label: "Combined mastery",
    description: "All of a kanji's cards together: the lowest level.",
    card: "combined",
    measure: "mastery",
  },
  "combined-stability": {
    label: "Combined stability",
    description: "All of a kanji's cards together: the shortest-lasting.",
    card: "combined",
    measure: "stability",
  },
  "combined-difficulty": {
    label: "Combined difficulty",
    description: "All of a kanji's cards together: the hardest.",
    card: "combined",
    measure: "difficulty",
  },
};

export const NOT_STARTED_LABEL = "Not started";

export const getHeatmapMetricLabel = (metric: HeatmapMetric): string =>
  METRIC_INFO[metric].label;

export const getHeatmapMetricDescription = (metric: HeatmapMetric): string =>
  METRIC_INFO[metric].description;

export const getHeatmapMeasure = (metric: HeatmapMetric): MasteryMetric =>
  METRIC_INFO[metric].measure;

export const isCombinedHeatmapMetric = (metric: HeatmapMetric): boolean =>
  METRIC_INFO[metric].card === "combined";

/** The card kind a metric colors by. */
export const getHeatmapCardKind = (metric: HeatmapMetric): MasteryCardKind =>
  METRIC_INFO[metric].card;

/**
 * The word at the bright end of a measure's scale: "Not started [] [] [] []
 * [] Mastered" (the blank Not started square comes first).
 */
export const SCALE_END_LABELS: Record<MasteryMetric, string> = {
  mastery: "Mastered",
  stability: "High stability",
  difficulty: "Very easy",
};

/** One line on what a measure means, above its bands in the legend. */
export const MEASURE_INTROS: Record<MasteryMetric, string> = {
  mastery: "How settled each card is in your memory.",
  stability: "Days until recall drops to target retention.",
  difficulty: "FSRS difficulty, 1 to 10. Brighter is easier.",
};

/**
 * Why a card is "Not started" for a measure. FSRS has no stability or
 * difficulty before the first review, so it is never a low or high band.
 */
export const NOT_STARTED_RULES: Record<MasteryMetric, string> = {
  mastery: "Not in your review pile, or never reviewed",
  stability: "Never reviewed, so no stability yet",
  difficulty: "Never reviewed, so no difficulty yet",
};

/**
 * A measure's bands, dullest color first (not including "Not started"):
 * brighter is always better, so difficulty runs from hardest to easiest.
 */
export const getBands = (measure: MasteryMetric): readonly BandInfo[] => {
  if (measure === "mastery") return MASTERY_LEVELS;
  return measure === "stability" ? STABILITY_BANDS : DIFFICULTY_BANDS;
};

/** Band labels in `getBands` order (not including "Not started"). */
export const getBandLabels = (measure: MasteryMetric): string[] =>
  getBands(measure).map(({ label }) => label);

/**
 * 0-based band (in `getBands` order) a pile row falls in for this metric, or
 * null for "Not started": not in the pile, or a needed card is still new.
 * `now` (ms) is only used by the mastery levels.
 */
export const getHeatmapBand = (
  metric: HeatmapMetric,
  item: ReviewPileItemView | undefined,
  now: number
): number | null => {
  if (item == null) return null;
  const { card, measure } = METRIC_INFO[metric];
  return itemBand(item, card, measure, now);
};
