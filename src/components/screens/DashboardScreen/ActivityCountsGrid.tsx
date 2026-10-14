import { Eye, Keyboard, PenLine, Puzzle } from "lucide-react";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { ActivityStatCard } from "./ActivityStatCard";

export type ActivityCountsDisplay = {
  speedKatakanaDays: number;
  productionDays: number;
  recognitionDays: number;
  fillTheKanjiDays: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
  fillTheKanjiBatches: number;
};

/** One card per activity: its days, then its rounds / batches / sessions. */
export const ActivityCountsGrid = ({
  stats,
}: {
  stats: ActivityCountsDisplay;
}) => (
  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 sm:gap-3">
    <ActivityStatCard
      title={recognitionPracticePageMeta.shortLabel}
      Icon={Eye}
      counts={[
        { value: stats.recognitionDays, unit: "Days", unitSingular: "Day" },
        {
          value: stats.recognitionRounds,
          unit: "Rounds",
          unitSingular: "Round",
        },
      ]}
    />
    <ActivityStatCard
      title={productionPracticePageMeta.shortLabel}
      Icon={PenLine}
      counts={[
        { value: stats.productionDays, unit: "Days", unitSingular: "Day" },
        {
          value: stats.productionRounds,
          unit: "Rounds",
          unitSingular: "Round",
        },
      ]}
    />
    <ActivityStatCard
      title={fillTheKanjiPageMeta.shortLabel}
      Icon={Puzzle}
      counts={[
        { value: stats.fillTheKanjiDays, unit: "Days", unitSingular: "Day" },
        {
          value: stats.fillTheKanjiBatches,
          unit: "Batches",
          unitSingular: "Batch",
        },
      ]}
    />
    <ActivityStatCard
      title={speedKatakanaPageMeta.shortLabel}
      Icon={Keyboard}
      counts={[
        { value: stats.speedKatakanaDays, unit: "Days", unitSingular: "Day" },
        {
          value: stats.speedKatakanaSessions,
          unit: "Sessions",
          unitSingular: "Session",
        },
      ]}
    />
  </div>
);
