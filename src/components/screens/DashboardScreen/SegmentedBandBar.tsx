import type { FreqCategory } from "@/lib/freq/freq-category";
import { freqCategoryCn } from "@/lib/freq/freq-category";
import { cn } from "@/lib/utils";

/**
 * Stacked bar: contiguous blocks per band.
 * Band 0 is omitted so the muted track shows through (empty = visible).
 * `bandCn` / `bandLabels` (indexed by band) replace the five frequency shades
 * and the generic "band n" screen reader text for bars with other scales.
 */
export const SegmentedBandBar = ({
  counts,
  totalUnits,
  className = "",
  bandCn,
  bandLabels,
}: {
  counts: number[];
  totalUnits: number;
  className?: string;
  bandCn?: readonly string[];
  bandLabels?: readonly string[];
}) => {
  const safeTotal = Math.max(totalUnits, 1);

  return (
    <div
      className={cn(
        "flex h-3 w-full overflow-hidden rounded-md border border-border bg-muted/50",
        className
      )}
      role="img"
      aria-label={counts
        .map((c, i) =>
          c > 0 ? `${bandLabels?.[i] ?? `band ${i}`}: ${c}` : null
        )
        .filter(Boolean)
        .join(", ")}
    >
      {counts.map((count, band) => {
        if (count <= 0 || band === 0) return null;
        return (
          <div
            key={band}
            className={bandCn?.[band] ?? freqCategoryCn[band as FreqCategory]}
            style={{ width: `${(count / safeTotal) * 100}%` }}
          />
        );
      })}
    </div>
  );
};
