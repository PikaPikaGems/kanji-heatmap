import {
  ACTIVITY_KIND_LABELS,
  ActivityByDay,
  ActivityKindFilters,
  dayTotalForFilters,
  formatActivityDay,
  getActivityLevel,
  getDayCounts,
  toLocalDateKey,
} from "@/lib/activity";
import { HeatmapCell, HeatmapGrid } from "./HeatmapGrid";
import { heatmapFillCn } from "./heatmap-fill";

/** Sun→Sat; only Mon / Wed / Fri labeled (Cursor/GitHub-style). */
const DAY_LABELS = ["", "月", "", "水", "", "金", ""] as const;

const CELL_PX = 12;

type CellProps = {
  dateKey: string | null;
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
  maxN: number;
  todayKey: string;
};

const DayDetail = ({
  dateKey,
  byDay,
  filters,
  isToday,
}: {
  dateKey: string;
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
  isToday: boolean;
}) => {
  const day = getDayCounts(byDay, dateKey);
  const total = dayTotalForFilters(day, filters);

  return (
    <div className="space-y-1.5 text-xs">
      {isToday ? <div className="font-extrabold">Today</div> : null}
      <div className="font-extrabold">{formatActivityDay(dateKey)}</div>
      <div className="text-muted-foreground">
        {total === 0
          ? "No activity"
          : `${total} event${total === 1 ? "" : "s"}`}
      </div>
      {(["speedKatakana", "production", "recognition"] as const).map((kind) =>
        filters[kind] ? (
          <div key={kind} className="flex justify-between gap-4">
            <span>{ACTIVITY_KIND_LABELS[kind]}</span>
            <span className="font-bold tabular-nums">{day[kind]}</span>
          </div>
        ) : null
      )}
    </div>
  );
};

const CalendarDayCell = ({
  dateKey,
  byDay,
  filters,
  maxN,
  todayKey,
}: CellProps) => {
  if (dateKey == null) {
    return <div aria-hidden style={{ width: CELL_PX, height: CELL_PX }} />;
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
  filters,
  maxN,
}: {
  weeks: (string | null)[][];
  monthLabels: { weekIndex: number; label: string }[];
  byDay: ActivityByDay;
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
            filters={filters}
            maxN={maxN}
            todayKey={todayKey}
          />
        ))
      )}
    </HeatmapGrid>
  );
};
