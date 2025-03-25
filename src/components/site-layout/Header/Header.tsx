import ChangeFontButton from "@/components/dependent/site-wide/ChangeFontButton";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { ErrorBoundary } from "@/components/error";
import { GlobalHomeHeaderLink } from "@/components/dependent/routing";
import { ReactNode } from "react";
import HeaderIcons from "./HeaderIcons";

const HeaderLayout = ({
  title,
  side,
  main,
}: {
  title: ReactNode;
  side?: ReactNode;
  main?: ReactNode;
}) => {
  return (
    <header className="sticky flex w-full items-center justify-between border-b border-dotted px-1 top-0 right-0 left bottom-0-0 z-50 bg-white dark:bg-black backdrop-blur-sm">
      <section className="flex items-center space-x-1">
        {title}
        {main && <div className="flex space-x-1">{main}</div>}
      </section>
      {side && <section className="flex space-x-1 my-1">{side}</section>}
    </header>
  );
};

const Header = ({ nav }: { nav: ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={
        <HeaderLayout
          title={
            <h1 className="text-left font-bold text-xl px-1 m-0 p-0">
              Kanji Heatmap
            </h1>
          }
        />
      }
    >
      <HeaderLayout
        title={
          <h1 className="hidden sm:flex font-bold text-xl px-1">
            <GlobalHomeHeaderLink />
          </h1>
        }
        side={<HeaderIcons />}
        main={
          <>
            <ErrorBoundary
              fallback={
                <div className="flex space-x-1 my-1 mx-1">
                  <LinksOutItems />
                </div>
              }
            >
              {nav}
              <ChangeFontButton />
            </ErrorBoundary>
          </>
        }
      />
    </ErrorBoundary>
  );
};

export default Header;
