import type { MasteryMetric } from "./mastery-metrics";

/**
 * Fills for mastery bands, lowest value first. The same theme-color opacity
 * ramp as the frequency heatmap, so it follows the user's theme color; the
 * strongest band is always the full color.
 */
const FILL_CN: Record<MasteryMetric, string[]> = {
  stability: [
    "bg-[rgba(var(--theme-color-selected),0.18)]",
    "bg-[rgba(var(--theme-color-selected),0.34)]",
    "bg-[rgba(var(--theme-color-selected),0.5)]",
    "bg-[rgba(var(--theme-color-selected),0.66)]",
    "bg-[rgba(var(--theme-color-selected),0.82)]",
    "bg-[rgba(var(--theme-color-selected),1)]",
  ],
  difficulty: [
    "bg-[rgba(var(--theme-color-selected),0.2)]",
    "bg-[rgba(var(--theme-color-selected),0.4)]",
    "bg-[rgba(var(--theme-color-selected),0.6)]",
    "bg-[rgba(var(--theme-color-selected),0.8)]",
    "bg-[rgba(var(--theme-color-selected),1)]",
  ],
};

/** `band` is 0-based; null (Not started) is an uncolored tile. */
export const getBandFillCn = (
  measure: MasteryMetric,
  band: number | null
): string => (band == null ? "bg-background" : FILL_CN[measure][band]);

/** Text on that fill: white once the fill is strong enough. */
export const getBandTextCn = (
  measure: MasteryMetric,
  band: number | null
): string =>
  band != null && band >= FILL_CN[measure].length - 2
    ? "text-white"
    : "text-black dark:text-white";
