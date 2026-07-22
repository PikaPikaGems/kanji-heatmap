import { cn } from "@/lib/utils";
import { FreqCategory, freqCategoryCn } from "@/lib/freq/freq-category";

const EMPHASIS_BORDER =
  "border border-solid border-foreground dark:border-foreground";

/**
 * Fill classes for a heatmap square: muted for level 0, frequency-category
 * color otherwise. `emphasizeBorder` marks a special cell (e.g. today).
 */
export const heatmapFillCn = (level: FreqCategory, emphasizeBorder = false) =>
  level === 0
    ? cn(
        "bg-muted/50 dark:bg-muted/30",
        emphasizeBorder
          ? EMPHASIS_BORDER
          : "border border-border dark:border-border"
      )
    : cn(
        freqCategoryCn[level],
        emphasizeBorder
          ? EMPHASIS_BORDER
          : "border border-black/10 dark:border-white/10"
      );
