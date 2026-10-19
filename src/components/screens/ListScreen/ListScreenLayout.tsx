import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error";
import { ControlBarErrorFallback } from "./ControlBar/ControlBarErrorFallback";

/**
 * The fixed control bar over a scrolling tile area, shared by the screens that
 * list kanji (/ and /mastery). Each passes its own `controlBar` and `badge`.
 */
export const ListScreenLayout = ({
  children,
  controlBar,
  badge,
}: {
  children: ReactNode;
  controlBar: ReactNode;
  badge?: ReactNode;
}) => {
  return (
    <>
      {/* top-0: pinned to the viewport's top, not to wherever page flow puts
          it (iOS can recompute that spot on a later layout and nudge the
          bar down). */}
      <div className="fixed-viewport-layer fix-scroll-layout-shift-right fixed top-0 w-full pt-12 pb-2 z-40 bg-background">
        <section className="mx-auto max-w-screen-xl flex border-0 space-x-1 sticky pt-1 pl-2 pr-1 w-full ">
          <ErrorBoundary fallback={<ControlBarErrorFallback />}>
            {controlBar}
            {badge}
          </ErrorBoundary>
        </section>
      </div>
      <div className="relative pt-24 -z-0 flex flex-wrap items-center justify-center overflow-x-hidden">
        {children}
      </div>
    </>
  );
};
