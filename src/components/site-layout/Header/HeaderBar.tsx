import { Suspense, type ReactNode } from "react";
import ChangeFontButton from "@/components/dependent/site-wide/ChangeFontButton";
import { ChangeThemeColorBtn } from "@/components/dependent/site-wide/ChangeThemeColorBtn";
import { ErrorBoundary } from "@/components/error";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { cn } from "@/lib/utils";
import LazyHeaderDrawer, {
  HeaderDrawerLoadingFallback,
} from "./LazyHeaderDrawer";

type HeaderBarProps = {
  children: ReactNode;
  className?: string;
  drawerErrorDetails?: string;
};

/**
 * Shared header chrome: children on the left/middle, font/theme/drawer actions on the right.
 */
export const HeaderBar = ({
  children,
  className,
  drawerErrorDetails = "LazyHeaderDrawer in HeaderBar",
}: HeaderBarProps) => {
  return (
    <header
      className={cn(
        "flex items-center justify-between w-full px-2 border-b-4 border-dashed fix-scroll-layout-shift-right bg-background",
        className
      )}
    >
      {children}
      <section className="flex items-center pr-1 space-x-1 shrink-0">
        <ErrorBoundary fallback={null}>
          <ChangeFontButton />
          <ChangeThemeColorBtn />
          <ErrorBoundary
            details={drawerErrorDetails}
            fallback={<RefreshPageBtn />}
          >
            <Suspense fallback={<HeaderDrawerLoadingFallback />}>
              <LazyHeaderDrawer />
            </Suspense>
          </ErrorBoundary>
        </ErrorBoundary>
      </section>
    </header>
  );
};
