import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
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
import { ArrowRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CPM_BAND_LABELS, cpmToBand } from "@/lib/activity";
import { HeatmapCell, HeatmapGrid, heatmapFillCn } from "./HeatmapGrid";

const CELL_PX = 20;

const SetDetail = ({
  setNumber,
  stats,
  band,
}: {
  setNumber: number;
  stats: ChallengeSetStats | null;
  band: ReturnType<typeof cpmToBand>;
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
          {band > 0 ? (
            <div className="text-muted-foreground">{CPM_BAND_LABELS[band]}</div>
          ) : (
            <div className="text-muted-foreground">
              No run above 70% accuracy
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span>Best CPM</span>
            <span className="font-bold tabular-nums">{stats.bestCpm}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Best CPM (&gt;70%)</span>
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
            <span>Latest CPM</span>
            <span className="font-bold tabular-nums">{stats.latestCpm}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Attempts</span>
            <span className="font-bold tabular-nums">{stats.timesTaken}</span>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground">Not attempted yet</div>
      )}
      <div className="pt-2 mt-1 border-t border-border">
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="w-full h-8 font-semibold"
        >
          <Link to={speedKatakanaChallengeHref(setNumber)}>
            Practice
            <ArrowRight className="size-3.5 opacity-70" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
};

const ChallengeSetCell = ({ setNumber }: { setNumber: number }) => {
  const stats = readSetStats(setNumber);
  const band = cpmToBand(stats?.bestCpmWithAccuracyOver70);
  const level = levelOf(setNumber);
  const pos = positionInLevel(setNumber);
  const challengeLabel = `Challenge ${level}-${pos} (#${setNumber})`;

  const label = stats?.bestCpmWithAccuracyOver70
    ? `${challengeLabel}: ${stats.bestCpmWithAccuracyOver70} CPM`
    : `${challengeLabel}: not attempted`;

  return (
    <HeatmapCell
      cellPx={CELL_PX}
      fillCn={heatmapFillCn(band)}
      label={label}
      detail={<SetDetail setNumber={setNumber} stats={stats} band={band} />}
    />
  );
};

/**
 * Fixed-size grid: 20 columns (levels) × 10 rows (sets per level).
 * Column flow fills each level top-to-bottom, then the next level.
 */
export const SpeedKatakanaHeatmapGrid = () => {
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
          return <ChallengeSetCell key={setNumber} setNumber={setNumber} />;
        })
      )}
    </HeatmapGrid>
  );
};
