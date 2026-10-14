import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import {
  MASTERY_METRIC_TITLES,
  type MasteryMetric,
} from "@/lib/engine/mastery-metrics";

/** What the end squares of a gradient strip stand for. */
const GRADIENT_ENDS = {
  stability: { from: "<1d", to: "≥1y" },
  difficulty: { from: "easy", to: "hard" },
};

/** Light to dark strip with labels only at the ends; each square keeps its band for screen readers. */
const GradientStrip = ({
  measure,
}: {
  measure: keyof typeof GRADIENT_ENDS;
}) => {
  const { from, to } = GRADIENT_ENDS[measure];
  return (
    <div className="flex items-center space-x-1">
      <span className="w-16 font-bold text-foreground sm:w-auto">
        {MASTERY_METRIC_TITLES[measure]}
      </span>
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
};

/** A few levels, so every square is named. */
const LevelStrip = () => (
  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
    <span className="font-bold text-foreground">
      {MASTERY_METRIC_TITLES.mastery}
    </span>
    {getBandLabels("mastery").map((label, band) => (
      <div key={label} className="flex items-center space-x-1">
        <FreqSquare srOnly="" cn={getBandFillCn("mastery", band)} />
        <span>{label}</span>
      </div>
    ))}
  </div>
);

/** One legend for every bar in the cards, for the selected metric; "Not started" is the empty track. */
export const MasteryBarsLegend = ({ metric }: { metric: MasteryMetric }) => (
  <div className="flex flex-col items-start mx-auto mb-4 text-xs text-left w-fit gap-1.5 text-muted-foreground sm:flex-row sm:items-center sm:gap-x-6">
    {metric === "mastery" ? <LevelStrip /> : <GradientStrip measure={metric} />}
    <div className="flex items-center space-x-1">
      <FreqSquare srOnly={NOT_STARTED_LABEL} cn="bg-muted/50" />
      <span>{NOT_STARTED_LABEL}</span>
    </div>
  </div>
);
