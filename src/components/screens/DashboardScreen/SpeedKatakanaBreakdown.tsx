import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import {
  CHALLENGES_PER_LEVEL,
  LEVELS,
  setFromLevelAndPos,
} from "@/components/screens/SpeedKatakanaScreen/constants";
import {
  readSetStats,
  STATS_KEY_PREFIX,
} from "@/components/screens/SpeedKatakanaScreen/storage";
import { countBands, cpmToBand } from "@/lib/activity";
import { useStorageRevision } from "@/hooks/use-storage-value";
import { SectionHeading } from "./SectionHeading";
import { SegmentedBandBar } from "./SegmentedBandBar";
import { DashboardPanel } from "./DashboardPanel";
import { FreqGradient } from "@/components/common/freq/FreqGradient";

const levelBandCounts = (level: number): number[] => {
  const bands = Array.from({ length: CHALLENGES_PER_LEVEL }, (_, i) => {
    const setNum = setFromLevelAndPos(level, i + 1);
    const stats = readSetStats(setNum);
    return cpmToBand(stats?.bestCpmWithAccuracyOver70);
  });
  return countBands(bands);
};

const LevelCell = ({ level }: { level: number }) => {
  const counts = levelBandCounts(level);
  const attempted = counts.slice(1).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-xs font-extrabold text-center shrink-0 tabular-nums text-muted-foreground">
        {level}
      </span>
      <div className="flex-1 min-w-0">
        <SegmentedBandBar counts={counts} totalUnits={CHALLENGES_PER_LEVEL} />
        <span className="sr-only">
          Level {level}: {attempted} of {CHALLENGES_PER_LEVEL} qualified
        </span>
      </div>
    </div>
  );
};

export const SpeedKatakanaBreakdown = () => {
  useStorageRevision((key) => key == null || key.startsWith(STATS_KEY_PREFIX));

  return (
    <DashboardPanel>
      <SectionHeading
        title={speedKatakanaPageMeta.shortLabel}
        description="Each bar is one challenge set (10 challenges), grouped by best CPM. Only attempts with accuracy > 70% count. Brighter = higher CPM. Clear a full 48-word run above 70% accuracy to fill these bars."
      />
      <div className="grid grid-flow-col grid-cols-4 grid-rows-5 gap-x-2 gap-y-2 sm:gap-x-2 sm:gap-y-2">
        {Array.from({ length: LEVELS }, (_, i) => i + 1).map((level) => (
          <LevelCell key={level} level={level} />
        ))}
      </div>
      <div className="flex items-center justify-center w-full mt-5">
        <div>
          <FreqGradient lessLabel="Slow" moreLabel="Fast" />
        </div>
      </div>
    </DashboardPanel>
  );
};
