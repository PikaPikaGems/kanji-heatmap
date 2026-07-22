import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { LocalStorageWarning } from "@/components/common/LocalStorageWarning";
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
        <LocalStorageWarning className="mt-2 text-sm" />
      </header>

      <StatsOverview />
      <ActivityCalendarHeatmap />
      <SpeedKatakanaHeatmap />
      <BookmarksBreakdown />
    </ScreenShell>
  );
};

export default DashboardScreen;
