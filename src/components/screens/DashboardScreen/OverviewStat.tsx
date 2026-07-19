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

export const OverviewStat = ({
  value,
  title,
  unit,
  Icon,
  className,
  /** 3-up mobile: no icon, centered text. Icon + left stack from `sm` up. */
  compact = false,
}: {
  value: number | string;
  /** Activity name, e.g. "Speed Katakana" or "Total". */
  title: string;
  /** Metric unit, e.g. "Days", "Sessions", "Rounds". */
  unit: string;
  Icon: LucideIcon;
  className?: string;
  compact?: boolean;
}) => {
  const isNumber = typeof value === "number";
  const raw = isNumber ? formatRawCount(value) : value;
  const display = isNumber ? formatCompactCount(value) : value;
  const abbreviated = isNumber && value >= 1000;

  return (
    <div
      className={cn(
        // No h-full: Safari mis-resolves % height on auto-row grid children.
        "flex w-full min-w-0 items-start gap-2 rounded-xl border border-foreground/5 bg-muted/10 px-2 py-2 text-left sm:gap-2.5 sm:px-3 sm:py-2.5",
        compact &&
          "max-w-none flex-col items-center justify-center gap-1 px-1.5 py-3 text-center sm:max-w-[10rem] sm:flex-row sm:items-start sm:justify-start sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-left",
        className
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-background text-foreground/65 sm:size-8 sm:rounded-xl",
          compact && "hidden sm:flex"
        )}
      >
        <Icon className="size-3.5 sm:size-4" aria-hidden />
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-0.5",
          compact && "w-full items-center sm:w-auto sm:items-start"
        )}
      >
        <StatValue
          display={display}
          raw={raw}
          abbreviated={abbreviated}
          className={cn(!compact && "pt-1", compact && "sm:pt-1")}
        />
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {unit}
        </div>
        <div
          className={cn(
            "text-[11px] font-bold leading-snug text-foreground/80 sm:text-xs",
            compact &&
              "max-w-full truncate sm:whitespace-normal sm:overflow-visible"
          )}
        >
          {title}
        </div>
      </div>
    </div>
  );
};
