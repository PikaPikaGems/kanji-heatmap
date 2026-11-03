import { Cake, CalendarDays } from "lucide-react";
import {
  countFillTheKanjiDays,
  EMPTY_ALL_TIME_SUMMARY,
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
import {
  ActivityCountsGrid,
  ActivityCountsGridSkeleton,
} from "./ActivityCountsGrid";
import {
  ItemsAddedCaption,
  OverviewCaption,
  OverviewCaptionSkeleton,
} from "./ActivityStatCard";
import { ReviewRatings } from "./ReviewRatings";
import { DashboardPanel } from "./DashboardPanel";
import { QueryFallback } from "./QueryFallback";
import { useLiveOrEmpty } from "./use-live-or-empty";

/** The overview's cards and its three captions as pulsing placeholders. */
const StatsOverviewSkeleton = () => (
  <>
    <ActivityCountsGridSkeleton />
    <div className="flex flex-col justify-center w-full gap-2 mt-4 sm:flex-row sm:gap-8">
      <OverviewCaptionSkeleton />
      <OverviewCaptionSkeleton />
      <OverviewCaptionSkeleton />
    </div>
  </>
);

const StatsOverviewBody = () => {
  const allTimeSnapshot = useAllTimeSummary();
  const allTime = useLiveOrEmpty(
    snapshotValue(allTimeSnapshot),
    EMPTY_ALL_TIME_SUMMARY
  );

  // Per-set day counts can't be added up, so Fill in the Kanji's active days come
  // from the daily summaries between its first attempt and today. Before there
  // is an attempt this reads just today and the result isn't used.
  const today = toLocalDateKey();
  const fillTheKanjiFrom =
    (allTime && firstFillTheKanjiDay(allTime.firstAttempts)) || today;
  const fillTheKanjiDaysSnapshot = useDailySummaries({
    start: fillTheKanjiFrom,
    end: today,
  });
  const fillTheKanjiDaily = useLiveOrEmpty(
    snapshotValue(fillTheKanjiDaysSnapshot),
    []
  );

  if (!allTime || !fillTheKanjiDaily) {
    return (
      <QueryFallback
        snapshots={[allTimeSnapshot, fillTheKanjiDaysSnapshot]}
        skeleton={<StatsOverviewSkeleton />}
      />
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
          Icon={Cake}
          label="Cake day"
          value={cakeDay ? formatCakeDay(cakeDay) : "Not yet"}
        />
        <div className="hidden sm:flex">·</div>
        <OverviewCaption
          Icon={CalendarDays}
          label="Days active"
          value={formatRawCount(stats.daysActive)}
        />
        <div className="hidden sm:flex">·</div>
        <ItemsAddedCaption count={stats.kinds.newKanji.count} />
      </div>
      <ReviewRatings ratings={allTime.totals.reviews} />
    </>
  );
};

export const StatsOverview = () => (
  <DashboardPanel title="All-time Overview" defaultOpen>
    <StatsOverviewBody />
  </DashboardPanel>
);
