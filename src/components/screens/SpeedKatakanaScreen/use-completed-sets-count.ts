import { useStorageValue } from "@/hooks/use-storage-value";
import { countCompletedSets, STATS_KEY_PREFIX } from "./storage";
import { SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";

export const useCompletedSetsCount = () =>
  useStorageValue(
    () => countCompletedSets(SPEED_KATAKANA_TOTAL_CHALLENGES),
    (key) => key?.startsWith(STATS_KEY_PREFIX) ?? false
  );
