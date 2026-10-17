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
  <span title={label} className="inline-flex shrink-0">
    <FreqSquare srOnly={label} cn={cn} />
  </span>
);

/**
 * The site's heatmap legend (like "Less [] [] [] [] [] More") for a mastery
 * measure: the see-through "Not started" square on its own, then the four
 * bands between the measure's end words, "[] Not started  Fresh [][][][]
 * Mastered". Wraps the two halves onto two lines when space runs out.
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
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 my-3 text-xs",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span aria-hidden className="inline-flex shrink-0">
          <FreqSquare srOnly="" cn={getBandFillCn(measure, null)} />
        </span>
        {NOT_STARTED_LABEL}
      </div>
      <div className="flex items-center gap-1">
        {from}
        {getBandLabels(measure).map((label, band) => (
          <ScaleSquare
            key={label}
            label={label}
            cn={getBandFillCn(measure, band)}
          />
        ))}
        {to}
      </div>
    </div>
  );
};
