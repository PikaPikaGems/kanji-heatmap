import { cn } from "@/lib/utils";

/**
 * Small pulsing yellow "something is waiting" dot. Flows inline (put it after
 * the text it belongs to); position it through `className` where needed.
 */
export const NotificationDot = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "block size-2 shrink-0 animate-pulse rounded-full bg-yellow-500 dark:bg-yellow-400",
      className
    )}
  >
    <span className="sr-only">Reviews due</span>
  </span>
);
