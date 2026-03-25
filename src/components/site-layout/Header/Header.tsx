import ChangeFontButton from "@/components/dependent/site-wide/ChangeFontButton";
import { ChangeThemeColorBtn } from "@/components/dependent/site-wide/ChangeThemeColorBtn";
import { ErrorBoundary } from "@/components/error";
import HeaderDrawer from "./HeaderDrawer";
import { HeaderTitle } from "./HeaderTitle";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 z-50 flex items-center justify-between w-full px-2 border-b-4 border-dashed fix-scroll-layout-shift-right bg-background backdrop-blur-sm">

      <HeaderTitle />
      <section className="flex items-center pr-1 space-x-1">
        <ErrorBoundary fallback={null}>
          <ChangeFontButton />
          <ChangeThemeColorBtn />
          <HeaderDrawer />
        </ErrorBoundary>
      </section>
    </header>
  );
};

export default Header;
