import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { ScreenShell } from "@/components/common/ScreenShell";
import { DashboardAccountBanner } from "./DashboardAccountBanner";
import { StatsOverview } from "./StatsOverview";
import { ActivityCalendarHeatmap } from "./ActivityCalendarHeatmap";
import { SpeedKatakanaHeatmap } from "./SpeedKatakanaHeatmap";
import { FillTheKanjiHeatmap } from "./FillTheKanjiHeatmap";
import { BookmarksBreakdown } from "./BookmarksBreakdown";
import { KanjiMastery } from "./KanjiMastery";
import { HeatmapPopoverProvider } from "./HeatmapGrid";

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
      </header>

      <DashboardAccountBanner />

      <HeatmapPopoverProvider>
        <StatsOverview />
        <ActivityCalendarHeatmap />
        <KanjiMastery />
        <FillTheKanjiHeatmap />
        <SpeedKatakanaHeatmap />
      </HeatmapPopoverProvider>
      <BookmarksBreakdown />
    </ScreenShell>
  );
};

export default DashboardScreen;
