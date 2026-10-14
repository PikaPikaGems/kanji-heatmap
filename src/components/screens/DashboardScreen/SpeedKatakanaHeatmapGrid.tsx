import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  levelOf,
  positionInLevel,
  setFromLevelAndPos,
} from "@/components/screens/SpeedKatakanaScreen/constants";
import { speedKatakanaChallengeHref } from "@/components/screens/SpeedKatakanaScreen/challenge-search-param";
import { Link } from "@/components/dependent/routing";
import { Button } from "@/components/ui/button";
import {
  AttemptCountShading,
  attemptCountLabel,
  HEATMAP_METRIC_BAND_LABELS,
  HeatmapCellMetric,
  metricToBand,
  metricValueText,
} from "@/lib/activity";
import { useAttemptCountScale } from "@/hooks/use-attempt-count-scale";
import { formatLastAttemptedDay } from "@/lib/fill-the-kanji/format";
import type {
  AllChallengeSetStats,
  ChallengeSetStats,
} from "@/lib/speed-katakana/stats";
import { HeatmapCell, HeatmapGrid } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";

const CELL_PX = 20;

const SetDetail = ({
  setNumber,
  stats,
  metric,
  band,
}: {
  setNumber: number;
  stats: ChallengeSetStats | null;
  metric: HeatmapCellMetric;
  band: ReturnType<typeof metricToBand>;
}) => {
  const level = levelOf(setNumber);
  const position = positionInLevel(setNumber);

  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-extrabold">
        Challenge {level}-{position} (#{setNumber})
      </div>
      {stats ? (
        <>
          <div className="text-muted-foreground">
            {metric === "attemptCount"
              ? attemptCountLabel(stats.timesTaken)
              : band === 0 && metric === "bestSpeedOver70"
                ? "No run above 70% accuracy"
                : HEATMAP_METRIC_BAND_LABELS[metric][band]}
          </div>
          <div className="flex justify-between gap-4">
            <span>Best speed</span>
            <span className="font-bold tabular-nums">{stats.bestCpm} CPM</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Best speed (&gt;70%)</span>
            <span className="font-bold tabular-nums">
              {stats.bestCpmWithAccuracyOver70 ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Best accuracy</span>
            <span className="font-bold tabular-nums">
              {stats.bestAccuracy}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Current speed</span>
            <span className="font-bold tabular-nums">
              {stats.latestCpm} CPM
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Current accuracy</span>
            <span className="font-bold tabular-nums">
              {stats.latestAccuracy}%
            </span>
          </div>
          {/* The top line already shows the count when coloring by it. */}
          {metric !== "attemptCount" && (
            <div className="flex justify-between gap-4">
              <span>Attempts</span>
              <span className="font-bold tabular-nums">{stats.timesTaken}</span>
            </div>
          )}
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
          <Link to={speedKatakanaChallengeHref(setNumber)}>Practice Now</Link>
        </Button>
      </div>
      {stats && (
        <div className="text-center text-muted-foreground">
          Last attempted: {formatLastAttemptedDay(stats.lastAttemptedAt)}
        </div>
      )}
    </div>
  );
};

const ChallengeSetCell = ({
  setNumber,
  stats,
  metric,
  attemptShading,
}: {
  setNumber: number;
  stats: ChallengeSetStats | null;
  metric: HeatmapCellMetric;
  attemptShading: AttemptCountShading;
}) => {
  const band = metricToBand(stats, metric, attemptShading);
  const level = levelOf(setNumber);
  const pos = positionInLevel(setNumber);
  const challengeLabel = `Challenge ${level}-${pos} (#${setNumber})`;

  const label = `${challengeLabel}: ${metricValueText(stats, metric)}`;

  return (
    <HeatmapCell
      cellPx={CELL_PX}
      fillCn={heatmapFillCn(band)}
      label={label}
      detail={
        <SetDetail
          setNumber={setNumber}
          stats={stats}
          metric={metric}
          band={band}
        />
      }
    />
  );
};

/** Most attempts on any challenge set, for the relative attempt-count scale. */
const maxTimesTaken = (allStats: AllChallengeSetStats) =>
  Math.max(0, ...[...allStats.values()].map((s) => s.timesTaken));

/** Levels per grid: all of them side by side, or two stacked halves. */
const levelGroups = (compact: boolean): number[][] => {
  const levels = Array.from({ length: LEVELS }, (_, i) => i + 1);
  if (!compact) return [levels];
  const half = Math.ceil(LEVELS / 2);
  return [levels.slice(0, half), levels.slice(half)];
};

/**
 * Fixed-size grid: one column per level (20 wide, or 10 + 10 stacked when
 * compact) × 10 rows (sets per level). Column flow fills each level
 * top-to-bottom, then the next level.
 */
export const SpeedKatakanaHeatmapGrid = ({
  allStats,
  metric,
  compact,
}: {
  allStats: AllChallengeSetStats;
  metric: HeatmapCellMetric;
  compact: boolean;
}) => {
  const [scale] = useAttemptCountScale();
  const attemptShading: AttemptCountShading = {
    scale,
    maxCount: maxTimesTaken(allStats),
  };

  return levelGroups(compact).map((levels) => (
    <HeatmapGrid
      key={levels[0]}
      cellPx={CELL_PX}
      rowCount={CHALLENGES_PER_LEVEL}
      topLabels={levels}
      topLabelCn="flex items-end justify-center h-3 tabular-nums"
      leftLabels={Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) =>
        i === 0 || i === 4 || i === 9 ? i + 1 : ""
      )}
    >
      {levels.map((level) =>
        Array.from({ length: CHALLENGES_PER_LEVEL }, (_, posIndex) => {
          const setNumber = setFromLevelAndPos(level, posIndex + 1);
          return (
            <ChallengeSetCell
              key={setNumber}
              setNumber={setNumber}
              stats={allStats.get(setNumber) ?? null}
              metric={metric}
              attemptShading={attemptShading}
            />
          );
        })
      )}
    </HeatmapGrid>
  ));
};
