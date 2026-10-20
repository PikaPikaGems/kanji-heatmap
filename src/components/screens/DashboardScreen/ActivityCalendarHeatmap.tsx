import { CalendarDays } from "lucide-react";
import {
  ActivityByDay,
  ActivityKindFilters,
  ActivityStats,
  buildCalendarWeeks,
  buildMonthHalfColumns,
  DateRange,
  getDurationRange,
  maxDayTotalInRange,
  monthLabelsForWeeks,
  type DayRatings,
  ratingsInRange,
  type RatingsByDay,
  summarizeActivityInRange,
  toActivityByDay,
  toRatingsByDay,
} from "@/lib/activity";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useDailySummaries } from "@/hooks/use-activity-summaries";
import { useActivityHeatmapSettings } from "@/hooks/use-activity-heatmap-settings";
import { HeatmapLegendRow } from "./HeatmapLegendRow";
import {
  ActivityCountsGrid,
  ActivityCountsGridSkeleton,
} from "./ActivityCountsGrid";
import { ActivityKindFiltersRow } from "./ActivityKindFiltersRow";
import { DurationNav } from "./DurationNav";
import { CalendarGrid } from "./CalendarGrid";
import { VerticalCalendarGrid } from "./VerticalCalendarGrid";
import { DashboardPanel } from "./DashboardPanel";
import { isQueryFailed } from "./is-query-failed";
import { QueryFallback } from "./QueryFallback";
import { useLiveOrEmpty } from "./use-live-or-empty";
import {
  KanjiAddedCaption,
  OverviewCaption,
  OverviewCaptionSkeleton,
} from "./ActivityStatCard";
import { ReviewRatings } from "./ReviewRatings";
import { formatRawCount } from "@/lib/format-count";

const ActivityHeatmapGrid = ({
  vertical,
  range,
  byDay,
  ratingsByDay,
  filters,
  maxN,
}: {
  vertical: boolean;
  range: DateRange;
  /** null while loading: the same grid with pulsing placeholder squares. */
  byDay: ActivityByDay | null;
  ratingsByDay: RatingsByDay | null;
  filters: ActivityKindFilters;
  maxN: number;
}) => {
  if (vertical) {
    return (
      <VerticalCalendarGrid
        columns={buildMonthHalfColumns(range)}
        byDay={byDay}
        ratingsByDay={ratingsByDay}
        filters={filters}
        maxN={maxN}
      />
    );
  }

  const weeks = buildCalendarWeeks(range);
  return (
    <CalendarGrid
      weeks={weeks}
      monthLabels={monthLabelsForWeeks(weeks, "japanese-numbers")}
      byDay={byDay}
      ratingsByDay={ratingsByDay}
      filters={filters}
      maxN={maxN}
    />
  );
};

/**
 * The period's cards, its captions and its review ratings. Kanji added and
 * each ratings row follow their activity filter.
 */
const PeriodSummary = ({
  stats,
  ratings,
  filters,
}: {
  stats: ActivityStats;
  ratings: DayRatings;
  filters: ActivityKindFilters;
}) => (
  <>
    <ActivityCountsGrid stats={stats} />
    <div className="flex flex-col justify-center w-full gap-2 mt-4 sm:flex-row">
      <OverviewCaption
        Icon={CalendarDays}
        label="Days active"
        value={formatRawCount(stats.daysActive)}
      />
      {filters.newKanji && (
        <>
          <div className="hidden sm:flex">·</div>
          <KanjiAddedCaption count={stats.kinds.newKanji.count} />
        </>
      )}
    </div>
    <ReviewRatings
      ratings={ratings}
      showReading={filters.readingMastery}
      showWriting={filters.writingMastery}
    />
  </>
);

const PeriodSummarySkeleton = () => (
  <>
    <ActivityCountsGridSkeleton />
    <div className="mt-4">
      <OverviewCaptionSkeleton />
    </div>
  </>
);

const ActivityCalendarHeatmapBody = () => {
  const [{ duration, filters, vertical }, setSetting] =
    useActivityHeatmapSettings();

  const range = getDurationRange(duration);
  const snapshot = useDailySummaries(range);
  const summaries = useLiveOrEmpty(snapshotValue(snapshot), []);
  const byDay = summaries ? toActivityByDay(summaries) : null;
  const ratingsByDay = summaries ? toRatingsByDay(summaries) : null;

  return (
    <div key={vertical ? "compact" : "wide"} className="animate-fade-in">
      <DurationNav
        value={duration}
        onChange={(next) => setSetting("duration", next)}
      />

      {byDay ? (
        <ActivityHeatmapGrid
          vertical={vertical}
          range={range}
          byDay={byDay}
          ratingsByDay={ratingsByDay}
          filters={filters}
          maxN={maxDayTotalInRange(byDay, range, filters)}
        />
      ) : (
        <QueryFallback
          snapshots={[snapshot]}
          skeleton={
            <ActivityHeatmapGrid
              vertical={vertical}
              range={range}
              byDay={null}
              ratingsByDay={null}
              filters={filters}
              maxN={0}
            />
          }
        />
      )}

      <div className="mt-2">
        <ActivityKindFiltersRow
          filters={filters}
          onChange={(kind, checked) =>
            setSetting("filters", { ...filters, [kind]: checked })
          }
        />
      </div>
      <HeatmapLegendRow
        name="Activity"
        compact={vertical}
        onCompactChange={(v) => setSetting("vertical", v)}
      />

      {/* Nothing under a failed read; its note is shown above. */}
      {(byDay || !isQueryFailed(snapshot)) && (
        <div className="mt-6">
          <p className="mb-3 text-xs tracking-wide text-center text-muted-foreground">
            In this period
          </p>
          {byDay && ratingsByDay ? (
            <PeriodSummary
              stats={summarizeActivityInRange(byDay, range, filters)}
              ratings={ratingsInRange(ratingsByDay, range)}
              filters={filters}
            />
          ) : (
            <PeriodSummarySkeleton />
          )}
        </div>
      )}
    </div>
  );
};

export const ActivityCalendarHeatmap = () => (
  <DashboardPanel title="Activity Heatmap" defaultOpen>
    <ActivityCalendarHeatmapBody />
  </DashboardPanel>
);
