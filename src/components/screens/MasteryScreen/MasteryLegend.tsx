import { SquareListItem } from "@/components/common/SquareListItem";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBandLabels,
  getHeatmapMeasure,
  type HeatmapMetric,
  NOT_STARTED_LABEL,
} from "@/lib/engine/mastery-heatmap-metrics";

/** Swatch and label per band, from Not started up to the strongest band. */
export const MasteryLegend = ({ metric }: { metric: HeatmapMetric }) => {
  const measure = getHeatmapMeasure(metric);
  const entries = [
    { label: NOT_STARTED_LABEL, band: null },
    ...getBandLabels(measure).map((label, band) => ({ label, band })),
  ];

  return (
    <ul
      key={metric}
      className="flex flex-wrap my-3 gap-x-3 gap-y-1.5 animate-fade-in"
      aria-label="Color legend"
    >
      {entries.map(({ label, band }) => (
        <SquareListItem
          key={label}
          cn={`${getBandFillCn(measure, band)} border border-black/20 dark:border-white/25`}
          color=""
          label={label}
        />
      ))}
    </ul>
  );
};
