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
        { value: stats.recognitionDays, unit: "Days" },
        { value: stats.recognitionRounds, unit: "Rounds" },
      ]}
    />
    <ActivityStatCard
      title={productionPracticePageMeta.shortLabel}
      Icon={PenLine}
      counts={[
        { value: stats.productionDays, unit: "Days" },
        { value: stats.productionRounds, unit: "Rounds" },
      ]}
    />
    <ActivityStatCard
      title={fillTheKanjiPageMeta.shortLabel}
      Icon={Puzzle}
      counts={[
        { value: stats.fillTheKanjiDays, unit: "Days" },
        { value: stats.fillTheKanjiBatches, unit: "Batches" },
      ]}
    />
    <ActivityStatCard
      title={speedKatakanaPageMeta.shortLabel}
      Icon={Keyboard}
      counts={[
        { value: stats.speedKatakanaDays, unit: "Days" },
        { value: stats.speedKatakanaSessions, unit: "Sessions" },
      ]}
    />
  </div>
);
