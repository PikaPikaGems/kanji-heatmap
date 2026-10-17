import { cn } from "@/lib/utils";

/**
 * Thin stacked bar (as thin as the dashboard's other progress bars): one
 * block per band, in order. Band 0 is skipped so the track shows through
 * (empty = not started). `bandCn` / `bandLabels` are indexed by band.
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
  bandCn: readonly string[];
  bandLabels: readonly string[];
}) => {
  const safeTotal = Math.max(totalUnits, 1);
  const label = counts
    .map((c, i) => (c > 0 ? `${bandLabels[i]}: ${c}` : null))
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cn(
        "flex w-full h-1 overflow-hidden rounded-full bg-secondary",
        className
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      {counts.map((count, band) => {
        if (count <= 0 || band === 0) return null;
        return (
          <div
            key={band}
            className={bandCn[band]}
            style={{ width: `${(count / safeTotal) * 100}%` }}
          />
        );
      })}
    </div>
  );
};
