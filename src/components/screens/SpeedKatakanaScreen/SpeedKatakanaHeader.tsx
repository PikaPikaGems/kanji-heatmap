import { Link } from "@/components/dependent/routing";
import { ErrorBoundary } from "@/components/error";
import { Progress } from "@/components/ui/progress";
import HeaderDrawer from "@/components/site-layout/Header/HeaderDrawer";
import assetsPaths from "@/lib/assets-paths";

/**
 * Slim header for the Speed Katakana pages: logo (links home, no title), a
 * progress bar for the current challenge, and the sidebar hamburger. No
 * font/color controls, unlike the global <Header />.
 */
export const SpeedKatakanaHeader = ({ progress }: { progress: number }) => {
  return (
    <header className="fixed top-0 left-0 z-50 flex items-center justify-between w-full gap-3 px-2 border-b-4 border-dashed fix-scroll-layout-shift-right bg-background backdrop-blur-sm">
      <Link
        to="/"
        className="flex items-center py-1.5 shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Kanji Heatmap home"
      >
        <img
          src={assetsPaths.ICON_SVG}
          alt="Kanji Heatmap icon"
          className="h-7 w-7"
        />
      </Link>

      <Progress value={progress} className="flex-1 h-2" />
      <span className="text-xs font-semibold tabular-nums w-9 text-right shrink-0">
        {Math.round(progress)}%
      </span>

      <section className="flex items-center pr-1 shrink-0">
        <ErrorBoundary fallback={null}>
          <HeaderDrawer />
        </ErrorBoundary>
      </section>
    </header>
  );
};
