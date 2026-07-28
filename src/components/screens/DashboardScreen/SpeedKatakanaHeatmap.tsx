import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { STATS_KEY_PREFIX } from "@/components/screens/SpeedKatakanaScreen/storage";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";
import { GradientLegend } from "@/components/common/GradientLegend";
import {
  HEATMAP_METRIC_GRADIENT_LABELS,
  HEATMAP_METRIC_LABELS,
} from "@/lib/activity";
import { SectionHeading } from "./SectionHeading";
import { DashboardPanel } from "./DashboardPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";
import { SpeedKatakanaHeatmapSettingsPopover } from "./SpeedKatakanaHeatmapSettingsPopover";

export const SpeedKatakanaHeatmap = () => {
  const revision = useStorageRevision(
    (key) => key == null || key.startsWith(STATS_KEY_PREFIX)
  );
  const [metric] = useHeatmapCellMetric();
  const gradientLabels = HEATMAP_METRIC_GRADIENT_LABELS[metric];

  return (
    <DashboardPanel>
      <SectionHeading
        title={speedKatakanaPageMeta.shortLabel}
        description={`Each cell is one challenge set (10 katakana words). Cells are currently colored by "${HEATMAP_METRIC_LABELS[metric]}" — brighter cells mean a higher value. Columns are levels 1–20; rows are sets within each level.`}
      />
      <div className="flex justify-center mb-6 animate-fade-in">
        <SpeedKatakanaHeatmapSettingsPopover />
      </div>
      <SpeedKatakanaHeatmapGrid key={revision} metric={metric} />
      <div className="flex flex-col items-center justify-center w-full">
        <div>
          <GradientLegend
            lessLabel={gradientLabels.less}
            moreLabel={gradientLabels.more}
          />
        </div>
      </div>
    </DashboardPanel>
  );
};
