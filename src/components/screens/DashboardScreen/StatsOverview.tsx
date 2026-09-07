import { Cake, CalendarDays } from "lucide-react";
import { formatCakeDay } from "@/lib/activity";
import { useActivityData } from "@/hooks/use-activity-data";
import { formatRawCount } from "@/lib/format-count";
import { SectionHeading } from "./SectionHeading";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { DashboardPanel } from "./DashboardPanel";
import { OverviewCaption } from "./OverviewStat";

export const StatsOverview = () => {
  const {
    allTime,
    daysActive,
    speedKatakanaDays,
    productionDays,
    recognitionDays,
  } = useActivityData();

  return (
    <DashboardPanel>
      <SectionHeading
        title="All-time Overview"
        description="All-time activity since your first recorded session."
      />
      <ActivityCountsGrid
        stats={{
          speedKatakanaDays,
          productionDays,
          recognitionDays,
          speedKatakanaSessions: allTime.speedKatakanaSessions,
          productionRounds: allTime.productionRounds,
          recognitionRounds: allTime.recognitionRounds,
        }}
      />
      <div className="flex flex-col justify-center w-full gap-2 mt-4 sm:flex-row">
        <OverviewCaption
          Icon={CalendarDays}
          label="Days active"
          value={formatRawCount(daysActive)}
        />
        <div className="hidden sm:flex">·</div>
        <OverviewCaption
          Icon={Cake}
          label="Cake day"
          value={allTime.cakeDay ? formatCakeDay(allTime.cakeDay) : "Not yet"}
        />
      </div>
    </DashboardPanel>
  );
};
