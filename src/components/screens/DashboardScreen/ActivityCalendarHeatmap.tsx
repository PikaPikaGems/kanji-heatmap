import { useId } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "./SectionHeading";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { ActivityKindFiltersRow } from "./ActivityKindFiltersRow";
import { DurationNav } from "./DurationNav";
import { CalendarGrid } from "./CalendarGrid";
import { VerticalCalendarGrid } from "./VerticalCalendarGrid";
import { DashboardPanel } from "./DashboardPanel";
import { GradientLegend } from "@/components/common/GradientLegend";

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
  const layoutSwitchId = useId();

  const range = getDurationRange(duration);
  const maxN = maxDayTotalInRange(byDay, range, filters);
  const windowed = summarizeActivityInRange(byDay, range, filters);

  return (
    <DashboardPanel>
      <SectionHeading
        title="Activity Heatmap"
        description="Daily practice events. Brighter days mean more activity relative to your busiest day in this range."
      />

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
      <div className="flex items-center justify-center w-full mt-4">
        <div>
          <GradientLegend />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
        <Label
          htmlFor={layoutSwitchId}
          className={!vertical ? "text-foreground font-semibold" : undefined}
        >
          Wide
        </Label>
        <Switch
          id={layoutSwitchId}
          checked={vertical}
          onCheckedChange={(checked) => setSetting("vertical", checked)}
          aria-label="Toggle compact activity heatmap"
        />
        <Label
          htmlFor={layoutSwitchId}
          className={vertical ? "text-foreground font-semibold" : undefined}
        >
          Compact
        </Label>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs tracking-wide text-center text-muted-foreground">
          In this period
        </p>
        <ActivityCountsGrid stats={windowed} />
      </div>
    </DashboardPanel>
  );
};
