import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BarSegment = { key: string; value: number; cn: string };

/**
 * The app's one multi-segment bar (mastery bands, review ratings, storage):
 * a thin rounded track with a block per segment, sized by its share of
 * `total`. Segments with nothing in them are left out.
 */
export const StackedBar = ({
  segments,
  total,
  className,
  ...props
}: {
  segments: readonly BarSegment[];
  total: number;
} & ComponentProps<"div">) => {
  const safeTotal = Math.max(total, 1);
  return (
    <div
      className={cn(
        "flex w-full h-1 overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {segments.map(({ key, value, cn: fillCn }) =>
        value > 0 ? (
          <div
            key={key}
            className={cn("h-full", fillCn)}
            style={{ width: `${(value / safeTotal) * 100}%` }}
          />
        ) : null
      )}
    </div>
  );
};

/** A small round swatch naming a bar segment in a legend. */
export const LegendDot = ({ className }: { className: string }) => (
  <span
    aria-hidden
    className={cn("inline-block size-2 rounded-full shrink-0", className)}
  />
);
