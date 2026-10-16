import { Brain, Brush, Eye, Keyboard, PenLine, Puzzle } from "lucide-react";
import {
  ActivityStats,
  READING_MASTERY_LABEL,
  WRITING_MASTERY_LABEL,
} from "@/lib/activity";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { ActivityStatCard } from "./ActivityStatCard";

/**
 * One card per activity: its days, then its reviews / rounds / batches /
 * sessions. The two mastery games come first, then the four practice games.
 */
export const ActivityCountsGrid = ({ stats }: { stats: ActivityStats }) => {
  const { kinds } = stats;
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <ActivityStatCard
          title={READING_MASTERY_LABEL}
          Icon={Brain}
          counts={[
            {
              value: kinds.readingMastery.days,
              unit: "Days",
              unitSingular: "Day",
            },
            {
              value: kinds.readingMastery.count,
              unit: "Reviews",
              unitSingular: "Review",
            },
          ]}
        />
        <ActivityStatCard
          title={WRITING_MASTERY_LABEL}
          Icon={Brush}
          counts={[
            {
              value: kinds.writingMastery.days,
              unit: "Days",
              unitSingular: "Day",
            },
            {
              value: kinds.writingMastery.count,
              unit: "Reviews",
              unitSingular: "Review",
            },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 sm:gap-3">
        <ActivityStatCard
          title={recognitionPracticePageMeta.shortLabel}
          Icon={Eye}
          counts={[
            {
              value: kinds.recognition.days,
              unit: "Days",
              unitSingular: "Day",
            },
            {
              value: kinds.recognition.count,
              unit: "Rounds",
              unitSingular: "Round",
            },
          ]}
        />
        <ActivityStatCard
          title={productionPracticePageMeta.shortLabel}
          Icon={PenLine}
          counts={[
            { value: kinds.production.days, unit: "Days", unitSingular: "Day" },
            {
              value: kinds.production.count,
              unit: "Rounds",
              unitSingular: "Round",
            },
          ]}
        />
        <ActivityStatCard
          title={fillTheKanjiPageMeta.shortLabel}
          Icon={Puzzle}
          counts={[
            {
              value: kinds.fillTheKanji.days,
              unit: "Days",
              unitSingular: "Day",
            },
            {
              value: kinds.fillTheKanji.count,
              unit: "Batches",
              unitSingular: "Batch",
            },
          ]}
        />
        <ActivityStatCard
          title={speedKatakanaPageMeta.shortLabel}
          Icon={Keyboard}
          counts={[
            {
              value: kinds.speedKatakana.days,
              unit: "Days",
              unitSingular: "Day",
            },
            {
              value: kinds.speedKatakana.count,
              unit: "Sessions",
              unitSingular: "Session",
            },
          ]}
        />
      </div>
    </div>
  );
};
