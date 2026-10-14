import {
  MASTERY_METRIC_TITLES,
  type MasteryCardKind,
  type MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";
import { SegmentedBandBar } from "../SegmentedBandBar";
import type {
  MasteryGroup,
  MasteryTallies,
  MasteryTally,
} from "./mastery-tally";

type MetricView = {
  /** Screen reader text per segment; 0 is "Not started". */
  segmentLabels: readonly string[];
  /** Fill per segment, same palette as the legend and the /mastery heatmap; index 0 is unused (the empty track). */
  segmentCn: readonly string[];
};

const toMetricView = (measure: MasteryMetric): MetricView => {
  const labels = getBandLabels(measure);
  return {
    segmentLabels: [NOT_STARTED_LABEL, ...labels],
    segmentCn: ["", ...labels.map((_, band) => getBandFillCn(measure, band))],
  };
};

const METRIC_VIEWS: Record<MasteryMetric, MetricView> = {
  mastery: toMetricView("mastery"),
  stability: toMetricView("stability"),
  difficulty: toMetricView("difficulty"),
};

const KIND_TITLES: Record<MasteryCardKind, string> = {
  reading: "Reading",
  writing: "Writing",
  combined: "Combined",
};

const BarRow = ({
  label,
  dotCn,
  tally,
  kind,
  metric,
  view,
}: {
  label: string;
  /** Group color dot; the total row has none. */
  dotCn?: string;
  tally: MasteryTally;
  kind: MasteryCardKind;
  metric: MasteryMetric;
  view: MetricView;
}) => {
  const counts = tally[metric][kind];
  const started = tally.total - counts[0];
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center w-9 gap-1 text-xs font-extrabold shrink-0">
        {dotCn ? (
          <span className={`inline-block w-3 h-3 rounded-full ${dotCn}`} />
        ) : null}
        {label}
      </span>
      <SegmentedBandBar
        className="flex-1 min-w-0"
        counts={counts}
        totalUnits={tally.total}
        bandCn={view.segmentCn}
        bandLabels={view.segmentLabels}
      />
      <span className="w-16 text-[10px] text-end shrink-0 tabular-nums">
        {started} / {tally.total}
      </span>
    </div>
  );
};

/** One card type + metric: a bar per group, then the total. */
export const MasteryCard = ({
  kind,
  metric,
  groups,
  tallies,
}: {
  kind: MasteryCardKind;
  metric: MasteryMetric;
  groups: readonly MasteryGroup[];
  tallies: MasteryTallies;
}) => {
  const view = METRIC_VIEWS[metric];
  return (
    <section className="min-w-0 p-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
      <h3 className="mb-3 text-sm font-bold">
        {KIND_TITLES[kind]} {MASTERY_METRIC_TITLES[metric]}
      </h3>
      <div className="flex flex-col gap-1.5">
        {groups.map(({ key, label, cn }) => (
          <BarRow
            key={key}
            label={label}
            dotCn={cn}
            tally={tallies.byGroup[key]}
            kind={kind}
            metric={metric}
            view={view}
          />
        ))}
        <div className="pt-1.5 mt-1 border-t border-dotted">
          <BarRow
            label="All"
            tally={tallies.all}
            kind={kind}
            metric={metric}
            view={view}
          />
        </div>
      </div>
    </section>
  );
};
