import type { ReviewPileItemView } from "engine-contract";
import {
  cardMetrics,
  difficultyBand,
  DIFFICULTY_BAND_LABELS,
  type MasteryCardKind,
  type MasteryMetric,
  stabilityBand,
  STABILITY_BAND_LABELS,
} from "./mastery-metrics";

/**
 * The /mastery heatmap's picker (design 5.9): which card kind and which
 * measure a tile is colored by. The band math itself is in `mastery-metrics`.
 */

/** In the order the picker lists them. */
export const HEATMAP_METRICS = [
  "reading-difficulty",
  "reading-stability",
  "writing-difficulty",
  "writing-stability",
  "combined-stability",
  "combined-difficulty",
] as const;

export type HeatmapMetric = (typeof HEATMAP_METRICS)[number];

export const DEFAULT_HEATMAP_METRIC: HeatmapMetric = "reading-stability";

export const isHeatmapMetric = (value: unknown): value is HeatmapMetric =>
  HEATMAP_METRICS.some((metric) => metric === value);

const METRIC_INFO: Record<
  HeatmapMetric,
  { label: string; card: MasteryCardKind; measure: MasteryMetric }
> = {
  "reading-difficulty": {
    label: "Reading difficulty",
    card: "reading",
    measure: "difficulty",
  },
  "reading-stability": {
    label: "Reading stability",
    card: "reading",
    measure: "stability",
  },
  "writing-difficulty": {
    label: "Writing difficulty",
    card: "writing",
    measure: "difficulty",
  },
  "writing-stability": {
    label: "Writing stability",
    card: "writing",
    measure: "stability",
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

export const getHeatmapMetricLabel = (metric: HeatmapMetric): string =>
  METRIC_INFO[metric].label;

export const getHeatmapMeasure = (metric: HeatmapMetric): MasteryMetric =>
  METRIC_INFO[metric].measure;

export const isCombinedHeatmapMetric = (metric: HeatmapMetric): boolean =>
  METRIC_INFO[metric].card === "combined";

/** Band labels from lowest to highest value (not including "Not started"). */
export const getBandLabels = (measure: MasteryMetric): readonly string[] =>
  measure === "stability" ? STABILITY_BAND_LABELS : DIFFICULTY_BAND_LABELS;

/**
 * 0-based band (lowest value first) a pile row falls in for this metric, or
 * null for "Not started": not in the pile, or a needed card is still new.
 */
export const getHeatmapBand = (
  metric: HeatmapMetric,
  item: ReviewPileItemView | undefined
): number | null => {
  if (item == null) return null;
  const { card, measure } = METRIC_INFO[metric];
  const metrics = cardMetrics(item, card);
  if (metrics == null) return null;
  return measure === "stability"
    ? stabilityBand(metrics.stability)
    : difficultyBand(metrics.difficulty);
};
