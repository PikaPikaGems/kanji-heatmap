import type {
  MasteryCardKind,
  MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import {
  DIFFICULTY_BAND_LABELS,
  STABILITY_BAND_LABELS,
} from "@/lib/engine/mastery-metrics";
import { SegmentedBandBar } from "../SegmentedBandBar";
import type {
  MasteryGroup,
  MasteryTallies,
  MasteryTally,
} from "./mastery-tally";

type MetricView = {
  title: string;
  /** Legend and screen reader text per segment; 0 is "Not started". */
  segmentLabels: readonly string[];
  /** Fill per segment, light to dark; index 0 is unused (the empty track). */
  segmentCn: readonly string[];
};

const METRIC_VIEWS: Record<MasteryMetric, MetricView> = {
  stability: {
    title: "Stability",
    segmentLabels: ["Not started", ...STABILITY_BAND_LABELS],
    segmentCn: [
      "",
      "bg-[rgba(var(--theme-color-selected),0.25)]",
      "bg-[rgba(var(--theme-color-selected),0.4)]",
      "bg-[rgba(var(--theme-color-selected),0.55)]",
      "bg-[rgba(var(--theme-color-selected),0.7)]",
      "bg-[rgba(var(--theme-color-selected),0.85)]",
      "bg-[rgba(var(--theme-color-selected),1)]",
    ],
  },
  difficulty: {
    title: "Difficulty",
    segmentLabels: ["Not started", ...DIFFICULTY_BAND_LABELS],
    segmentCn: [
      "",
      "bg-[rgba(var(--theme-color-selected),0.25)]",
      "bg-[rgba(var(--theme-color-selected),0.45)]",
      "bg-[rgba(var(--theme-color-selected),0.65)]",
      "bg-[rgba(var(--theme-color-selected),0.85)]",
      "bg-[rgba(var(--theme-color-selected),1)]",
    ],
  },
};

const KIND_TITLES: Record<MasteryCardKind, string> = {
  reading: "Reading",
  writing: "Writing",
  combined: "Combined",
};

const Legend = ({ view }: { view: MetricView }) => (
  <ul className="flex flex-wrap pt-3 mt-auto text-[10px] gap-x-3 gap-y-1 text-muted-foreground">
    {view.segmentLabels.map((label, band) => (
      <li key={label} className="flex items-center gap-1">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-sm border border-border ${band === 0 ? "bg-muted/50" : view.segmentCn[band]}`}
        />
        {label}
      </li>
    ))}
  </ul>
);

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
    <section className="flex flex-col min-w-0 p-3 text-left border rounded-xl border-foreground/5 bg-muted/10">
      <h3 className="mb-3 text-sm font-bold">
        {KIND_TITLES[kind]} {view.title}
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
      <Legend view={view} />
    </section>
  );
};
