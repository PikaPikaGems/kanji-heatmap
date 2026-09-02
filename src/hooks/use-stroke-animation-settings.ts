import { useLocalStorage } from "@/hooks/use-local-storage";
import { notifyStorage } from "@/lib/storage";
import {
  DEFAULT_STROKE_ANIMATION_SETTINGS,
  STROKE_ANIMATION_SETTINGS_KEY,
  normalizeStrokeAnimationSettings,
  type StrokeAnimationSettings,
} from "@/lib/stroke-animation-settings";

export const useStrokeAnimationSettings = () => {
  const [raw, setItem] = useLocalStorage<StrokeAnimationSettings>(
    STROKE_ANIMATION_SETTINGS_KEY,
    DEFAULT_STROKE_ANIMATION_SETTINGS
  );

  const reset = () => {
    localStorage.setItem(
      STROKE_ANIMATION_SETTINGS_KEY,
      JSON.stringify(DEFAULT_STROKE_ANIMATION_SETTINGS)
    );
    notifyStorage(STROKE_ANIMATION_SETTINGS_KEY);
  };

  return [normalizeStrokeAnimationSettings(raw), setItem, reset] as const;
};
