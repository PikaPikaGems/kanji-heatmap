import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_HEATMAP_METRIC,
  type HeatmapMetric,
  isHeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";

const STORAGE_KEY = "mastery-heatmap-settings";

/** The picked metric, remembered on this device like the `/` card settings. */
export const useHeatmapMetric = (): [
  HeatmapMetric,
  (metric: HeatmapMetric) => void,
] => {
  const [settings, dispatch] = useLocalStorage<{ metric: HeatmapMetric }>(
    STORAGE_KEY,
    { metric: DEFAULT_HEATMAP_METRIC }
  );
  // Storage can hold anything (an old build, hand edits): fall back.
  const metric = isHeatmapMetric(settings.metric)
    ? settings.metric
    : DEFAULT_HEATMAP_METRIC;
  return [metric, (next) => dispatch("metric", next)];
};
