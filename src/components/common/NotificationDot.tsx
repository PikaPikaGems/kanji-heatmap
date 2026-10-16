import { cn } from "@/lib/utils";

/**
 * Small pulsing "something is waiting" dot in the site's theme color. Flows
 * inline by default (put it after the text it belongs to); `corner` pins it
 * to the top-right of a `relative` parent, e.g. the hamburger button.
 */
export const NotificationDot = ({
  corner,
  className,
}: {
  corner?: boolean;
  className?: string;
}) => (
  <span
    className={cn(
      "block size-2.5 shrink-0 animate-pulse rounded-full background-theme-color-with-opacity-100 shadow-[0_0_6px_2px_rgba(var(--theme-color-selected),0.7)]",
      corner && "absolute -top-1 -right-1 ring-2 ring-background",
      className
    )}
  >
    <span className="sr-only">Reviews due</span>
  </span>
);
