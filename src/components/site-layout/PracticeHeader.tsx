import { Link } from "@/components/dependent/routing";
import { Progress } from "@/components/ui/progress";
import { HeaderBar } from "@/components/site-layout/Header/HeaderBar";
import assetsPaths from "@/lib/assets-paths";

/**
 * Slim header for practice routes: logo, progress bar, font/color controls, sidebar.
 */
export const PracticeHeader = ({ progress }: { progress: number }) => {
  return (
    <HeaderBar
      className="gap-3 shrink-0"
      drawerErrorDetails="LazyHeaderDrawer in PracticeHeader"
    >
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
    </HeaderBar>
  );
};
