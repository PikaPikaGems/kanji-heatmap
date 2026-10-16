import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
  SCALE_END_LABELS,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { cn } from "@/lib/utils";

/** One square of the scale, named on hover and for screen readers. */
const ScaleSquare = ({ label, cn }: { label: string; cn: string }) => (
  <span title={label} className="inline-flex">
    <FreqSquare srOnly={label} cn={cn} />
  </span>
);

/**
 * The site's heatmap legend (like "Less [] [] [] [] [] More") for a mastery
 * measure: "Not Started [] [] [] [] [] Burned". The first square is
 * see-through like a tile that isn't started, then one square per band.
 */
export const MasteryScaleLegend = ({
  measure,
  className,
}: {
  measure: MasteryMetric;
  className?: string;
}) => {
  const { from, to } = SCALE_END_LABELS[measure];
  return (
    <div
      key={measure}
      className={cn(
        "flex items-center my-3 space-x-1 animate-fade-in",
        className
      )}
    >
      <div className="text-xs">{from}</div>
      <ScaleSquare
        label={NOT_STARTED_LABEL}
        cn={getBandFillCn(measure, null)}
      />
      {getBandLabels(measure).map((label, band) => (
        <ScaleSquare
          key={label}
          label={label}
          cn={getBandFillCn(measure, band)}
        />
      ))}
      <div className="text-xs">{to}</div>
    </div>
  );
};
