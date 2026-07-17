import { CalendarDays, Eye, Keyboard, PenLine } from "lucide-react";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/components/items/practice-pages";
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

/** Day totals (2×2 / 4-up) + session/round totals (stacked / 3-up). */
export const ActivityCountsGrid = ({
  stats,
}: {
  stats: ActivityCountsDisplay;
}) => (
  <div className="flex flex-col gap-2 sm:gap-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <OverviewStat
        value={stats.daysActive}
        label="Total Days"
        Icon={CalendarDays}
      />
      <OverviewStat
        value={stats.speedKatakanaDays}
        label={`${speedKatakanaPageMeta.shortLabel} Days`}
        Icon={Keyboard}
      />
      <OverviewStat
        value={stats.productionDays}
        label={`${productionPracticePageMeta.shortLabel} Days`}
        Icon={PenLine}
      />
      <OverviewStat
        value={stats.recognitionDays}
        label={`${recognitionPracticePageMeta.shortLabel} Days`}
        Icon={Eye}
      />
    </div>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <OverviewStat
        value={stats.speedKatakanaSessions}
        label={`${speedKatakanaPageMeta.shortLabel} Sessions`}
        Icon={Keyboard}
        compact
      />
      <OverviewStat
        value={stats.productionRounds}
        label={`${productionPracticePageMeta.shortLabel} Rounds`}
        Icon={PenLine}
        compact
      />
      <OverviewStat
        value={stats.recognitionRounds}
        label={`${recognitionPracticePageMeta.shortLabel} Rounds`}
        Icon={Eye}
        compact
      />
    </div>
  </div>
);
