import { getHeatmapMetricLabel } from "@/lib/engine/mastery-heatmap-metrics";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";
import { useHeatmapMetric } from "./use-heatmap-metric";

/**
 * Which metric colors the tiles, in the item count badge's style. Says so
 * when the pile can't be read, since every tile is then uncolored.
 */
export const MasteryMetricBadge = () => {
  const [metric] = useHeatmapMetric();
  const { status } = useReviewPileByKanji();

  return (
    // Absolute like the item count badge, so it never joins the ControlBar
    // flex row; it sits at the opposite (right) end of the same line.
    <div className="absolute top-[50px] right-1 px-2 text-xs font-extrabold bg-opacity-75 border rounded-lg bg-background">
      {status === "unavailable"
        ? "Progress unavailable"
        : getHeatmapMetricLabel(metric)}
    </div>
  );
};
