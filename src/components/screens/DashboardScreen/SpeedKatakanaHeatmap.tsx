import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { STATS_KEY_PREFIX } from "@/components/screens/SpeedKatakanaScreen/storage";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { useHeatmapCellMetric } from "@/hooks/use-heatmap-cell-metric";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { HEATMAP_METRIC_GRADIENT_LABELS } from "@/lib/activity";
import { DashboardPanel } from "./DashboardPanel";
import { SpeedKatakanaHeatmapGrid } from "./SpeedKatakanaHeatmapGrid";
import { SpeedKatakanaHeatmapSettingsPopover } from "./SpeedKatakanaHeatmapSettingsPopover";
import { HeatmapLegendRow } from "./HeatmapLegendRow";

const SETTINGS_KEY = "speed-katakana-heatmap-settings";
type HeatmapSettings = { compact: boolean };
const DEFAULT_SETTINGS: HeatmapSettings = { compact: false };

export const SpeedKatakanaHeatmap = () => {
  const revision = useStorageRevision(
    (key) => key == null || key.startsWith(STATS_KEY_PREFIX)
  );
  const [metric] = useHeatmapCellMetric();
  const gradientLabels = HEATMAP_METRIC_GRADIENT_LABELS[metric];
  const [settings, setSetting] = useLocalStorage<HeatmapSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const compact = settings.compact === true;

  return (
    <DashboardPanel title={speedKatakanaPageMeta.shortLabel}>
      <div className="flex justify-center mb-6 animate-fade-in">
        <SpeedKatakanaHeatmapSettingsPopover />
      </div>
      <div
        key={`${revision}-${compact ? "compact" : "wide"}`}
        className="animate-fade-in"
      >
        <SpeedKatakanaHeatmapGrid metric={metric} compact={compact} />
      </div>
      <HeatmapLegendRow
        name="Speed Katakana"
        lessLabel={gradientLabels.less}
        moreLabel={gradientLabels.more}
        compact={compact}
        onCompactChange={(v) => setSetting("compact", v)}
      />
    </DashboardPanel>
  );
};
