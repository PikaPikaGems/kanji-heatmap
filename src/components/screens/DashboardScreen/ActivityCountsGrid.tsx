import { Eye, Keyboard, PenLine } from "lucide-react";
import {
  productionPracticePageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { OverviewStat } from "./OverviewStat";

export type ActivityCountsDisplay = {
  speedKatakanaDays: number;
  productionDays: number;
  recognitionDays: number;
  speedKatakanaSessions: number;
  productionRounds: number;
  recognitionRounds: number;
};

const COUNTS_ROW_CN =
  "grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3";

/** Day totals + session/round totals (3-up centered text / capped row). */
export const ActivityCountsGrid = ({
  stats,
}: {
  stats: ActivityCountsDisplay;
}) => (
  <div className="flex flex-col gap-2 sm:gap-3">
    <div className={COUNTS_ROW_CN}>
      <OverviewStat
        value={stats.productionDays}
        title={productionPracticePageMeta.shortLabel}
        unit="Days"
        Icon={PenLine}
        compact
      />
      <OverviewStat
        value={stats.recognitionDays}
        title={recognitionPracticePageMeta.shortLabel}
        unit="Days"
        Icon={Eye}
        compact
      />
      <OverviewStat
        value={stats.speedKatakanaDays}
        title={speedKatakanaPageMeta.shortLabel}
        unit="Days"
        Icon={Keyboard}
        compact
      />
    </div>
    <div className={COUNTS_ROW_CN}>
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
