import type { MasteryMetric } from "./mastery-metrics";

/**
 * Fills for the four bands every measure has, dullest first. The same
 * theme-color opacity ramp as the frequency heatmap, so it follows the user's
 * theme color; the strongest band is always the full color. Dark mode starts
 * higher: the theme color is dark itself, so faint steps vanish into the dark
 * background.
 */
const BAND_FILL_CN = [
  "bg-[rgba(var(--theme-color-selected),0.2)] dark:bg-[rgba(var(--theme-color-selected),0.32)]",
  "bg-[rgba(var(--theme-color-selected),0.45)] dark:bg-[rgba(var(--theme-color-selected),0.52)]",
  "bg-[rgba(var(--theme-color-selected),0.75)] dark:bg-[rgba(var(--theme-color-selected),0.76)]",
  "bg-[rgba(var(--theme-color-selected),1)]",
] as const;

/**
 * `band` is 0-based; null (New) is an uncolored, see-through tile.
 * Every measure shares the one ramp, so the measure doesn't change the fill.
 */
export const getBandFillCn = (
  _measure: MasteryMetric,
  band: number | null
): string => (band == null ? "bg-transparent" : BAND_FILL_CN[band]);

/** Text on a band's fill: white once the fill is strong enough. */
export const getBandTextCn = (band: number | null): string =>
  band != null && band >= BAND_FILL_CN.length - 2
    ? "text-white"
    : "text-black dark:text-white";
