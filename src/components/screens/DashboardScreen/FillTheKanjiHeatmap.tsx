import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAllSetBatchStats } from "@/hooks/use-all-set-batch-stats";
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
  formatPercentComplete,
  setRowCount,
} from "@/lib/fill-the-kanji/batches";
import {
  AllSetBatchStats,
  BatchStats,
  SetBatchStats,
  rowsSeen,
} from "@/lib/fill-the-kanji/progress";
import { fillTheKanjiBatchHref } from "@/lib/fill-the-kanji/links";
import { formatLastAttemptedDay } from "@/lib/fill-the-kanji/format";
import { DashboardPanel } from "./DashboardPanel";
import { PracticeNowLink } from "./PracticeNowLink";
import { HeatmapCell } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";
import { AttemptCountScaleOptions } from "./AttemptCountScaleOptions";
import { FillTheKanjiSetProgress } from "./FillTheKanjiSetProgress";
import { HeatmapLegendRow } from "./HeatmapLegendRow";
import { useLiveOrEmpty } from "./use-live-or-empty";

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

/** "240 phrases seen · 2% complete · 24 total attempts*" */
const ProgressSummary = ({
  seen,
  total,
  attempts,
}: {
  seen: number;
  /** Phrases in the set (or group). */
  total: number;
  attempts: number;
}) => (
  <>
    <span className="font-bold text-green-500">{seen.toLocaleString()}</span>{" "}
    phrases seen ·{" "}
    <span className="font-bold">{formatPercentComplete(seen, total)}</span>{" "}
    complete · <span className="font-bold">{attempts.toLocaleString()}</span>{" "}
    total {attempts === 1 ? "attempt" : "attempts"}*
  </>
);

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
      <div className="pt-2.5 border-t border-dotted border-border">
        <PracticeNowLink to={fillTheKanjiBatchHref(setId, batch)} />
      </div>
      {stats && (
        <div className="text-center text-muted-foreground">
          Last attempted: {formatLastAttemptedDay(stats.lastAttemptedAt)}
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
  const label = FILL_THE_KANJI_SETS.find((s) => s.id === setId)?.label;

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-bold text-left">
        {label}{" "}
        <span className="font-normal text-muted-foreground tabular-nums">
          ·{" "}
          <ProgressSummary
            seen={rowsSeen(setId, stats)}
            total={setRowCount(setId)}
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
            const batchStats = stats[batch];
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

/** Group title plus how many of its phrases have been seen. */
const GroupTrigger = ({
  title,
  setIds,
  statsById,
}: {
  title: string;
  setIds: FillTheKanjiSetId[];
  statsById: AllSetBatchStats;
}) => {
  const seen = setIds.reduce(
    (sum, id) => sum + rowsSeen(id, statsById.get(id) ?? {}),
    0
  );
  const attempts = setIds.reduce(
    (sum, id) => sum + totalAttempts(statsById.get(id) ?? {}),
    0
  );
  const total = setIds.reduce((sum, id) => sum + setRowCount(id), 0);
  return (
    <span className="flex flex-col">
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs font-normal text-muted-foreground tabular-nums">
        <ProgressSummary seen={seen} total={total} attempts={attempts} />
      </span>
    </span>
  );
};

/**
 * Every challenge set's heatmap, in collapsible groups (only the first open),
 * so opening the section doesn't draw every grid at once.
 */
const FillTheKanjiHeatmapBody = () => {
  const statsById = useLiveOrEmpty(useAllSetBatchStats(), new Map());
  const [settings, setSetting] = useLocalStorage<HeatmapSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const compact = settings.compact === true;
  const columns = compact ? COMPACT_COLUMNS : WIDE_COLUMNS;
  const [scale] = useAttemptCountScale();

  // Still loading (or the read failed): nothing to draw yet.
  if (!statsById) return null;

  // The relative scale compares against the most attempts on any batch across
  // all sets.
  const maxCount = Math.max(
    0,
    ...[...statsById.values()].flatMap((stats) =>
      Object.values(stats).map((s) => s.attemptCount)
    )
  );
  const attemptShading: AttemptCountShading = { scale, maxCount };

  return (
    <>
      <Accordion
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
      <p className="mt-4 text-[10px] text-muted-foreground">
        * A phrase (sentence or emoji) counts as seen once you finish a batch
        that has it. Complete is the share of the set (or group) seen.
      </p>
      <HeatmapLegendRow
        name="Fill in the Kanji"
        compact={compact}
        onCompactChange={(v) => setSetting("compact", v)}
      >
        <AttemptCountScaleOptions />
      </HeatmapLegendRow>
      <div className="mt-6">
        <FillTheKanjiSetProgress statsById={statsById} />
      </div>
    </>
  );
};

export const FillTheKanjiHeatmap = () => (
  <DashboardPanel title={fillTheKanjiPageMeta.shortLabel}>
    <FillTheKanjiHeatmapBody />
  </DashboardPanel>
);
