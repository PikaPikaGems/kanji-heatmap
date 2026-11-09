import { getHeatmapMetricLabel } from "@/lib/engine/mastery-heatmap-metrics";
import { useHeatmapMetric } from "./use-heatmap-metric";

/** Which metric colors the tiles, in the item count badge's style. */
export const MasteryMetricBadge = () => {
  const [metric] = useHeatmapMetric();

  return (
    // Absolute like the item count badge, so it never joins the ControlBar
    // flex row; it sits at the opposite (right) end of the same line.
    <div className="absolute top-[50px] right-1 px-2 text-xs font-extrabold bg-opacity-75 border rounded-lg bg-background">
      {getHeatmapMetricLabel(metric)}
    </div>
  );
};
