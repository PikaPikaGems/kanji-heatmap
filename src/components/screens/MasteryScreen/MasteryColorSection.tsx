import BasicSelect from "@/components/common/BasicSelect";
import { H2 } from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationContent";
import {
  getHeatmapMeasure,
  getHeatmapMetricDescription,
  getHeatmapMetricLabel,
  HEATMAP_METRICS,
  type HeatmapMetric,
  isCombinedHeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";
import { MasteryScaleLegend } from "./MasteryLegend";
import { MeasureIntro } from "./MeasureIntro";
import { BookmarkedHighlightSwitch } from "./BookmarkedHighlightSwitch";
import { useHeatmapMetric } from "./use-heatmap-metric";

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
        <MeasureIntro
          measure={measure}
          combined={isCombinedHeatmapMetric(metric)}
        />
      </div>
      <BookmarkedHighlightSwitch />
    </>
  );
};
