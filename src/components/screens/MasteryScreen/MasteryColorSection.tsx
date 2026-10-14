import BasicSelect from "@/components/common/BasicSelect";
import { H2 } from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationContent";
import {
  getHeatmapMeasure,
  getHeatmapMetricLabel,
  HEATMAP_METRICS,
  type HeatmapMetric,
  isCombinedHeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";
import { MasteryLegend } from "./MasteryLegend";
import { useHeatmapMetric } from "./use-heatmap-metric";

const getMetricHint = (metric: HeatmapMetric): string => {
  const measure =
    getHeatmapMeasure(metric) === "stability"
      ? "Stability is how long a memory is expected to last, so darker tiles are stronger."
      : "Difficulty runs from 1 (easy) to 10 (hard) for you, so darker tiles are harder.";
  if (!isCombinedHeatmapMetric(metric)) return measure;
  return `${measure} Combined needs both reading and writing started, and uses the weaker of the two.`;
};

/** Mastery's stand-in for the frequency "Background Color Meaning" section. */
export const MasteryColorSection = () => {
  const [metric, setMetric] = useHeatmapMetric();

  return (
    <>
      <H2>Background Color Meaning</H2>
      <BasicSelect
        value={metric}
        onChange={(v) => setMetric(v as HeatmapMetric)}
        label="Background Color Meaning"
        isLabelSrOnly={true}
        options={HEATMAP_METRICS.map((value) => ({
          value,
          label: getHeatmapMetricLabel(value),
        }))}
      />
      <MasteryLegend metric={metric} />
      <p className="text-xs text-muted-foreground">{getMetricHint(metric)}</p>
    </>
  );
};
