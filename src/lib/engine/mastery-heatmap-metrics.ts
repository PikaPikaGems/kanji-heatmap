import type { ReviewPileItemView } from "engine-contract";
import {
  DIFFICULTY_BAND_LABELS,
  itemBand,
  type MasteryCardKind,
  MASTERY_LEVEL_LABELS,
  type MasteryMetric,
  STABILITY_BAND_LABELS,
} from "./mastery-metrics";

/**
 * The /mastery heatmap's picker (design 5.9): which card kind and which
 * measure a tile is colored by. The band math itself is in `mastery-metrics`.
 */

/** In the order the picker lists them. */
export const HEATMAP_METRICS = [
  "reading-mastery",
  "reading-stability",
  "reading-difficulty",
  "writing-mastery",
  "writing-stability",
  "writing-difficulty",
  "combined-mastery",
  "combined-stability",
  "combined-difficulty",
] as const;

export type HeatmapMetric = (typeof HEATMAP_METRICS)[number];

export const DEFAULT_HEATMAP_METRIC: HeatmapMetric = "combined-mastery";

export const isHeatmapMetric = (value: unknown): value is HeatmapMetric =>
  HEATMAP_METRICS.some((metric) => metric === value);

const METRIC_INFO: Record<
  HeatmapMetric,
  { label: string; card: MasteryCardKind; measure: MasteryMetric }
> = {
  "reading-mastery": {
    label: "Reading mastery",
    card: "reading",
    measure: "mastery",
  },
  "reading-stability": {
    label: "Reading stability",
    card: "reading",
    measure: "stability",
  },
  "reading-difficulty": {
    label: "Reading difficulty",
    card: "reading",
    measure: "difficulty",
  },
  "writing-mastery": {
    label: "Writing mastery",
    card: "writing",
    measure: "mastery",
  },
  "writing-stability": {
    label: "Writing stability",
    card: "writing",
    measure: "stability",
  },
  "writing-difficulty": {
    label: "Writing difficulty",
    card: "writing",
    measure: "difficulty",
  },
  "combined-mastery": {
    label: "Combined mastery",
    card: "combined",
    measure: "mastery",
  },
  "combined-stability": {
    label: "Combined stability",
    card: "combined",
    measure: "stability",
  },
  "combined-difficulty": {
    label: "Combined difficulty",
    card: "combined",
    measure: "difficulty",
  },
};

export const NOT_STARTED_LABEL = "Not started";

export const getHeatmapMetricLabel = (metric: HeatmapMetric): string =>
  METRIC_INFO[metric].label;

export const getHeatmapMeasure = (metric: HeatmapMetric): MasteryMetric =>
  METRIC_INFO[metric].measure;

export const isCombinedHeatmapMetric = (metric: HeatmapMetric): boolean =>
  METRIC_INFO[metric].card === "combined";

/** Band labels from lowest to highest value (not including "Not started"). */
export const getBandLabels = (measure: MasteryMetric): readonly string[] => {
  if (measure === "mastery") return MASTERY_LEVEL_LABELS;
  return measure === "stability"
    ? STABILITY_BAND_LABELS
    : DIFFICULTY_BAND_LABELS;
};

/**
 * 0-based band (lowest value first) a pile row falls in for this metric, or
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
