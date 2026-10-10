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
export const useActivityHeatmapSettings = () => {
  const [settings, setSetting] = useLocalStorage<ActivityHeatmapSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS
  );
  // Filters saved before an activity kind existed lack its key; default the
  // missing ones on instead of treating them as unchecked.
  const withAllKinds: ActivityHeatmapSettings = {
    ...settings,
    filters: { ...DEFAULT_KIND_FILTERS, ...settings.filters },
  };
  return [withAllKinds, setSetting] as const;
};
