import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSpeedKatakanaStats } from "@/hooks/use-speed-katakana-stats";
import { HEATMAP_METRIC_GRADIENT_LABELS } from "@/lib/activity";
import { AccountGatedPanel } from "./AccountGatedPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";
import { SpeedKatakanaHeatmapSettingsPopover } from "./SpeedKatakanaHeatmapSettingsPopover";
import { HeatmapLegendRow } from "./HeatmapLegendRow";

const SETTINGS_KEY = "speed-katakana-heatmap-settings";
type HeatmapSettings = { compact: boolean };
const DEFAULT_SETTINGS: HeatmapSettings = { compact: false };

const SpeedKatakanaHeatmapBody = () => {
  const allStats = useSpeedKatakanaStats();
  const isCoarsePointer = useCoarsePointer();
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
      <div className="flex justify-center mb-6 animate-fade-in">
        <SpeedKatakanaHeatmapSettingsPopover />
      </div>
      <div key={compact ? "compact" : "wide"} className="animate-fade-in">
        <SpeedKatakanaHeatmapGrid
          allStats={allStats}
          metric={metric}
          compact={compact}
        />
      </div>
      <HeatmapLegendRow
        name="Speed Katakana"
        lessLabel={gradientLabels.less}
        moreLabel={gradientLabels.more}
        compact={compact}
        onCompactChange={(v) => setSetting("compact", v)}
      />
      <p className="mt-4 text-[10px] text-center text-muted-foreground">
        Showing sessions from {isCoarsePointer ? "touchscreens" : "keyboards"},
        like this device.
      </p>
    </>
  );
};

export const SpeedKatakanaHeatmap = () => (
  <AccountGatedPanel title={speedKatakanaPageMeta.shortLabel}>
    <SpeedKatakanaHeatmapBody />
  </AccountGatedPanel>
);
