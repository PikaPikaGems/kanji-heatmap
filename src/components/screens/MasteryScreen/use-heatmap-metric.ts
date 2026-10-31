import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_HEATMAP_METRIC,
  type HeatmapMetric,
  isHeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";

const STORAGE_KEY = "mastery-heatmap-settings";

type MasteryHeatmapSettings = {
  metric: HeatmapMetric;
  highlightBookmarked?: boolean;
};

const DEFAULTS: MasteryHeatmapSettings = { metric: DEFAULT_HEATMAP_METRIC };

/** The picked metric, remembered on this device like the `/` card settings. */
export const useHeatmapMetric = (): [
  HeatmapMetric,
  (metric: HeatmapMetric) => void,
] => {
  const [settings, dispatch] = useLocalStorage(STORAGE_KEY, DEFAULTS);
  // Storage can hold anything (an old build, hand edits): fall back.
  const metric = isHeatmapMetric(settings.metric)
    ? settings.metric
    : DEFAULT_HEATMAP_METRIC;
  return [metric, (next) => dispatch("metric", next)];
};

/** "Highlight bookmarked kanji": solid fills for bookmarked tiles. Off by default. */
export const useHighlightBookmarked = (): [
  boolean,
  (next: boolean) => void,
] => {
  const [settings, dispatch] = useLocalStorage(STORAGE_KEY, DEFAULTS);
  return [
    settings.highlightBookmarked === true,
    (next) => dispatch("highlightBookmarked", next),
  ];
};

/** Solid fills for highlighted bookmarks, with black text on both. */
export const BOOKMARKED_FILL_CN = {
  bookmarked: "bg-green-500",
  reviewing: "bg-lime-400",
} as const;
