import { cn } from "@/lib/utils";

/**
 * Small "something is waiting" dot. Absolutely positioned: the parent must be
 * `relative`; pass `className` to move it off the default top-right corner.
 */
export const NotificationDot = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "absolute top-1 right-1 block size-2.5 rounded-full bg-rose-500 ring-2 ring-background",
      className
    )}
  >
    <span className="sr-only">Reviews due</span>
  </span>
);
