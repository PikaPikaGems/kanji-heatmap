import { Link } from "@/components/dependent/routing";
import { useId } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GenericPopover } from "@/components/common/GenericPopover";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { GradientLegend } from "@/components/common/GradientLegend";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { fillTheKanjiPageMeta } from "@/lib/pages/practice-pages";
import { ATTEMPT_COUNT_BAND_LABELS, attemptCountToBand } from "@/lib/activity";
import {
  FILL_THE_KANJI_SETS,
  FillTheKanjiSetId,
} from "@/lib/fill-the-kanji/sets";
import {
  roundCount,
  roundLabel,
  roundRowRange,
} from "@/lib/fill-the-kanji/rounds";
import {
  readSetRoundStats,
  RoundStats,
  STATS_KEY_PREFIX,
} from "@/lib/fill-the-kanji/storage";
import { fillTheKanjiRoundHref } from "@/lib/fill-the-kanji/links";
import { formatLastAttempted } from "@/lib/fill-the-kanji/format";
import { SectionHeading } from "./SectionHeading";
import { DashboardPanel } from "./DashboardPanel";
import { HeatmapCell } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";

const CELL_PX = 13;
const GAP_PX = 3;
/** Rounds per row (rows read left to right, top to bottom) per layout. */
const WIDE_COLUMNS = 50;
const COMPACT_COLUMNS = 25;

const SETTINGS_KEY = "fill-the-kanji-heatmap-settings";
type HeatmapSettings = { compact: boolean };
const DEFAULT_SETTINGS: HeatmapSettings = { compact: false };

/** Wide / Compact layout switch, same as the Activity Heatmap's. */
const LayoutSettingsPopover = ({
  compact,
  onChange,
}: {
  compact: boolean;
  onChange: (compact: boolean) => void;
}) => {
  const switchId = useId();
  return (
    <GenericPopover
      contentClassName="m-0 p-0 max-w-56"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="p-2 rounded-xl bg-background"
          aria-label="Fill the Kanji heatmap settings"
        >
          <Settings className="size-2" />
        </Button>
      }
      content={
        <div className="p-5 space-y-3 text-left">
          <div className="text-xs font-extrabold uppercase text-muted-foreground">
            Layout
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Label
              htmlFor={switchId}
              className={!compact ? "text-foreground font-semibold" : undefined}
            >
              Wide
            </Label>
            <Switch
              id={switchId}
              checked={compact}
              onCheckedChange={onChange}
              aria-label="Toggle compact Fill the Kanji heatmap"
            />
            <Label
              htmlFor={switchId}
              className={compact ? "text-foreground font-semibold" : undefined}
            >
              Compact
            </Label>
          </div>
        </div>
      }
    />
  );
};

const RoundDetail = ({
  setId,
  round,
  stats,
}: {
  setId: FillTheKanjiSetId;
  round: number;
  stats: RoundStats | undefined;
}) => {
  const [start, end] = roundRowRange(setId, round);
  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-extrabold">
        Round {roundLabel(round)} (#{round})
      </div>
      <div className="text-muted-foreground">
        Sentences {start + 1}–{end}
      </div>
      {stats ? (
        <>
          <div className="text-muted-foreground">
            {ATTEMPT_COUNT_BAND_LABELS[attemptCountToBand(stats.attemptCount)]}
          </div>
          <div className="flex justify-between gap-4">
            <span>Attempts</span>
            <span className="font-bold tabular-nums">{stats.attemptCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Latest</span>
            <span className="font-bold tabular-nums">
              {stats.latestCorrect}/{stats.itemCount}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Best</span>
            <span className="font-bold tabular-nums">
              {stats.bestCorrect}/{stats.itemCount}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Last played</span>
            <span className="font-bold">
              {formatLastAttempted(stats.lastAttempted)}
            </span>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground">Not attempted yet</div>
      )}
      <div className="border-t border-dotted border-border">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="w-full text-xs font-semibold underline underline-offset-4 decoration-dotted"
        >
          <Link to={fillTheKanjiRoundHref(setId, round)}>Practice Now</Link>
        </Button>
      </div>
    </div>
  );
};

/** One set's rounds, `columns` per row, painted by attempt count. */
const SetHeatmapGrid = ({
  setId,
  columns,
}: {
  setId: FillTheKanjiSetId;
  columns: number;
}) => {
  const stats = readSetRoundStats(setId);
  const total = roundCount(setId);
  const played = Object.keys(stats).length;
  const label = FILL_THE_KANJI_SETS.find((s) => s.id === setId)?.label;

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-bold text-left">
        {label}{" "}
        <span className="font-normal text-muted-foreground tabular-nums">
          · {played}/{total} rounds played
        </span>
      </p>
      {/* Scrolls sideways on narrow screens instead of widening the page. */}
      <div className="pb-2 overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, ${CELL_PX}px)`,
            gap: GAP_PX,
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const round = i + 1;
            const roundStats = stats[String(round)];
            const attempts = roundStats?.attemptCount ?? 0;
            return (
              <HeatmapCell
                key={round}
                cellPx={CELL_PX}
                fillCn={heatmapFillCn(attemptCountToBand(attempts))}
                label={`Round ${roundLabel(round)}: ${attempts} attempts`}
                detail={
                  <RoundDetail setId={setId} round={round} stats={roundStats} />
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Every challenge set's heatmap, stacked. */
export const FillTheKanjiHeatmap = () => {
  const revision = useStorageRevision(
    (key) => key == null || key.startsWith(STATS_KEY_PREFIX)
  );
  const [settings, setSetting] = useLocalStorage<HeatmapSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const compact = settings.compact === true;
  const columns = compact ? COMPACT_COLUMNS : WIDE_COLUMNS;

  return (
    <DashboardPanel>
      <SectionHeading
        title={fillTheKanjiPageMeta.shortLabel}
        description="Each challenge set has its own heatmap. Each cell is one round of 20 sentences (the last round also takes any leftovers), 50 rounds per row (25 in the compact layout). Brighter cells mean more attempts."
      />
      <div
        key={revision}
        className="flex flex-col gap-5 mx-auto w-fit max-w-full animate-fade-in"
      >
        {FILL_THE_KANJI_SETS.map(({ id }) => (
          <SetHeatmapGrid key={id} setId={id} columns={columns} />
        ))}
      </div>
      <div className="flex items-center justify-center w-full mt-4">
        <div className="flex items-center gap-1">
          <GradientLegend /> ·
          <LayoutSettingsPopover
            compact={compact}
            onChange={(v) => setSetting("compact", v)}
          />
        </div>
      </div>
    </DashboardPanel>
  );
};
