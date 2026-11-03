import { StackedBar } from "@/components/common/StackedBar";

/**
 * A StackedBar of mastery bands: one block per band, in order. Band 0 is skipped so the track shows through
 * (empty = New). `bandCn` / `bandLabels` are indexed by band.
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
  const label = counts
    .map((c, i) => (c > 0 ? `${bandLabels[i]}: ${c}` : null))
    .filter(Boolean)
    .join(", ");

  return (
    <StackedBar
      className={className}
      role="img"
      aria-label={label}
      title={label}
      total={totalUnits}
      segments={counts.map((count, band) => ({
        key: String(band),
        // Band 0 ("New") stays empty track.
        value: band === 0 ? 0 : count,
        cn: bandCn[band],
      }))}
    />
  );
};
