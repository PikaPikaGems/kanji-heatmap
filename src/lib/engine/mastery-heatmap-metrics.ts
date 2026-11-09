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
 * The /mastery heatmap's pickers (design 5.9): which measure and which card
 * kind a tile is colored by. The band math itself is in `mastery-metrics`.
 */

/**
 * Every card kind and measure pair. Reading I keeps its old "reading-" ids
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
  card: MasteryCardKind;
  measure: MasteryMetric;
};

type PickerOption<T> = { value: T; label: string; description: string };

/** The first picker: what a tile's color measures, in the order listed. */
export const HEATMAP_MEASURE_OPTIONS: readonly PickerOption<MasteryMetric>[] = [
  {
    value: "stability",
    label: "Stability",
    description: "How long you're likely to remember it.",
  },
  {
    value: "difficulty",
    label: "Difficulty",
    description: "How hard it has been for you, from 1 to 10.",
  },
  {
    value: "mastery",
    label: "Mastery",
    description: "How far along it is, from Fresh to Mastered.",
  },
];

/** The second picker: which of a kanji's cards the measure is read from. */
export const HEATMAP_CARD_OPTIONS: readonly PickerOption<MasteryCardKind>[] = [
  {
    value: "writing",
    label: "Writing",
    description: "Writing each kanji.",
  },
  {
    value: "reading",
    label: "Reading I",
    description: "The reading of each main word.",
  },
  {
    value: "secondaryReading",
    label: "Reading II",
    description: "The reading of each second word.",
  },
  {
    value: "combined",
    label: "Combined",
    description: "All of a kanji's cards together, at their weakest.",
  },
];

const cardTitle = (card: MasteryCardKind): string =>
  HEATMAP_CARD_OPTIONS.find((option) => option.value === card)?.label ?? card;

const metricInfo = (
  card: MasteryCardKind,
  measure: MasteryMetric
): MetricInfo => ({ label: `${cardTitle(card)} ${measure}`, card, measure });

const METRIC_INFO: Record<HeatmapMetric, MetricInfo> = {
  "writing-mastery": metricInfo("writing", "mastery"),
  "writing-stability": metricInfo("writing", "stability"),
  "writing-difficulty": metricInfo("writing", "difficulty"),
  "reading-mastery": metricInfo("reading", "mastery"),
  "reading-stability": metricInfo("reading", "stability"),
  "reading-difficulty": metricInfo("reading", "difficulty"),
  "secondary-reading-mastery": metricInfo("secondaryReading", "mastery"),
  "secondary-reading-stability": metricInfo("secondaryReading", "stability"),
  "secondary-reading-difficulty": metricInfo("secondaryReading", "difficulty"),
  "combined-mastery": metricInfo("combined", "mastery"),
  "combined-stability": metricInfo("combined", "stability"),
  "combined-difficulty": metricInfo("combined", "difficulty"),
};

/** The metric for a card kind and measure picked in the two pickers. */
export const toHeatmapMetric = (
  card: MasteryCardKind,
  measure: MasteryMetric
): HeatmapMetric =>
  HEATMAP_METRICS.find(
    (metric) =>
      METRIC_INFO[metric].card === card &&
      METRIC_INFO[metric].measure === measure
  ) ?? DEFAULT_HEATMAP_METRIC;

export const NEW_LABEL = "New";

export const getHeatmapMetricLabel = (metric: HeatmapMetric): string =>
  METRIC_INFO[metric].label;

export const getHeatmapMeasure = (metric: HeatmapMetric): MasteryMetric =>
  METRIC_INFO[metric].measure;

export const isCombinedHeatmapMetric = (metric: HeatmapMetric): boolean =>
  METRIC_INFO[metric].card === "combined";

/** The card kind a metric colors by. */
export const getHeatmapCardKind = (metric: HeatmapMetric): MasteryCardKind =>
  METRIC_INFO[metric].card;

/**
 * The word at the bright end of a measure's scale: "New [] [] [] []
 * [] Mastered" (the blank New square comes first).
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
 * Why a card is "New" for a measure. FSRS has no stability or
 * difficulty before the first review, so it is never a low or high band.
 */
export const NEW_RULES: Record<MasteryMetric, string> = {
  mastery: "Not in your review pile, or never reviewed",
  stability: "Never reviewed, so no stability yet",
  difficulty: "Never reviewed, so no difficulty yet",
};

/**
 * A measure's bands, dullest color first (not including "New"):
 * brighter is always better, so difficulty runs from hardest to easiest.
 */
export const getBands = (measure: MasteryMetric): readonly BandInfo[] => {
  if (measure === "mastery") return MASTERY_LEVELS;
  return measure === "stability" ? STABILITY_BANDS : DIFFICULTY_BANDS;
};

/** Band labels in `getBands` order (not including "New"). */
export const getBandLabels = (measure: MasteryMetric): string[] =>
  getBands(measure).map(({ label }) => label);

/**
 * 0-based band (in `getBands` order) a pile row falls in for this metric, or
 * null for "New": not in the pile, or a needed card is still new.
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
