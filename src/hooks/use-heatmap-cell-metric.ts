import {
  DEFAULT_HEATMAP_CELL_METRIC,
  HEATMAP_CELL_METRICS,
  HeatmapCellMetric,
} from "@/lib/activity";
import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "speed-katakana-heatmap-metric";

type MetricSettings = { metric: HeatmapCellMetric };

/** Persisted choice of which stat colors the Speed Katakana heatmap cells. */
export const useHeatmapCellMetric = () => {
  const [{ metric }, setItem] = useLocalStorage<MetricSettings>(STORAGE_KEY, {
    metric: DEFAULT_HEATMAP_CELL_METRIC,
  });

  const setMetric = (next: HeatmapCellMetric) => setItem("metric", next);

  // A saved metric this version no longer offers ("Best speed (>70%)") falls
  // back to the default.
  const current = HEATMAP_CELL_METRICS.includes(metric)
    ? metric
    : DEFAULT_HEATMAP_CELL_METRIC;
  return [current, setMetric] as const;
};
