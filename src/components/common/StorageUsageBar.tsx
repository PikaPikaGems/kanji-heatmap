import type { ReactNode } from "react";
import { STORAGE_WARNING_RATIO } from "@/lib/ai-explain/storage-budgets";
import { formatMegabytes } from "@/lib/format-bytes";
import { cn } from "@/lib/utils";
import { LegendDot, StackedBar } from "./StackedBar";

/**
 * Storage against its limit as one stacked bar: the current user's share,
 * then everyone else's on this device (lighter), then free space. Amber near
 * the limit, red at it. Without `others`, it's a plain bar with no legend.
 */
export const StorageUsageBar = ({
  label,
  mine,
  others,
  limit,
  note,
}: {
  label: ReactNode;
  mine: number;
  others?: number;
  limit: number;
  note?: ReactNode;
}) => {
  const total = mine + (others ?? 0);
  const ratio = total / limit;
  const color =
    ratio >= 0.95
      ? "bg-destructive"
      : ratio >= STORAGE_WARNING_RATIO
        ? "bg-amber-500"
        : "bg-primary";
  return (
    <div className="space-y-1 text-left">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted-foreground">
          {formatMegabytes(total)} of {formatMegabytes(limit)}
        </span>
      </div>
      <StackedBar
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={total}
        aria-label={`${formatMegabytes(total)} of ${formatMegabytes(limit)} used`}
        total={limit}
        segments={[
          { key: "mine", value: mine, cn: color },
          { key: "others", value: others ?? 0, cn: cn("opacity-40", color) },
        ]}
      />
      {others != null && (
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <LegendDot className={color} />
            You {formatMegabytes(mine)}
          </span>
          <span className="inline-flex items-center gap-1">
            <LegendDot className={cn("opacity-40", color)} />
            Others on this device {formatMegabytes(others)}
          </span>
        </div>
      )}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
};
