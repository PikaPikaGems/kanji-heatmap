import { CalendarDays, Eye, Keyboard, PenLine } from "lucide-react";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { OverviewStat } from "./OverviewStat";

export type ActivityCountsDisplay = {
  daysActive: number;
  speedKatakanaDays: number;
  productionDays: number;
  recognitionDays: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
};

/** Day totals (2×2 / 4-up) + session/round totals (3-up centered text / capped row). */
export const ActivityCountsGrid = ({
  stats,
}: {
  stats: ActivityCountsDisplay;
}) => (
  <div className="flex flex-col gap-2 sm:gap-3">
    <div className="grid grid-cols-2 gap-2 justify-items-start sm:grid-cols-4 sm:gap-3">
      <OverviewStat
        value={stats.daysActive}
        title="Total"
        unit="Days"
        Icon={CalendarDays}
      />
      <OverviewStat
        value={stats.productionDays}
        title={productionPracticePageMeta.shortLabel}
        unit="Days"
        Icon={PenLine}
      />
      <OverviewStat
        value={stats.recognitionDays}
        title={recognitionPracticePageMeta.shortLabel}
        unit="Days"
        Icon={Eye}
      />
      <OverviewStat
        value={stats.speedKatakanaDays}
        title={speedKatakanaPageMeta.shortLabel}
        unit="Days"
        Icon={Keyboard}
      />
    </div>
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
      <OverviewStat
        value={stats.productionRounds}
        title={productionPracticePageMeta.shortLabel}
        unit="Rounds"
        Icon={PenLine}
        compact
      />
      <OverviewStat
        value={stats.recognitionRounds}
        title={recognitionPracticePageMeta.shortLabel}
        unit="Rounds"
        Icon={Eye}
        compact
      />
      <OverviewStat
        value={stats.speedKatakanaSessions}
        title={speedKatakanaPageMeta.shortLabel}
        unit="Sessions"
        Icon={Keyboard}
        compact
      />
    </div>
  </div>
);
