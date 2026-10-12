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
import {
  AttemptCountShading,
  attemptCountLabel,
  attemptCountToBand,
} from "@/lib/activity";
import { useAttemptCountScale } from "@/hooks/use-attempt-count-scale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FILL_THE_KANJI_SET_GROUPS,
  FILL_THE_KANJI_SETS,
  FillTheKanjiSetId,
} from "@/lib/fill-the-kanji/sets";
import {
  batchCount,
  batchLabel,
  batchRowRange,
} from "@/lib/fill-the-kanji/batches";
import {
  readSetBatchStats,
  BatchStats,
  SetBatchStats,
  STATS_KEY_PREFIX,
} from "@/lib/fill-the-kanji/storage";
import { fillTheKanjiBatchHref } from "@/lib/fill-the-kanji/links";
import { formatLastAttempted } from "@/lib/fill-the-kanji/format";
import { DashboardPanel } from "./DashboardPanel";
import { HeatmapCell } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";
import { AttemptCountScaleOptions } from "./AttemptCountScaleOptions";

const CELL_PX = 13;
const GAP_PX = 3;
/** Batches per row (rows read left to right, top to bottom) per layout. */
const WIDE_COLUMNS = 50;
const COMPACT_COLUMNS = 25;

const SETTINGS_KEY = "fill-the-kanji-heatmap-settings";
type HeatmapSettings = { compact: boolean };
const DEFAULT_SETTINGS: HeatmapSettings = { compact: false };

/** Sums a set's attempt counts across its batches. */
const totalAttempts = (stats: SetBatchStats) =>
  Object.values(stats).reduce((sum, s) => sum + s.attemptCount, 0);

/** "5 / 384 batches completed · 7 total attempts" */
const ProgressSummary = ({
  completed,
  total,
  attempts,
}: {
  completed: number;
  total: number;
  attempts: number;
}) => (
  <>
    {completed.toLocaleString()} / {total.toLocaleString()} batches completed ·{" "}
    {attempts.toLocaleString()} total {attempts === 1 ? "attempt" : "attempts"}
  </>
);

/** Wide / Compact layout switch plus the attempt-count brightness scale. */
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
          <div className="pt-3 border-t border-dotted">
            <AttemptCountScaleOptions />
          </div>
        </div>
      }
    />
  );
};

const BatchDetail = ({
  setId,
  batch,
  stats,
}: {
  setId: FillTheKanjiSetId;
  batch: number;
  stats: BatchStats | undefined;
}) => {
  const [start, end] = batchRowRange(setId, batch);
  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-extrabold">
        Batch {batchLabel(batch)} (#{batch})
      </div>
      <div className="text-muted-foreground">
        Sentences {start + 1}–{end}
      </div>
      {stats ? (
        <div className="text-muted-foreground">
          {attemptCountLabel(stats.attemptCount)}
        </div>
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
          <Link to={fillTheKanjiBatchHref(setId, batch)}>Practice Now</Link>
        </Button>
      </div>
      {stats && (
        <div className="text-center text-muted-foreground">
          Last attempted: {formatLastAttempted(stats.lastAttempted)}
        </div>
      )}
    </div>
  );
};

/** One set's batches, `columns` per row, painted by attempt count. */
const SetHeatmapGrid = ({
  setId,
  stats,
  columns,
  attemptShading,
}: {
  setId: FillTheKanjiSetId;
  stats: SetBatchStats;
  columns: number;
  attemptShading: AttemptCountShading;
}) => {
  const total = batchCount(setId);
  const completed = Object.keys(stats).length;
  const label = FILL_THE_KANJI_SETS.find((s) => s.id === setId)?.label;

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-bold text-left">
        {label}{" "}
        <span className="font-normal text-muted-foreground tabular-nums">
          ·{" "}
          <ProgressSummary
            completed={completed}
            total={total}
            attempts={totalAttempts(stats)}
          />
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
            const batch = i + 1;
            const batchStats = stats[String(batch)];
            const attempts = batchStats?.attemptCount ?? 0;
            return (
              <HeatmapCell
                key={batch}
                cellPx={CELL_PX}
                fillCn={heatmapFillCn(
                  attemptCountToBand(attempts, attemptShading)
                )}
                label={`Batch ${batchLabel(batch)}: ${attempts} attempts`}
                detail={
                  <BatchDetail setId={setId} batch={batch} stats={batchStats} />
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Group title plus how many of its batches have been completed. */
const GroupTrigger = ({
  title,
  setIds,
  statsById,
}: {
  title: string;
  setIds: FillTheKanjiSetId[];
  statsById: Map<FillTheKanjiSetId, SetBatchStats>;
}) => {
  const groupStats = setIds.map((id) => statsById.get(id) ?? {});
  const completed = groupStats.reduce(
    (sum, stats) => sum + Object.keys(stats).length,
    0
  );
  const attempts = groupStats.reduce(
    (sum, stats) => sum + totalAttempts(stats),
    0
  );
  const total = setIds.reduce((sum, id) => sum + batchCount(id), 0);
  return (
    <span className="flex flex-col">
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs font-normal text-muted-foreground tabular-nums">
        <ProgressSummary
          completed={completed}
          total={total}
          attempts={attempts}
        />
      </span>
    </span>
  );
};

/**
 * Every challenge set's heatmap, in collapsible groups (only the first open),
 * so opening the section doesn't draw every grid at once.
 */
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
  const [scale] = useAttemptCountScale();

  // Read every set up front: the relative scale compares against the most
  // attempts on any batch across all sets.
  const statsById = new Map(
    FILL_THE_KANJI_SETS.map(({ id }) => [id, readSetBatchStats(id)] as const)
  );
  const maxCount = Math.max(
    0,
    ...[...statsById.values()].flatMap((stats) =>
      Object.values(stats).map((s) => s.attemptCount)
    )
  );
  const attemptShading: AttemptCountShading = { scale, maxCount };

  return (
    <DashboardPanel title={fillTheKanjiPageMeta.shortLabel}>
      <Accordion
        key={revision}
        type="multiple"
        defaultValue={[FILL_THE_KANJI_SET_GROUPS[0].title]}
        className="animate-fade-in"
      >
        {FILL_THE_KANJI_SET_GROUPS.map(({ title, setIds }) => (
          <AccordionItem
            key={title}
            value={title}
            className="border-b-2 border-dashed last:border-b-0"
          >
            <AccordionTrigger className="py-3 text-left hover:no-underline">
              <GroupTrigger
                title={title}
                setIds={setIds}
                statsById={statsById}
              />
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-5 pl-3 border-l-2 border-dotted">
              {setIds.map((id) => (
                <SetHeatmapGrid
                  key={id}
                  setId={id}
                  stats={statsById.get(id) ?? {}}
                  columns={columns}
                  attemptShading={attemptShading}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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
