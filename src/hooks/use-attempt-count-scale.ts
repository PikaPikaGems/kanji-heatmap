import { AttemptCountScale, DEFAULT_ATTEMPT_COUNT_SCALE } from "@/lib/activity";
import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "attempt-count-heatmap-scale";

type ScaleSettings = { scale: AttemptCountScale };

/**
 * Persisted attempt-count brightness scale, shared by the Fill the Kanji and
 * Speed Katakana heatmaps.
 */
export const useAttemptCountScale = () => {
  const [{ scale }, setItem] = useLocalStorage<ScaleSettings>(STORAGE_KEY, {
    scale: DEFAULT_ATTEMPT_COUNT_SCALE,
  });

  const setScale = (next: AttemptCountScale) => setItem("scale", next);

  return [scale, setScale] as const;
};
