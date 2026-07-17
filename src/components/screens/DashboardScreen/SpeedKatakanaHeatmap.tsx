import { useEffect, useState } from "react";
import { speedKatakanaPageMeta } from "@/components/items/practice-pages";
import { STATS_KEY_PREFIX } from "@/components/screens/SpeedKatakanaScreen/storage";
import { FreqGradient } from "@/components/common/freq/FreqGradient";
import { SectionHeading } from "./SectionHeading";
import { DashboardPanel } from "./DashboardPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";

export const SpeedKatakanaHeatmap = () => {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key == null || e.key.startsWith(STATS_KEY_PREFIX)) {
        setRevision((n) => n + 1);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
