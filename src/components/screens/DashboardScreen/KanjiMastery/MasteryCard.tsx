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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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

/** One group's bar, laid out like the Bookmarks breakdown rows. */
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
    <TableRow className="p-0 my-1 text-left">
      <TableCell className="p-0">
        <div className="flex items-center py-1 pl-2 text-xs">
          <span
            className={`inline-block w-3 h-3 rounded-full shrink-0 ${dotCn ?? ""}`}
          />
          <span className="mx-2 font-extrabold whitespace-nowrap">{label}</span>
        </div>
      </TableCell>
      <TableCell className="w-full px-0 py-2">
        <SegmentedBandBar
          counts={counts}
          totalUnits={tally.total}
          bandCn={view.segmentCn}
          bandLabels={view.segmentLabels}
        />
      </TableCell>
      <TableCell className="p-0 text-[10px] tabular-nums">
        <span className="inline-block min-w-16 text-end">
          {started} / {tally.total}
        </span>
      </TableCell>
    </TableRow>
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
    <section className="min-w-0 px-2 py-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
      <h3 className="px-2 mb-1 text-sm font-bold">
        {KIND_TITLES[kind]} {MASTERY_METRIC_TITLES[metric]}
      </h3>
      <Table>
        <TableBody>
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
          <BarRow
            label="All"
            tally={tallies.all}
            kind={kind}
            metric={metric}
            view={view}
          />
        </TableBody>
      </Table>
    </section>
  );
};
