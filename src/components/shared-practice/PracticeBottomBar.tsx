import { ReactNode } from "react";

/**
 * The fixed bar at the bottom of a practice screen, start and end alike: a
 * rounded dotted top border, then the screen's buttons stacked (main action
 * first) and any notice under them. Put it below a `flex-1 min-h-0
 * overflow-y-auto` body so the content scrolls above it, never behind it.
 */
export const PracticeBottomBar = ({ children }: { children: ReactNode }) => (
  <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
    <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
      {children}
    </div>
  </div>
);
