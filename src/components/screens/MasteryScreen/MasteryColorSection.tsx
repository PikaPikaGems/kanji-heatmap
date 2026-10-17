import BasicSelect from "@/components/common/BasicSelect";
import { FreqSquare } from "@/components/common/freq/FreqSquare";
import { H2 } from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationContent";
import { getBandFillCn } from "@/lib/engine/mastery-colors";
import {
  getBands,
  getHeatmapMeasure,
  getHeatmapMetricDescription,
  getHeatmapMetricLabel,
  HEATMAP_METRICS,
  type HeatmapMetric,
  isCombinedHeatmapMetric,
  MEASURE_INTROS,
  NOT_STARTED_LABEL,
  NOT_STARTED_RULES,
} from "@/lib/engine/mastery-heatmap-metrics";
import type { MasteryMetric } from "@/lib/engine/mastery-metrics";
import { MasteryScaleLegend } from "./MasteryLegend";
import { useHeatmapMetric } from "./use-heatmap-metric";

/** A swatch, the band's name, and what puts a card in it. */
const BandRow = ({
  label,
  rule,
  fillCn,
}: {
  label: string;
  rule: string;
  fillCn: string;
}) => (
  <li className="flex gap-2">
    <span aria-hidden className="inline-flex mt-px shrink-0">
      <FreqSquare srOnly="" cn={fillCn} />
    </span>
    <div className="min-w-0 text-xs leading-snug">
      <div className="font-bold">{label}</div>
      <div className="text-muted-foreground">{rule}</div>
    </div>
  </li>
);

/** "Not started", then the measure's four bands, dullest first. */
const BandRows = ({ measure }: { measure: MasteryMetric }) => (
  <ul className="flex flex-col gap-1.5 mt-2">
    <BandRow
      label={NOT_STARTED_LABEL}
      rule={NOT_STARTED_RULES[measure]}
      fillCn={getBandFillCn(measure, null)}
    />
    {getBands(measure).map(({ label, rule }, band) => (
      <BandRow
        key={label}
        label={label}
        rule={rule}
        fillCn={getBandFillCn(measure, band)}
      />
    ))}
  </ul>
);

const getCombinedNote = (measure: MasteryMetric): string => {
  const pick = measure === "difficulty" ? "harder" : "weaker";
  return `Combined counts once both reading and writing are reviewed, and shows the ${pick} of the two.`;
};

/** Mastery's stand-in for the frequency "Background Color Meaning" section. */
export const MasteryColorSection = () => {
  const [metric, setMetric] = useHeatmapMetric();
  const measure = getHeatmapMeasure(metric);

  return (
    <>
      <H2>Background Color Meaning</H2>
      {/* mx-1.5: room for the select's focus ring, which the popover clips. */}
      <div className="mx-1.5">
        <BasicSelect
          value={metric}
          onChange={(v) => setMetric(v as HeatmapMetric)}
          label="Background Color Meaning"
          isLabelSrOnly={true}
          options={HEATMAP_METRICS.map((value) => ({
            value,
            label: getHeatmapMetricLabel(value),
            description: getHeatmapMetricDescription(value),
          }))}
        />
      </div>
      <div key={metric} className="animate-fade-in-fast">
        <MasteryScaleLegend measure={measure} />
        <p className="text-xs text-muted-foreground">
          {MEASURE_INTROS[measure]}
        </p>
        <BandRows measure={measure} />
        {isCombinedHeatmapMetric(metric) && (
          <p className="mt-3 text-xs text-muted-foreground">
            {getCombinedNote(measure)}
          </p>
        )}
      </div>
    </>
  );
};
