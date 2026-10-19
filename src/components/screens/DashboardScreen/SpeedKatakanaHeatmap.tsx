import { useState } from "react";
import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSpeedKatakanaStats } from "@/hooks/use-speed-katakana-stats";
import { HEATMAP_METRIC_GRADIENT_LABELS } from "@/lib/activity";
import { DashboardPanel } from "./DashboardPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";
import { SpeedKatakanaMetricOptions } from "./SpeedKatakanaMetricOptions";
import { SpeedKatakanaInputOptions } from "./SpeedKatakanaInputOptions";
import type { PointerType } from "@/lib/speed-katakana/stats";
import { HeatmapLegendRow } from "./HeatmapLegendRow";
import { useLiveOrEmpty } from "./use-live-or-empty";

const SETTINGS_KEY = "speed-katakana-heatmap-settings";
type HeatmapSettings = { compact: boolean };
const DEFAULT_SETTINGS: HeatmapSettings = { compact: false };

const SpeedKatakanaHeatmapBody = () => {
  const devicePointer: PointerType = useCoarsePointer() ? "coarse" : "fine";
  // null until picked: follow this device's kind.
  const [picked, setPicked] = useState<PointerType | null>(null);
  const pointerType = picked ?? devicePointer;
  const allStats = useLiveOrEmpty(
    useSpeedKatakanaStats(pointerType),
    new Map()
  );
  const [metric] = useHeatmapCellMetric();
  const gradientLabels = HEATMAP_METRIC_GRADIENT_LABELS[metric];
  const [settings, setSetting] = useLocalStorage<HeatmapSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const compact = settings.compact === true;

  // Still loading (or the read failed): nothing to draw yet.
  if (!allStats) return null;

  return (
    <>
      <div
        key={`${compact ? "compact" : "wide"}-${pointerType}`}
        className="animate-fade-in"
      >
        <SpeedKatakanaHeatmapGrid
          allStats={allStats}
          metric={metric}
          compact={compact}
        />
      </div>
      <SpeedKatakanaInputOptions
        value={pointerType}
        devicePointer={devicePointer}
        onChange={setPicked}
      />
      <SpeedKatakanaMetricOptions />
      <HeatmapLegendRow
        name="Speed Katakana"
        lessLabel={gradientLabels.less}
        moreLabel={gradientLabels.more}
        compact={compact}
        onCompactChange={(v) => setSetting("compact", v)}
      />
    </>
  );
};

export const SpeedKatakanaHeatmap = () => (
  <DashboardPanel title={speedKatakanaPageMeta.shortLabel}>
    <SpeedKatakanaHeatmapBody />
  </DashboardPanel>
);
