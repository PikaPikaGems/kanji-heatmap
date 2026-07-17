import {
  ACTIVITY_KIND_LABELS,
  ActivityByDay,
  ActivityKindFilters,
  dayTotalForFilters,
  formatActivityDay,
  getActivityLevel,
  getDayCounts,
} from "@/lib/activity";
import { freqCategoryCn } from "@/lib/freq/freq-category";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/** Sun→Sat; only Mon / Wed / Fri labeled (Cursor/GitHub-style). */
const DAY_LABELS = ["", "月", "", "水", "", "金", ""] as const;

const CELL_PX = 12;
const GAP_PX = 3;
const EMPTY_CELL =
  "bg-muted/50 border border-border dark:bg-muted/30 dark:border-border";

type CellProps = {
  dateKey: string | null;
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
  maxN: number;
};

const DayDetail = ({
  dateKey,
  byDay,
  filters,
}: {
  dateKey: string;
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
}) => {
  const day = getDayCounts(byDay, dateKey);
  const total = dayTotalForFilters(day, filters);

  return (
    <div className="space-y-1.5 text-xs">
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

const CalendarDayCell = ({ dateKey, byDay, filters, maxN }: CellProps) => {
  if (dateKey == null) {
    return <div aria-hidden style={{ width: CELL_PX, height: CELL_PX }} />;
  }

  const n = dayTotalForFilters(getDayCounts(byDay, dateKey), filters);
  const level = getActivityLevel(n, maxN);
  const fillCn =
    level === 0
      ? EMPTY_CELL
      : cn(
          freqCategoryCn[level],
          "border border-black/10 dark:border-white/10"
        );

  const label = `${formatActivityDay(dateKey)}: ${n} events`;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          style={{ width: CELL_PX, height: CELL_PX }}
          className={cn(
            "rounded-[2px] outline-none",
            "hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 hover:ring-offset-background",
            "focus-visible:ring-2 focus-visible:ring-ring",
            fillCn
          )}
        />
      </HoverCardTrigger>
      <HoverCardContent className="p-3 w-52" side="top">
        <DayDetail dateKey={dateKey} byDay={byDay} filters={filters} />
      </HoverCardContent>
    </HoverCard>
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
  const weekCount = weeks.length;

  return (
    <div className="overflow-x-auto pb-4 px-1 [-webkit-mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] [mask-image:linear-gradient(to_right,transparent,black_8px,black_calc(100%-8px),transparent)] sm:[-webkit-mask-image:none] sm:[mask-image:none]">
      <div
        className="inline-grid"
        style={{
          gridTemplateAreas: `"empty months" "days squares"`,
          gridTemplateColumns: "auto 1fr",
          columnGap: 6,
          rowGap: GAP_PX,
        }}
      >
        {/* Month letters — one column per week, same width as cells */}
        <div
          className="text-[10px] leading-none text-muted-foreground"
          style={{
            gridArea: "months",
            display: "grid",
            gridTemplateColumns: `repeat(${weekCount}, ${CELL_PX}px)`,
            columnGap: GAP_PX,
          }}
        >
          {weeks.map((_, weekIndex) => (
            <div key={weekIndex} className="h-3">
              {labelByWeek.get(weekIndex) ?? ""}
            </div>
          ))}
        </div>

        {/* Weekday letters — same row height as cells so M/W/F align */}
        <div
          className="text-[10px] leading-none text-muted-foreground"
          style={{
            gridArea: "days",
            display: "grid",
            gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
            rowGap: GAP_PX,
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="flex items-center justify-end pr-0.5">
              {label}
            </div>
          ))}
        </div>

        {/* Squares — column flow: Sun→Sat down, then next week */}
        <div
          style={{
            gridArea: "squares",
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: CELL_PX,
            gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
            gap: GAP_PX,
          }}
        >
          {/** TODO: When the grid is "today" */}
          {weeks.map((week, weekIndex) =>
            week.map((dateKey, dayIndex) => (
              <CalendarDayCell
                key={`${weekIndex}-${dayIndex}`}
                dateKey={dateKey}
                byDay={byDay}
                filters={filters}
                maxN={maxN}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
