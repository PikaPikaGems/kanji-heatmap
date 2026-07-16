import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const OverviewStat0 = ({
  value,
  label,
  Icon,
  className,
}: {
  value: number | string;
  label: string;
  Icon: LucideIcon;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-2xl border-2 border-b-4 border-foreground/15 bg-muted/30 px-3 py-3 text-left",
      className
    )}
  >
    <div className="flex items-center justify-center border-2 size-9 shrink-0 rounded-xl border-foreground/10 bg-background text-foreground/70">
      <Icon className="size-4" aria-hidden />
    </div>
    <div className="min-w-0">
      <div className="text-base font-extrabold leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1 truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  </div>
);

export const OverviewStat = ({
  value,
  label,
  Icon,
  className,
}: {
  value: number | string;
  label: string;
  Icon: LucideIcon;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-2xl border-1  bg-muted/20  px-3 py-3 text-left",
      className
    )}
  >
    <div className="flex items-center justify-center size-9 shrink-0 rounded-xl border-foreground/10 bg-background text-foreground/70">
      <Icon className="size-4" aria-hidden />
    </div>
    <div className="min-w-0">
      <div className="text-base font-extrabold leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1 truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  </div>
);
