import { Link } from "@/components/dependent/routing";
import { ErrorBoundary } from "@/components/error";
import { Progress } from "@/components/ui/progress";
import ChangeFontButton from "@/components/dependent/site-wide/ChangeFontButton";
import { ChangeThemeColorBtn } from "@/components/dependent/site-wide/ChangeThemeColorBtn";
import HeaderDrawer from "@/components/site-layout/Header/HeaderDrawer";
import assetsPaths from "@/lib/assets-paths";

/**
 * Slim header for practice routes: logo, progress bar, font/color controls, sidebar.
 */
export const PracticeHeader = ({ progress }: { progress: number }) => {
  return (
    <header className="flex items-center justify-between w-full gap-3 px-2 border-b-4 border-dashed shrink-0 fix-scroll-layout-shift-right bg-background">
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

      <Progress
        value={progress}
        className="flex-1 h-2"
        primitiveCn="background-theme-color-with-opacity-100"
      />

      <section className="flex items-center pr-1 space-x-1 shrink-0">
        <ErrorBoundary fallback={null}>
          <ChangeFontButton />
          <ChangeThemeColorBtn />
          <HeaderDrawer />
        </ErrorBoundary>
      </section>
    </header>
  );
};
