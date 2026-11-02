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
 * measure: the see-through "Not started" square, then the four bands, in one
 * run: "Not started [][][][][] Mastered".
 */
export const MasteryScaleLegend = ({
  measure,
  className,
}: {
  measure: MasteryMetric;
  className?: string;
}) => (
  <div
    className={cn("flex flex-wrap items-center gap-1 my-3 text-xs", className)}
  >
    {NOT_STARTED_LABEL}
    <ScaleSquare label={NOT_STARTED_LABEL} cn={getBandFillCn(measure, null)} />
    {getBandLabels(measure).map((label, band) => (
      <ScaleSquare
        key={label}
        label={label}
        cn={getBandFillCn(measure, band)}
      />
    ))}
    {SCALE_END_LABELS[measure]}
  </div>
);
