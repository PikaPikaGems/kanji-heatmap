import {
  ActivityByDay,
  ActivityKindFilters,
  monthLabelsForWeeks,
  toLocalDateKey,
  VERTICAL_MONTH_HALF_ROWS,
} from "@/lib/activity";
import { HeatmapGrid } from "./HeatmapGrid";
import { CalendarDayCell } from "./CalendarGrid";

/**
 * Compact calendar: 2 columns per month, 16 rows (days 1–16 / 17–32).
 * No left gutter — HeatmapGrid shares one label per row across all columns,
 * but those two halves are different days of the month.
 */
export const VerticalCalendarGrid = ({
  columns,
  byDay,
  filters,
  maxN,
}: {
  columns: (string | null)[][];
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
  maxN: number;
}) => {
  const monthLabels = monthLabelsForWeeks(columns, "japanese-numbers");
  const labelByCol = new Map(monthLabels.map((m) => [m.weekIndex, m.label]));
  const todayKey = toLocalDateKey();

  return (
    <HeatmapGrid
      cellPx={12}
      rowCount={VERTICAL_MONTH_HALF_ROWS}
      topLabels={columns.map((_, colIndex) => labelByCol.get(colIndex) ?? "")}
    >
      {columns.map((col, colIndex) =>
        col.map((dateKey, dayIndex) => (
          <CalendarDayCell
            key={`${colIndex}-${dayIndex}`}
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
