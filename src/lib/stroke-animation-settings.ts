export const STROKE_ANIMATION_SETTINGS_KEY = "stroke-animation-settings";

export const SLOW_SPEED_MIN = 0.2;
export const SLOW_SPEED_MAX = 1.0;
export const FAST_SPEED_MIN = 1.0;
export const FAST_SPEED_MAX = 5.0;
export const SPEED_STEP = 0.1;

export type StrokeAnimationSettings = {
  showStrokeOrderNumbers: boolean;
  /** Speed factor for the snail button. Lower is slower (0.2–1.0). */
  slowSpeed: number;
  /** Speed factor for the play button. Higher is faster (1.0–5.0). */
  fastSpeed: number;
};

export const DEFAULT_STROKE_ANIMATION_SETTINGS: StrokeAnimationSettings = {
  showStrokeOrderNumbers: false,
  slowSpeed: SLOW_SPEED_MAX,
  fastSpeed: FAST_SPEED_MIN,
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return round1(Math.min(max, Math.max(min, v)));
};

/** Merge + clamp a stored blob so missing or junk keys don't break replay. */
export const normalizeStrokeAnimationSettings = (
  raw: Partial<StrokeAnimationSettings> | null | undefined
): StrokeAnimationSettings => ({
  showStrokeOrderNumbers:
    raw?.showStrokeOrderNumbers ??
    DEFAULT_STROKE_ANIMATION_SETTINGS.showStrokeOrderNumbers,
  slowSpeed: clamp(
    raw?.slowSpeed,
    SLOW_SPEED_MIN,
    SLOW_SPEED_MAX,
    DEFAULT_STROKE_ANIMATION_SETTINGS.slowSpeed
  ),
  fastSpeed: clamp(
    raw?.fastSpeed,
    FAST_SPEED_MIN,
    FAST_SPEED_MAX,
    DEFAULT_STROKE_ANIMATION_SETTINGS.fastSpeed
  ),
});
