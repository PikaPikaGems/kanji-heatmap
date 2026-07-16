import { CalendarDays, Eye, Keyboard, PenLine } from "lucide-react";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/components/items/practice-pages";
import { OverviewStat } from "./OverviewStat";

export type ActivityCountsDisplay = {
  daysActive: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
};

/** Shared 2×2 (mobile) / 4-up layout for activity counters. */
export const ActivityCountsGrid = ({
  stats,
}: {
  stats: ActivityCountsDisplay;
}) => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
    <OverviewStat
      value={stats.daysActive}
      label="Days active"
      Icon={CalendarDays}
    />
    <OverviewStat
      value={stats.speedKatakanaSessions}
      label={speedKatakanaPageMeta.shortLabel}
      Icon={Keyboard}
    />
    <OverviewStat
      value={stats.productionRounds}
      label={productionPracticePageMeta.shortLabel}
      Icon={PenLine}
    />
    <OverviewStat
      value={stats.recognitionRounds}
      label={recognitionPracticePageMeta.shortLabel}
      Icon={Eye}
    />
  </div>
);
