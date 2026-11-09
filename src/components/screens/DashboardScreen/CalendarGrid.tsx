import {
  ACTIVITY_KIND_LABELS,
  ALL_ACTIVITY_KINDS,
  ActivityByDay,
  ActivityKindFilters,
  dayTotalForFilters,
  formatActivityDay,
  getActivityLevel,
  getDayCounts,
  addRatings,
  EMPTY_DAY_RATINGS,
  type RatingsByDay,
  toLocalDateKey,
  totalRatings,
} from "@/lib/activity";
import { RatingsBar, RatingsLine } from "./ReviewRatings";
import { HeatmapCell, HeatmapGrid } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";

/** Sun→Sat; only Mon / Wed / Fri labeled (Cursor/GitHub-style). */
const DAY_LABELS = ["", "月", "", "水", "", "金", ""] as const;

const CELL_PX = 12;

type CellProps = {
  dateKey: string | null;
  /** null while the activity is still loading: pulsing placeholder squares. */
  byDay: ActivityByDay | null;
  ratingsByDay: RatingsByDay | null;
  filters: ActivityKindFilters;
  maxN: number;
  todayKey: string;
};

const DayDetail = ({
  dateKey,
  byDay,
  ratingsByDay,
  filters,
  isToday,
}: {
  dateKey: string;
  byDay: ActivityByDay;
  ratingsByDay: RatingsByDay;
  filters: ActivityKindFilters;
  isToday: boolean;
}) => {
  const day = getDayCounts(byDay, dateKey);
  const total = dayTotalForFilters(day, filters);
  // The day's review ratings, for the mastery kinds the filters show.
  const dayRatings = ratingsByDay[dateKey] ?? EMPTY_DAY_RATINGS;
  const ratings = addRatings(
    addRatings(
      filters.readingMastery ? dayRatings.reading : {},
      filters.readingMastery2 ? dayRatings.secondaryReading : {}
    ),
    filters.writingMastery ? dayRatings.writing : {}
  );

  return (
    <div className="space-y-1.5 text-xs">
      {isToday ? <div className="font-extrabold">Today</div> : null}
      <div className="font-extrabold">{formatActivityDay(dateKey)}</div>
      <div className="text-muted-foreground">
        {total === 0
          ? "No activity"
          : `${total} event${total === 1 ? "" : "s"}`}
      </div>
      {ALL_ACTIVITY_KINDS.map((kind) =>
        filters[kind] ? (
          <div key={kind} className="flex justify-between gap-4">
            <span>{ACTIVITY_KIND_LABELS[kind]}</span>
            <span className="font-bold tabular-nums">{day[kind] ?? 0}</span>
          </div>
        ) : null
      )}
      {totalRatings(ratings) > 0 && (
        <div className="pt-1.5 space-y-1 border-t border-dotted">
          <RatingsBar ratings={ratings} />
          <RatingsLine ratings={ratings} />
        </div>
      )}
    </div>
  );
};

export const CalendarDayCell = ({
  dateKey,
  byDay,
  ratingsByDay,
  filters,
  maxN,
  todayKey,
}: CellProps) => {
  if (dateKey == null) {
    return <div aria-hidden style={{ width: CELL_PX, height: CELL_PX }} />;
  }
  if (byDay == null || ratingsByDay == null) {
    return (
      <div
        aria-hidden
        className="rounded-[2px] bg-muted animate-pulse"
        style={{ width: CELL_PX, height: CELL_PX }}
      />
    );
  }

  const isToday = dateKey === todayKey;
  const n = dayTotalForFilters(getDayCounts(byDay, dateKey), filters);
  const level = getActivityLevel(n, maxN);

  const label = isToday
    ? `Today, ${formatActivityDay(dateKey)}: ${n} events`
    : `${formatActivityDay(dateKey)}: ${n} events`;

  return (
    <HeatmapCell
      cellPx={CELL_PX}
      fillCn={heatmapFillCn(level, isToday)}
      label={label}
      detail={
        <DayDetail
          dateKey={dateKey}
          byDay={byDay}
          ratingsByDay={ratingsByDay}
          filters={filters}
          isToday={isToday}
        />
      }
    />
  );
};

/**
 * Fixed-size contribution grid (GitHub/Cursor-style).
 * Cells never shrink; narrow viewports get overflow-x scroll.
 */
export const CalendarGrid = ({
  weeks,
  monthLabels,
  byDay,
  ratingsByDay,
  filters,
  maxN,
}: {
  weeks: (string | null)[][];
  monthLabels: { weekIndex: number; label: string }[];
  byDay: ActivityByDay | null;
  ratingsByDay: RatingsByDay | null;
  filters: ActivityKindFilters;
  maxN: number;
}) => {
  const labelByWeek = new Map(monthLabels.map((m) => [m.weekIndex, m.label]));
  const todayKey = toLocalDateKey();

  return (
    <HeatmapGrid
      cellPx={CELL_PX}
      rowCount={7}
      topLabels={weeks.map((_, weekIndex) => labelByWeek.get(weekIndex) ?? "")}
      leftLabels={[...DAY_LABELS]}
    >
      {weeks.map((week, weekIndex) =>
        week.map((dateKey, dayIndex) => (
          <CalendarDayCell
            key={`${weekIndex}-${dayIndex}`}
            dateKey={dateKey}
            byDay={byDay}
            ratingsByDay={ratingsByDay}
            filters={filters}
            maxN={maxN}
            todayKey={todayKey}
          />
        ))
      )}
    </HeatmapGrid>
  );
};
