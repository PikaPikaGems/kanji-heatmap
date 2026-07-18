import { speedKatakanaPageMeta } from "@/components/items/practice-pages";
import { STATS_KEY_PREFIX } from "@/components/screens/SpeedKatakanaScreen/storage";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { FreqGradient } from "@/components/common/freq/FreqGradient";
import { SectionHeading } from "./SectionHeading";
import { DashboardPanel } from "./DashboardPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";

export const SpeedKatakanaHeatmap = () => {
  const revision = useStorageRevision(
    (key) => key == null || key.startsWith(STATS_KEY_PREFIX)
  );

  return (
    <DashboardPanel>
      <SectionHeading
        title={speedKatakanaPageMeta.shortLabel}
        description="Each cell is one challenge set (10 katakana words). Brighter cells mean a higher best CPM at over 70% accuracy. Columns are levels 1–20; rows are sets within each level."
      />
      <SpeedKatakanaHeatmapGrid key={revision} />
      <div className="flex items-center justify-center w-full">
        <div>
          <FreqGradient lessLabel="Slow" moreLabel="Fast" />
        </div>
      </div>
    </DashboardPanel>
  );
};
