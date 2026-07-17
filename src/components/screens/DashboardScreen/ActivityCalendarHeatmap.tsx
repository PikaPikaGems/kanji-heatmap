import { useState } from "react";
import {
  ActivityKind,
  ActivityKindFilters,
  buildCalendarWeeks,
  DEFAULT_KIND_FILTERS,
  DurationOption,
  getDurationRange,
  maxDayTotalInRange,
  monthLabelsForWeeks,
  summarizeActivityInRange,
} from "@/lib/activity";
import { useActivityData } from "@/hooks/use-activity-data";
import { SectionHeading } from "./SectionHeading";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { ActivityKindFiltersRow } from "./ActivityKindFiltersRow";
import { DurationNav } from "./DurationNav";
import { CalendarGrid } from "./CalendarGrid";
import { DashboardPanel } from "./DashboardPanel";
import { FreqGradient } from "@/components/common/freq/FreqGradient";

export const ActivityCalendarHeatmap = () => {
  const { byDay } = useActivityData();
  const [duration, setDuration] = useState<DurationOption>({ type: "last365" });
  const [filters, setFilters] =
    useState<ActivityKindFilters>(DEFAULT_KIND_FILTERS);

  const range = getDurationRange(duration);
  const weeks = buildCalendarWeeks(range);
  const monthLabels = monthLabelsForWeeks(weeks);
  const maxN = maxDayTotalInRange(byDay, range, filters);
  const windowed = summarizeActivityInRange(byDay, range, filters);

  const setKind = (kind: ActivityKind, checked: boolean) => {
    setFilters((prev) => ({ ...prev, [kind]: checked }));
  };

  return (
    <DashboardPanel>
      <SectionHeading
        title="Activity Heatmap"
        description="Daily practice events. Brighter days mean more activity relative to your busiest day in this range."
      />

      <div className="mb-4">
        <DurationNav value={duration} onChange={setDuration} />
      </div>

      <CalendarGrid
        weeks={weeks}
        monthLabels={monthLabels}
        byDay={byDay}
        filters={filters}
        maxN={maxN}
      />

      <div className="my-5">
        <ActivityKindFiltersRow filters={filters} onChange={setKind} />
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs tracking-wide text-center text-muted-foreground">
          In this period
        </p>
        <ActivityCountsGrid stats={windowed} />
      </div>
      <div className="flex items-center justify-center w-full mt-6">
        <div>
          <FreqGradient />
        </div>
      </div>
    </DashboardPanel>
  );
};
