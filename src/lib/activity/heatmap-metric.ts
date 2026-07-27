import type { FreqCategory } from "@/lib/freq/freq-category";
import type { ChallengeSetStats } from "@/components/screens/SpeedKatakanaScreen/storage";
import { cpmToBand, CPM_BAND_LABELS } from "./cpm-band";

/** Which stat a Speed Katakana heatmap cell's color represents. */
export type HeatmapCellMetric =
  | "bestSpeedOver70"
  | "attemptCount"
  | "bestAccuracy"
  | "bestSpeed"
  | "currentAccuracy"
  | "currentSpeed";

export const DEFAULT_HEATMAP_CELL_METRIC: HeatmapCellMetric = "bestSpeedOver70";

export const HEATMAP_CELL_METRICS: HeatmapCellMetric[] = [
  "bestSpeedOver70",
  "attemptCount",
  "bestAccuracy",
  "bestSpeed",
  "currentAccuracy",
  "currentSpeed",
];

export const HEATMAP_METRIC_LABELS: Record<HeatmapCellMetric, string> = {
  bestSpeedOver70: "Best speed with accuracy over 70%",
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
  bestSpeedOver70: { less: "Slow", more: "Fast" },
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

const attemptCountToBand = (count: number | undefined): FreqCategory => {
  const value = count ?? 0;
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value <= 3) return 2;
  if (value <= 6) return 3;
  return 4;
};

const ACCURACY_BAND_LABELS: Record<FreqCategory, string> = {
  0: "Not attempted",
  1: "<50% accuracy",
  2: "50–69% accuracy",
  3: "70–89% accuracy",
  4: "90–100% accuracy",
};

const ATTEMPT_COUNT_BAND_LABELS: Record<FreqCategory, string> = {
  0: "Not attempted",
  1: "1 attempt",
  2: "2–3 attempts",
  3: "4–6 attempts",
  4: "7+ attempts",
};

export const HEATMAP_METRIC_BAND_LABELS: Record<
  HeatmapCellMetric,
  Record<FreqCategory, string>
> = {
  bestSpeedOver70: CPM_BAND_LABELS,
  bestSpeed: CPM_BAND_LABELS,
  currentSpeed: CPM_BAND_LABELS,
  bestAccuracy: ACCURACY_BAND_LABELS,
  currentAccuracy: ACCURACY_BAND_LABELS,
  attemptCount: ATTEMPT_COUNT_BAND_LABELS,
};

/** Band (0–4) a challenge set's cell should be painted, for the chosen metric. */
export const metricToBand = (
  stats: ChallengeSetStats | null,
  metric: HeatmapCellMetric
): FreqCategory => {
  if (!stats) return 0;
  switch (metric) {
    case "bestSpeedOver70":
      return cpmToBand(stats.bestCpmWithAccuracyOver70);
    case "bestSpeed":
      return cpmToBand(stats.bestCpm);
    case "currentSpeed":
      return cpmToBand(stats.latestCpm);
    case "bestAccuracy":
      return accuracyToBand(stats.bestAccuracy);
    case "currentAccuracy":
      return accuracyToBand(stats.latestAccuracy);
    case "attemptCount":
      return attemptCountToBand(stats.timesTaken);
  }
};

/** Short "<value> <unit>" text for the chosen metric, e.g. for aria-labels. */
export const metricValueText = (
  stats: ChallengeSetStats | null,
  metric: HeatmapCellMetric
): string => {
  if (!stats) return "not attempted";
  switch (metric) {
    case "bestSpeedOver70":
      return stats.bestCpmWithAccuracyOver70 != null
        ? `${stats.bestCpmWithAccuracyOver70} CPM`
        : "no run above 70% accuracy";
    case "bestSpeed":
      return `${stats.bestCpm} CPM`;
    case "currentSpeed":
      return `${stats.latestCpm} CPM`;
    case "bestAccuracy":
      return `${stats.bestAccuracy}% accuracy`;
    case "currentAccuracy":
      return `${stats.latestAccuracy}% accuracy`;
    case "attemptCount":
      return `${stats.timesTaken} attempts`;
  }
};
