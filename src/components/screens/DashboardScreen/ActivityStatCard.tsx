import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatCompactCount, formatRawCount } from "@/lib/format-count";

const StatValue = ({
  display,
  raw,
  abbreviated,
  className,
}: {
  display: string;
  raw: string;
  abbreviated: boolean;
  className?: string;
}) => {
  const valueClassName = cn(
    "text-lg font-extrabold leading-none tabular-nums",
    className
  );

  if (!abbreviated) {
    return <div className={valueClassName}>{display}</div>;
  }

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            valueClassName,
            "cursor-help rounded-sm outline-none",
            "underline decoration-dotted decoration-foreground/30 underline-offset-2",
            "hover:decoration-foreground/60",
            "focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={`${raw} (${display})`}
        >
          {display}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="w-auto px-3 py-1.5 text-sm font-extrabold tabular-nums"
      >
        {raw}
      </HoverCardContent>
    </HoverCard>
  );
};

export const OverviewCaption = ({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
    <Icon className="size-4 shrink-0" aria-hidden />
    <span>
      {label}: <span className="font-bold text-foreground">{value}</span>
    </span>
  </div>
);

export type StatCount = {
  value: number;
  /** e.g. "Days", "Rounds", "Batches", "Sessions". */
  unit: string;
  /** Shown when the value is exactly 1, e.g. "Day", "Batch". */
  unitSingular: string;
};

/** One count: the number, then its unit. The primary count stands out. */
const StatCountItem = ({
  value,
  unit,
  unitSingular,
  primary,
}: StatCount & { primary: boolean }) => (
  <div className="flex items-baseline gap-1.5 min-w-0">
    <StatValue
      display={formatCompactCount(value)}
      raw={formatRawCount(value)}
      abbreviated={value >= 1000}
      className={
        primary
          ? "text-[1.75rem] text-foreground"
          : "text-lg font-semibold text-foreground/60"
      }
    />
    <span
      className={cn(
        "font-bold uppercase tracking-wider text-muted-foreground",
        primary ? "text-xs" : "text-[10px]"
      )}
    >
      {value === 1 ? unitSingular : unit}
    </span>
  </div>
);

/** One activity's counts (days, rounds…) under its icon and name. */
export const ActivityStatCard = ({
  title,
  Icon,
  counts,
}: {
  /** Activity name, e.g. "Speed Katakana". */
  title: string;
  Icon: LucideIcon;
  /**
   * The first count (e.g. days) is the most prominent; when it is 0 the
   * whole card is dimmed.
   */
  counts: StatCount[];
}) => (
  <div
    className={cn(
      "flex flex-col w-full min-w-0 gap-2 px-2.5 py-2 text-left border rounded-xl border-foreground/5 bg-muted/10 sm:px-3 sm:py-2.5",
      counts[0]?.value === 0 && "opacity-40"
    )}
  >
    <div className="flex items-center min-w-0 gap-2">
      <div className="flex items-center justify-center border rounded-lg size-7 shrink-0 border-foreground/10 bg-background text-foreground/65">
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="text-xs truncate">{title}</div>
    </div>
    <div className="flex flex-col items-start pl-0.5 gap-x-4 gap-y-1 sm:flex-row sm:flex-wrap sm:items-baseline">
      {counts.map((count, i) => (
        <StatCountItem key={count.unit} {...count} primary={i === 0} />
      ))}
    </div>
  </div>
);
