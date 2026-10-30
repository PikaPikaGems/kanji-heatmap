import type { ReactNode } from "react";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";

/**
 * The app's small flash message ("Switched to Readings", "You're offline",
 * "Copied to clipboard"): a bordered chip that slides in, holds, slides out
 * and calls `onDone`. Absolutely placed: pass its position in `className`
 * and remount it with a new `key` to replay it.
 */
export const HintChip = ({
  children,
  tone = "info",
  className,
  onDone,
}: {
  children: ReactNode;
  /** "warning" is the bold yellow warning style. */
  tone?: "info" | "warning";
  className?: string;
  onDone: () => void;
}) => (
  <span
    className={cn(
      "pointer-events-none absolute z-20 whitespace-nowrap px-2 py-0.5 text-xs border rounded-md shadow-sm bg-background animate-search-type-hint",
      tone === "warning"
        ? cn("border-amber-500", cnWarningText)
        : "font-semibold border-cyan-500 text-cyan-600 dark:text-cyan-300",
      className
    )}
    role="status"
    aria-live="polite"
    onAnimationEnd={onDone}
  >
    {children}
  </span>
);
