import type { FreqCategory } from "@/lib/freq/freq-category";
import type { ChallengeSetStats } from "@/lib/speed-katakana/stats";
import { cpmToBand, CPM_BAND_LABELS } from "./cpm-band";
import { getActivityLevel } from "./queries";

/** Which stat a Speed Katakana heatmap cell's color represents. */
export type HeatmapCellMetric =
  | "attemptCount"
  | "bestAccuracy"
  | "bestSpeed"
  | "currentAccuracy"
  | "currentSpeed";

export const DEFAULT_HEATMAP_CELL_METRIC: HeatmapCellMetric = "bestSpeed";

export const HEATMAP_CELL_METRICS: HeatmapCellMetric[] = [
  "bestSpeed",
  "attemptCount",
  "bestAccuracy",
  "currentAccuracy",
  "currentSpeed",
];

export const HEATMAP_METRIC_LABELS: Record<HeatmapCellMetric, string> = {
  attemptCount: "Attempt count",
  bestAccuracy: "Best accuracy",
  bestSpeed: "Best speed",
  currentAccuracy: "Current accuracy",
  currentSpeed: "Current speed",
};

/** Gradient legend endpoint words ("Less"/"More" vs "Slow"/"Fast"). */
export const HEATMAP_METRIC_GRADIENT_LABELS: Record<
  HeatmapCellMetric,
  { less: string; more: string }
> = {
  bestSpeed: { less: "Slow", more: "Fast" },
  currentSpeed: { less: "Slow", more: "Fast" },
  attemptCount: { less: "Less", more: "More" },
  bestAccuracy: { less: "Less", more: "More" },
  currentAccuracy: { less: "Less", more: "More" },
};

const accuracyToBand = (accuracy: number | undefined): FreqCategory => {
  const value = accuracy ?? 0;
  if (value <= 0) return 0;
  if (value < 50) return 1;
  if (value < 70) return 2;
  if (value < 90) return 3;
  return 4;
};

/** How attempt counts map to cell brightness on the game heatmaps. */
export type AttemptCountScale = "relative" | "fixed";

export const DEFAULT_ATTEMPT_COUNT_SCALE: AttemptCountScale = "relative";

export const ATTEMPT_COUNT_SCALES: AttemptCountScale[] = ["relative", "fixed"];

export const ATTEMPT_COUNT_SCALE_LABELS: Record<AttemptCountScale, string> = {
  relative: "Relative to your most-attempted",
  fixed: "Fixed steps (1, 2–3, 4+)",
};

/** Attempt-count coloring: the chosen scale plus the most attempts on any cell. */
export type AttemptCountShading = {
  scale: AttemptCountScale;
  maxCount: number;
};

/** Fixed steps: a single attempt already shows at half brightness. */
const fixedAttemptCountToBand = (count: number): FreqCategory => {
  if (count <= 0) return 0;
  if (count === 1) return 2;
  if (count <= 3) return 3;
  return 4;
};

/**
 * "relative" uses the Activity Heatmap's rule (vs the most-attempted cell, so
 * that cell is always brightest); "fixed" uses fixedAttemptCountToBand.
 */
export const attemptCountToBand = (
  count: number | undefined,
  { scale, maxCount }: AttemptCountShading
): FreqCategory => {
  const value = count ?? 0;
  return scale === "relative"
    ? getActivityLevel(value, maxCount)
    : fixedAttemptCountToBand(value);
};

/** Popover line for a cell's attempt count, e.g. "1 attempt". */
export const attemptCountLabel = (count: number | undefined): string => {
  const value = count ?? 0;
  if (value <= 0) return "Not attempted";
  return value === 1 ? "1 attempt" : `${value} attempts`;
};

const ACCURACY_BAND_LABELS: Record<FreqCategory, string> = {
  0: "Not attempted",
  1: "<50% accuracy",
  2: "50–69% accuracy",
  3: "70–89% accuracy",
  4: "90–100% accuracy",
};

/** Band labels for the fixed-band metrics; attempt count uses attemptCountLabel. */
export const HEATMAP_METRIC_BAND_LABELS: Record<
  Exclude<HeatmapCellMetric, "attemptCount">,
  Record<FreqCategory, string>
> = {
  bestSpeed: CPM_BAND_LABELS,
  currentSpeed: CPM_BAND_LABELS,
  bestAccuracy: ACCURACY_BAND_LABELS,
  currentAccuracy: ACCURACY_BAND_LABELS,
};

/** Band (0–4) a challenge set's cell should be painted, for the chosen metric. */
export const metricToBand = (
  stats: ChallengeSetStats | null,
  metric: HeatmapCellMetric,
  attemptShading: AttemptCountShading
): FreqCategory => {
  if (!stats) return 0;
  if (metric === "bestSpeed") {
    return cpmToBand(stats.bestCpm);
  }
  if (metric === "currentSpeed") {
    return cpmToBand(stats.latestCpm);
  }
  if (metric === "bestAccuracy") {
    return accuracyToBand(stats.bestAccuracy);
  }
  if (metric === "currentAccuracy") {
    return accuracyToBand(stats.latestAccuracy);
  }
  // "attemptCount"
  return attemptCountToBand(stats.timesTaken, attemptShading);
};

/** Short "<value> <unit>" text for the chosen metric, e.g. for aria-labels. */
export const metricValueText = (
  stats: ChallengeSetStats | null,
  metric: HeatmapCellMetric
): string => {
  if (!stats) return "not attempted";
  if (metric === "bestSpeed") {
    return `${stats.bestCpm} CPM`;
  }
  if (metric === "currentSpeed") {
    return `${stats.latestCpm} CPM`;
  }
  if (metric === "bestAccuracy") {
    return `${stats.bestAccuracy}% accuracy`;
  }
  if (metric === "currentAccuracy") {
    return `${stats.latestAccuracy}% accuracy`;
  }
  // "attemptCount"
  return `${stats.timesTaken} attempts`;
};
