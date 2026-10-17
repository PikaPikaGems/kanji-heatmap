import type { ReviewSettings } from "engine-contract";

export const DAYS_PER_MONTH = 30;
const SLIDER_MAX_MONTHS = 60;

/**
 * The Maximum interval slider's last stop: 5 years, or less when the engine
 * allows less. The engine publishes no bound of its own, so its own default
 * (`reviews.settings.defaultSettings.maximumIntervalDays`, 100 years in the
 * mock) stands in for its longest allowed interval.
 */
export const sliderMaxMonths = (engineMaxDays: number) =>
  Math.max(
    1,
    Math.min(SLIDER_MAX_MONTHS, Math.floor(engineMaxDays / DAYS_PER_MONTH))
  );

/**
 * The settings with the maximum interval brought down to the slider's last
 * stop when it is above it, so the form shows what it will save.
 */
export const fitIntervalToSlider = (
  settings: ReviewSettings,
  engineMaxDays: number
): ReviewSettings => {
  const sliderMaxDays = sliderMaxMonths(engineMaxDays) * DAYS_PER_MONTH;
  if (settings.maximumIntervalDays <= sliderMaxDays) return settings;
  return { ...settings, maximumIntervalDays: sliderMaxDays };
};
