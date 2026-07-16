import { CalendarDays, Eye, Keyboard, PenLine } from "lucide-react";
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
      label="Speed Katakana"
      Icon={Keyboard}
    />
    <OverviewStat
      value={stats.productionRounds}
      label="Kanji Production"
      Icon={PenLine}
    />
    <OverviewStat
      value={stats.recognitionRounds}
      label="Kanji Recognition"
      Icon={Eye}
    />
  </div>
);
