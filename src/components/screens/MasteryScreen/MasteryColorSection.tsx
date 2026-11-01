import BasicSelect from "@/components/common/BasicSelect";
import { H2 } from "../ListScreen/ControlBar/ItemPresentation/ItemPresentationContent";
import {
  getHeatmapCardKind,
  getHeatmapMeasure,
  HEATMAP_CARD_OPTIONS,
  HEATMAP_MEASURE_OPTIONS,
  isCombinedHeatmapMetric,
  toHeatmapMetric,
} from "@/lib/engine/mastery-heatmap-metrics";
import type {
  MasteryCardKind,
  MasteryMetric,
} from "@/lib/engine/mastery-metrics";
import { MasteryScaleLegend } from "./MasteryLegend";
import { MeasureIntro } from "./MeasureIntro";
import { BookmarkedHighlightSwitch } from "./BookmarkedHighlightSwitch";
import { useHeatmapMetric } from "./use-heatmap-metric";

/** Mastery's stand-in for the frequency "Background Color Meaning" section. */
export const MasteryColorSection = () => {
  const [metric, setMetric] = useHeatmapMetric();
  const measure = getHeatmapMeasure(metric);
  const card = getHeatmapCardKind(metric);

  return (
    <>
      <H2>Background Color Meaning</H2>
      {/* mx-1.5: room for the select's focus ring, which the popover clips. */}
      <div className="flex flex-col gap-2 mx-1.5">
        <BasicSelect
          value={measure}
          onChange={(v) => setMetric(toHeatmapMetric(card, v as MasteryMetric))}
          label="Measure"
          isLabelSrOnly={true}
          options={[...HEATMAP_MEASURE_OPTIONS]}
        />
        <BasicSelect
          value={card}
          onChange={(v) =>
            setMetric(toHeatmapMetric(v as MasteryCardKind, measure))
          }
          label="Cards"
          isLabelSrOnly={true}
          options={[...HEATMAP_CARD_OPTIONS]}
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
