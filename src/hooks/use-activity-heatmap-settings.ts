import {
  ActivityKindFilters,
  DEFAULT_KIND_FILTERS,
  DurationOption,
} from "@/lib/activity";
import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "activity-heatmap-settings";
const LEGACY_VERTICAL_KEY = "activity-heatmap-vertical";

export type ActivityHeatmapSettings = {
  duration: DurationOption;
  filters: ActivityKindFilters;
  vertical: boolean;
};

const DEFAULT_SETTINGS: ActivityHeatmapSettings = {
  duration: { type: "last365" },
  filters: { ...DEFAULT_KIND_FILTERS },
  vertical: localStorage.getItem(LEGACY_VERTICAL_KEY) === "true",
};

/** Duration, kind filters, and compact/wide layout for the activity heatmap. */
export const useActivityHeatmapSettings = () =>
  useLocalStorage<ActivityHeatmapSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
