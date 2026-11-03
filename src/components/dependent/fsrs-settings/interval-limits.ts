import type { ReviewSettings } from "engine-contract";

export const DAYS_PER_MONTH = 30;

/**
 * The Maximum interval slider's last stop: 5 years. Fixed, so the default
 * (`reviews.settings.defaultSettings.maximumIntervalDays`) only sets where the
 * slider starts, not how far it goes.
 */
export const SLIDER_MAX_MONTHS = 60;

/**
 * The settings with the maximum interval brought down to the slider's last
 * stop when it is above it, so the form shows what it will save.
 */
export const fitIntervalToSlider = (
  settings: ReviewSettings
): ReviewSettings => {
  const sliderMaxDays = SLIDER_MAX_MONTHS * DAYS_PER_MONTH;
  if (settings.maximumIntervalDays <= sliderMaxDays) return settings;
  return { ...settings, maximumIntervalDays: sliderMaxDays };
};
