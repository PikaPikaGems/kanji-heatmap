import { ReactNode } from "react";
import { PracticeHeader } from "@/components/site-layout/PracticeHeader";

/**
 * Full-screen practice layout.
 * No scrollbar-padding compensation — opening the kanji drawer must not
 * shift content horizontally (same approach as recognition-practice).
 */
export const PracticeShell = ({
  progress,
  playing,
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
    <main
      className={`flex-1 min-h-0 overflow-hidden ${
        playing ? "pt-0 pb-2" : "py-2"
      }`}
    >
      {children}
    </main>
  </div>
);
