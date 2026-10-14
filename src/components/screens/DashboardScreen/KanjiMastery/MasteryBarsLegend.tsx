import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";

/** Light to dark strip with labels only at the ends; each square keeps its band for screen readers. */
const GradientStrip = ({
  measure,
  name,
  from,
  to,
}: {
  measure: MasteryMetric;
  name: string;
  from: string;
  to: string;
}) => (
  <div className="flex items-center space-x-1">
    <span className="w-16 font-bold text-foreground sm:w-auto">{name}</span>
    <span>{from}</span>
    {getBandLabels(measure).map((label, band) => (
      <FreqSquare
        key={label}
        srOnly={label}
        cn={getBandFillCn(measure, band)}
      />
    ))}
    <span>{to}</span>
  </div>
);

/** One legend for every bar in the grid; "Not started" is the empty track. */
export const MasteryBarsLegend = () => (
  <div className="flex flex-col items-start mx-auto mb-4 text-xs text-left w-fit gap-1.5 text-muted-foreground sm:flex-row sm:items-center sm:gap-x-6">
    <GradientStrip
      measure="stability"
      name="Stability"
      from="<1d"
      to="≥1y burned"
    />
    <GradientStrip
      measure="difficulty"
      name="Difficulty"
      from="easy"
      to="hard"
    />
    <div className="flex items-center space-x-1">
      <FreqSquare srOnly={NOT_STARTED_LABEL} cn="bg-muted/50" />
      <span>{NOT_STARTED_LABEL}</span>
    </div>
  </div>
);
