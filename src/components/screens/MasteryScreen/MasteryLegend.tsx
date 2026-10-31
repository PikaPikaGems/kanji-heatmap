import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NEW_LABEL,
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
 * measure: the see-through "New" square, then the four bands, in one
 * run: "New [][][][][] Mastered".
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
    {NEW_LABEL}
    <ScaleSquare label={NEW_LABEL} cn={getBandFillCn(measure, null)} />
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
