import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { ScreenShell } from "@/components/common/ScreenShell";
import { isEngineAbsent } from "@/lib/engine/account-ui";
import {
  ENGINE_FAILED_COPY,
  NOT_IN_BUILD_COPY,
} from "@/lib/engine/engine-copy";
import { useAccountStatus } from "@/lib/engine/use-account-status";
import { DashboardAccountBanner } from "./DashboardAccountBanner";
import { StatsOverview } from "./StatsOverview";
import { ActivityCalendarHeatmap } from "./ActivityCalendarHeatmap";
import { SpeedKatakanaHeatmap } from "./SpeedKatakanaHeatmap";
import { FillTheKanjiHeatmap } from "./FillTheKanjiHeatmap";
import { BookmarksBreakdown } from "./BookmarksBreakdown";
import { KanjiMastery } from "./KanjiMastery";
import { HeatmapPopoverProvider } from "./HeatmapGrid";
import { PanelNotice } from "./PanelNotice";

const showTitle = false;
const DashboardScreen = () => {
  useHtmlDocumentTitle("Dashboard");
  const account = useAccountStatus();

  // Every panel reads the account. With no engine there is nothing to show;
  // with no account (logged out, old browser) the panels draw empty data.
  if (account.kind === "unavailable" && isEngineAbsent(account.reason)) {
    return (
      <ScreenShell>
        <PanelNotice>
          {account.reason === "not-included"
            ? NOT_IN_BUILD_COPY
            : ENGINE_FAILED_COPY}
        </PanelNotice>
      </ScreenShell>
    );
  }

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
