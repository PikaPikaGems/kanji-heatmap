import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { BottomBar } from "@/components/common/BottomBar";
import { StatsOverview } from "./StatsOverview";
import { ActivityCalendarHeatmap } from "./ActivityCalendarHeatmap";
import { SpeedKatakanaBreakdown } from "./SpeedKatakanaBreakdown";
import { BookmarksBreakdown } from "./BookmarksBreakdown";

const showTitle = false;
const DashboardScreen = () => {
  useHtmlDocumentTitle("Dashboard");

  return (
    <div className="flex flex-col w-full max-w-4xl gap-6 px-1 py-5 mx-auto sm:gap-8 sm:px-3 sm:py-8">
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
      <BookmarksBreakdown />
      <SpeedKatakanaBreakdown />
      <div className="pt-4 mt-4 border-t-2 border-dotted">
        <BottomBar />
      </div>
    </div>
  );
};

export default DashboardScreen;
