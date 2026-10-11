import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  SPEED_KATAKANA_TOTAL_CHALLENGES,
  levelOf,
  positionInLevel,
  setFromLevelAndPos,
} from "@/components/screens/SpeedKatakanaScreen/constants";
import { speedKatakanaChallengeHref } from "@/components/screens/SpeedKatakanaScreen/challenge-search-param";
import {
  ChallengeSetStats,
  readSetStats,
} from "@/components/screens/SpeedKatakanaScreen/storage";
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
import { formatLastAttempted } from "@/lib/fill-the-kanji/format";
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
          Last attempted:{" "}
          {stats.lastAttempted != null
            ? formatLastAttempted(stats.lastAttempted)
            : "not recorded"}
        </div>
      )}
    </div>
  );
};

const ChallengeSetCell = ({
  setNumber,
  metric,
  attemptShading,
}: {
  setNumber: number;
  metric: HeatmapCellMetric;
  attemptShading: AttemptCountShading;
}) => {
  const stats = readSetStats(setNumber);
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
const maxTimesTaken = () => {
  let max = 0;
  for (let set = 1; set <= SPEED_KATAKANA_TOTAL_CHALLENGES; set++) {
    max = Math.max(max, readSetStats(set)?.timesTaken ?? 0);
  }
  return max;
};

/**
 * Fixed-size grid: 20 columns (levels) × 10 rows (sets per level).
 * Column flow fills each level top-to-bottom, then the next level.
 */
export const SpeedKatakanaHeatmapGrid = ({
  metric,
}: {
  metric: HeatmapCellMetric;
}) => {
  const [scale] = useAttemptCountScale();
  const attemptShading: AttemptCountShading = {
    scale,
    maxCount: maxTimesTaken(),
  };

  return (
    <HeatmapGrid
      cellPx={CELL_PX}
      rowCount={CHALLENGES_PER_LEVEL}
      topLabels={Array.from({ length: LEVELS }, (_, i) => i + 1)}
      topLabelCn="flex items-end justify-center h-3 tabular-nums"
      leftLabels={Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) =>
        i === 0 || i === 4 || i === 9 ? i + 1 : ""
      )}
    >
      {Array.from({ length: LEVELS }, (_, levelIndex) =>
        Array.from({ length: CHALLENGES_PER_LEVEL }, (_, posIndex) => {
          const setNumber = setFromLevelAndPos(levelIndex + 1, posIndex + 1);
          return (
            <ChallengeSetCell
              key={setNumber}
              setNumber={setNumber}
              metric={metric}
              attemptShading={attemptShading}
            />
          );
        })
      )}
    </HeatmapGrid>
  );
};
