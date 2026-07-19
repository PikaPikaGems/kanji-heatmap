import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { ScreenShell } from "@/components/common/ScreenShell";
import { StatsOverview } from "./StatsOverview";
import { ActivityCalendarHeatmap } from "./ActivityCalendarHeatmap";
import { SpeedKatakanaHeatmap } from "./SpeedKatakanaHeatmap";
import { BookmarksBreakdown } from "./BookmarksBreakdown";

const showTitle = false;
const DashboardScreen = () => {
  useHtmlDocumentTitle("Dashboard");

  return (
    <ScreenShell>
      <header className="text-center">
        {showTitle && (
          <h1 className="text-3xl font-extrabold tracking-tight">
            Your Progress
          </h1>
        )}
        <p className="mx-auto mt-2 text-sm text-muted-foreground">
          ⚠️ Saved only on this device. No backup. Your data may be lost at any
          time.
        </p>
      </header>

      <StatsOverview />
      <ActivityCalendarHeatmap />
      <SpeedKatakanaHeatmap />
      <BookmarksBreakdown />
    </ScreenShell>
  );
};

export default DashboardScreen;
