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
};

/** One count: the number, then its unit. */
const StatCountItem = ({ value, unit }: StatCount) => (
  <div className="flex items-baseline gap-1.5 min-w-0">
    <StatValue
      display={formatCompactCount(value)}
      raw={formatRawCount(value)}
      abbreviated={value >= 1000}
      className="text-xl text-foreground"
    />
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {unit}
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
  counts: StatCount[];
}) => (
  <div className="flex flex-col w-full min-w-0 gap-2 px-2.5 py-2 text-left border rounded-xl border-foreground/5 bg-muted/10 sm:px-3 sm:py-2.5">
    <div className="flex items-center min-w-0 gap-2">
      <div className="flex items-center justify-center border rounded-lg size-7 shrink-0 border-foreground/10 bg-background text-foreground/65">
        <Icon className="size-3.5" aria-hidden />
      </div>
      <div className="text-xs font-bold truncate text-foreground/80">
        {title}
      </div>
    </div>
    <div className="flex flex-wrap pl-0.5 gap-x-4 gap-y-1">
      {counts.map((count) => (
        <StatCountItem key={count.unit} {...count} />
      ))}
    </div>
  </div>
);
