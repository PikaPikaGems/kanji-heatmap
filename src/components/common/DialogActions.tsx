import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The button row at the bottom of every dialog, so they all line up the same
 * way: right-aligned with the main action last (rightmost) on wider screens,
 * stacked full width with the main action on top on phones. Put
 * PracticeButtons in it, main action last.
 */
export const DialogActions = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto",
      className
    )}
  >
    {children}
  </div>
);
