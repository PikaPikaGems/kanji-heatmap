import { ReactNode } from "react";
import { PracticeHeader } from "@/components/site-layout/PracticeHeader";

/**
 * Full-screen practice layout.
 *
 * The body always reserves a scrollbar (`overflow-y: scroll` in index.css).
 * Opening a select, popover or drawer locks scroll, which removes it, so this
 * fixed shell grows by the scrollbar width and centered content jumps
 * sideways. `fix-scroll-layout-shift-right` on <main> pads the removed width
 * back (the header already has it), and is 0 when nothing is locked.
 */
export const PracticeShell = ({
  progress,
  children,
  height,
}: {
  progress: number;
  playing?: boolean;
  children: ReactNode;
  /** When set (e.g. visualViewport height for keyboard-safe recognition). */
  height?: number;
}) => (
  <div
    className={
      height != null
        ? "fixed inset-x-0 top-0 flex flex-col overflow-hidden bg-background"
        : "fixed inset-x-0 top-0 bottom-0 flex flex-col overflow-hidden bg-background"
    }
    style={height != null ? { height } : undefined}
  >
    <PracticeHeader progress={progress} />
    <main className="flex-1 min-h-0 overflow-hidden fix-scroll-layout-shift-right">
      {children}
    </main>
  </div>
);
