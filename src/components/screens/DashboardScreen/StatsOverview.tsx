import { Cake } from "lucide-react";
import { formatCakeDay } from "@/lib/activity";
import { useActivityData } from "@/hooks/use-activity-data";
import { SectionHeading } from "./SectionHeading";
import { ActivityCountsGrid } from "./ActivityCountsGrid";
import { DashboardPanel } from "./DashboardPanel";

export const StatsOverview = () => {
  const { allTime, daysActive } = useActivityData();

  return (
    <DashboardPanel>
      <SectionHeading
        title="Activity Overview"
        description="All-time activity since your first recorded session."
      />
      <ActivityCountsGrid
        stats={{
          daysActive,
          speedKatakanaSessions: allTime.speedKatakanaSessions,
          productionRounds: allTime.productionRounds,
          recognitionRounds: allTime.recognitionRounds,
        }}
      />
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
        <Cake className="size-4 shrink-0" aria-hidden />
        <span>
          Cake day:{" "}
          <span className="font-bold text-foreground">
            {allTime.cakeDay ? formatCakeDay(allTime.cakeDay) : "Not yet"}
          </span>
        </span>
      </div>
    </DashboardPanel>
  );
};
