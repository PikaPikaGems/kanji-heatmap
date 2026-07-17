import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  levelOf,
  positionInLevel,
  setFromLevelAndPos,
} from "@/components/screens/SpeedKatakanaScreen/constants";
import {
  ChallengeSetStats,
  readSetStats,
} from "@/components/screens/SpeedKatakanaScreen/storage";
import { CPM_BAND_LABELS, cpmToBand } from "@/lib/activity";
import { freqCategoryCn } from "@/lib/freq/freq-category";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CELL_PX = 20;
const GAP_PX = 3;

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
        Set {setNumber} · Level {level}, #{position}
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
    </div>
  );
};

const ChallengeSetCell = ({ setNumber }: { setNumber: number }) => {
  const stats = readSetStats(setNumber);
  const band = cpmToBand(stats?.bestCpmWithAccuracyOver70);
  const fillCn =
    band === 0
      ? cn(
          "bg-muted/50 dark:bg-muted/30",
          "border border-border dark:border-border"
        )
      : cn(freqCategoryCn[band], "border border-black/10 dark:border-white/10");

  const label = stats?.bestCpmWithAccuracyOver70
    ? `Set ${setNumber}: ${stats.bestCpmWithAccuracyOver70} CPM`
    : `Set ${setNumber}: not attempted`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          style={{ width: CELL_PX, height: CELL_PX }}
          className={cn(
            "cursor-pointer rounded-[2px] outline-none transition-colors",
            "hover:bg-cyan-400 hover:border-foreground",
            "hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 hover:ring-offset-background",
            "focus-visible:ring-2 focus-visible:ring-ring",
            fillCn
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="p-3 w-52" side="top">
        <SetDetail setNumber={setNumber} stats={stats} band={band} />
      </PopoverContent>
    </Popover>
  );
};

/**
 * Fixed-size grid: 20 columns (levels) × 10 rows (sets per level).
 * Column flow fills each level top-to-bottom, then the next level.
 */
export const SpeedKatakanaHeatmapGrid = () => {
  return (
    <div className="overflow-x-auto pb-2 mb-4 px-1 [-webkit-mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] sm:[-webkit-mask-image:none] sm:[mask-image:none]">
      <div
        className="inline-grid"
        style={{
          gridTemplateAreas: `"empty levels" "rows squares"`,
          gridTemplateColumns: "auto 1fr",
          columnGap: 6,
          rowGap: GAP_PX,
        }}
      >
        <div
          className="text-[10px] leading-none text-muted-foreground"
          style={{
            gridArea: "levels",
            display: "grid",
            gridTemplateColumns: `repeat(${LEVELS}, ${CELL_PX}px)`,
            columnGap: GAP_PX,
          }}
        >
          {Array.from({ length: LEVELS }, (_, i) => (
            <div
              key={i}
              className="flex items-end justify-center h-3 tabular-nums"
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div
          className="text-[10px] leading-none text-muted-foreground"
          style={{
            gridArea: "rows",
            display: "grid",
            gridTemplateRows: `repeat(${CHALLENGES_PER_LEVEL}, ${CELL_PX}px)`,
            rowGap: GAP_PX,
          }}
        >
          {Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) => (
            <div key={i} className="flex items-center justify-end pr-0.5">
              {i === 0 || i === 4 || i === 9 ? i + 1 : ""}
            </div>
          ))}
        </div>

        <div
          style={{
            gridArea: "squares",
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: CELL_PX,
            gridTemplateRows: `repeat(${CHALLENGES_PER_LEVEL}, ${CELL_PX}px)`,
            gap: GAP_PX,
          }}
        >
          {Array.from({ length: LEVELS }, (_, levelIndex) =>
            Array.from({ length: CHALLENGES_PER_LEVEL }, (_, posIndex) => {
              const setNumber = setFromLevelAndPos(
                levelIndex + 1,
                posIndex + 1
              );
              return <ChallengeSetCell key={setNumber} setNumber={setNumber} />;
            })
          )}
        </div>
      </div>
    </div>
  );
};
