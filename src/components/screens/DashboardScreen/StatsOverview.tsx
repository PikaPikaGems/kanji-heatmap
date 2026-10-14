import { Cake, CalendarDays } from "lucide-react";
import {
  countFillTheKanjiDays,
  firstFillTheKanjiDay,
  formatCakeDay,
  toAllTimeStats,
  toLocalDateKey,
} from "@/lib/activity";
import { snapshotValue } from "@/lib/engine/store-cache";
import {
  useAllTimeSummary,
  useDailySummaries,
} from "@/hooks/use-activity-summaries";
import { formatRawCount } from "@/lib/format-count";
import { AccountGatedPanel } from "./AccountGatedPanel";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { OverviewCaption } from "./ActivityStatCard";
import { QueryFallback } from "./QueryFallback";

const StatsOverviewBody = () => {
  const allTimeSnapshot = useAllTimeSummary();
  const allTime = snapshotValue(allTimeSnapshot);

  // Per-set day counts can't be added up, so Fill the Kanji's active days come
  // from the daily summaries between its first attempt and today. Before there
  // is an attempt this reads just today and the result isn't used.
  const today = toLocalDateKey();
  const fillTheKanjiFrom =
    (allTime && firstFillTheKanjiDay(allTime.firstAttempts)) || today;
  const fillTheKanjiDaysSnapshot = useDailySummaries({
    start: fillTheKanjiFrom,
    end: today,
  });
  const fillTheKanjiDaily = snapshotValue(fillTheKanjiDaysSnapshot);

  if (!allTime || !fillTheKanjiDaily) {
    return (
      <QueryFallback snapshots={[allTimeSnapshot, fillTheKanjiDaysSnapshot]} />
    );
  }

  const stats = toAllTimeStats(
    allTime,
    countFillTheKanjiDays(fillTheKanjiDaily)
  );
  const { cakeDay } = allTime.firstAttempts;

  return (
    <>
      <ActivityCountsGrid stats={stats} />
      <div className="flex flex-col justify-center w-full gap-2 mt-4 sm:flex-row">
        <OverviewCaption
          Icon={CalendarDays}
          label="Days active"
          value={formatRawCount(stats.daysActive)}
        />
        <div className="hidden sm:flex">·</div>
        <OverviewCaption
          Icon={Cake}
          label="Cake day"
          value={cakeDay ? formatCakeDay(cakeDay) : "Not yet"}
        />
      </div>
    </>
  );
};

export const StatsOverview = () => (
  <AccountGatedPanel title="All-time Overview" defaultOpen>
    <StatsOverviewBody />
  </AccountGatedPanel>
);
