import type { MasteryMetric } from "./mastery-metrics";

/**
 * Fills for mastery bands, lowest value first. The same theme-color opacity
 * ramp as the frequency heatmap, so it follows the user's theme color; the
 * strongest band is always the full color. Dark mode starts higher: the theme
 * color is dark itself, so faint steps vanish into the dark background.
 */
const FILL_CN: Record<MasteryMetric, string[]> = {
  mastery: [
    "bg-[rgba(var(--theme-color-selected),0.2)] dark:bg-[rgba(var(--theme-color-selected),0.32)]",
    "bg-[rgba(var(--theme-color-selected),0.45)] dark:bg-[rgba(var(--theme-color-selected),0.52)]",
    "bg-[rgba(var(--theme-color-selected),0.75)] dark:bg-[rgba(var(--theme-color-selected),0.76)]",
    "bg-[rgba(var(--theme-color-selected),1)]",
  ],
  stability: [
    "bg-[rgba(var(--theme-color-selected),0.18)] dark:bg-[rgba(var(--theme-color-selected),0.32)]",
    "bg-[rgba(var(--theme-color-selected),0.34)] dark:bg-[rgba(var(--theme-color-selected),0.44)]",
    "bg-[rgba(var(--theme-color-selected),0.5)] dark:bg-[rgba(var(--theme-color-selected),0.56)]",
    "bg-[rgba(var(--theme-color-selected),0.66)] dark:bg-[rgba(var(--theme-color-selected),0.7)]",
    "bg-[rgba(var(--theme-color-selected),0.82)] dark:bg-[rgba(var(--theme-color-selected),0.85)]",
    "bg-[rgba(var(--theme-color-selected),1)]",
  ],
  difficulty: [
    "bg-[rgba(var(--theme-color-selected),0.2)] dark:bg-[rgba(var(--theme-color-selected),0.32)]",
    "bg-[rgba(var(--theme-color-selected),0.4)] dark:bg-[rgba(var(--theme-color-selected),0.48)]",
    "bg-[rgba(var(--theme-color-selected),0.6)] dark:bg-[rgba(var(--theme-color-selected),0.64)]",
    "bg-[rgba(var(--theme-color-selected),0.8)] dark:bg-[rgba(var(--theme-color-selected),0.82)]",
    "bg-[rgba(var(--theme-color-selected),1)]",
  ],
};

/** `band` is 0-based; null (Not started) is an uncolored, see-through tile. */
export const getBandFillCn = (
  measure: MasteryMetric,
  band: number | null
): string => (band == null ? "bg-transparent" : FILL_CN[measure][band]);

/** Text on that fill: white once the fill is strong enough. */
export const getBandTextCn = (
  measure: MasteryMetric,
  band: number | null
): string =>
  band != null && band >= FILL_CN[measure].length - 2
    ? "text-white"
    : "text-black dark:text-white";
