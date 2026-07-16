import type { FreqCategory } from "@/lib/freq/freq-category";
import { freqCategoryCn } from "@/lib/freq/freq-category";
import { cn } from "@/lib/utils";

/**
 * Stacked bar: contiguous blocks per band.
 * Band 0 is omitted so the muted track shows through (empty = visible).
 */
export const SegmentedBandBar = ({
  counts,
  totalUnits,
  className = "",
}: {
  counts: number[];
  totalUnits: number;
  className?: string;
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
        .map((c, i) => (c > 0 ? `band ${i}: ${c}` : null))
        .filter(Boolean)
        .join(", ")}
    >
      {counts.map((count, band) => {
        if (count <= 0 || band === 0) return null;
        return (
          <div
            key={band}
            className={freqCategoryCn[band as FreqCategory]}
            style={{ width: `${(count / safeTotal) * 100}%` }}
          />
        );
      })}
    </div>
  );
};
