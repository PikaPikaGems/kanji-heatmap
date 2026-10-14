import { CalendarDays } from "lucide-react";
import {
  ActivityByDay,
  ActivityKindFilters,
  buildCalendarWeeks,
  buildMonthHalfColumns,
  DateRange,
  getDurationRange,
  maxDayTotalInRange,
  monthLabelsForWeeks,
  summarizeActivityInRange,
} from "@/lib/activity";
import { useActivityData } from "@/hooks/use-activity-data";
import { useActivityHeatmapSettings } from "@/hooks/use-activity-heatmap-settings";
import { HeatmapLegendRow } from "./HeatmapLegendRow";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { ActivityKindFiltersRow } from "./ActivityKindFiltersRow";
import { DurationNav } from "./DurationNav";
import { CalendarGrid } from "./CalendarGrid";
import { VerticalCalendarGrid } from "./VerticalCalendarGrid";
import { DashboardPanel } from "./DashboardPanel";
import { OverviewCaption } from "./ActivityStatCard";
import { formatRawCount } from "@/lib/format-count";

const ActivityHeatmapGrid = ({
  vertical,
  range,
  byDay,
  filters,
  maxN,
}: {
  vertical: boolean;
  range: DateRange;
  byDay: ActivityByDay;
  filters: ActivityKindFilters;
  maxN: number;
}) => {
  if (vertical) {
    return (
      <VerticalCalendarGrid
        columns={buildMonthHalfColumns(range)}
        byDay={byDay}
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
      filters={filters}
      maxN={maxN}
    />
  );
};

export const ActivityCalendarHeatmap = () => {
  const { byDay } = useActivityData();
  const [{ duration, filters, vertical }, setSetting] =
    useActivityHeatmapSettings();

  const range = getDurationRange(duration);
  const maxN = maxDayTotalInRange(byDay, range, filters);
  const windowed = summarizeActivityInRange(byDay, range, filters);

  return (
    <DashboardPanel title="Activity Heatmap" defaultOpen>
      <div key={vertical ? "compact" : "wide"} className="animate-fade-in">
        <DurationNav
          value={duration}
          onChange={(next) => setSetting("duration", next)}
        />

        <ActivityHeatmapGrid
          vertical={vertical}
          range={range}
          byDay={byDay}
          filters={filters}
          maxN={maxN}
        />

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

        <div className="mt-6">
          <p className="mb-3 text-xs tracking-wide text-center text-muted-foreground">
            In this period
          </p>
          <ActivityCountsGrid stats={windowed} />
          <div className="mt-4">
            <OverviewCaption
              Icon={CalendarDays}
              label="Days active"
              value={formatRawCount(windowed.daysActive)}
            />
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
};
