import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { formatCompactCount, formatRawCount } from "@/lib/format-count";
import { cn } from "@/lib/utils";
import { StatValue } from "./ActivityStatCard";

export type MasteryStripColumn = {
  id: string;
  /** The skill alone ("Writing"); the strip's header says "Kanji Mastery". */
  label: string;
  Icon: LucideIcon;
  days: number;
  reviews: number;
};

/** The strip's frame and its "Kanji Mastery ⭐️" header, like the games table. */
const StripShell = ({ children }: { children: ReactNode }) => (
  <div className="px-3 py-1.5 border rounded-xl border-foreground/5 bg-muted/10">
    <p className="py-1.5 text-[10px] font-bold tracking-wider text-left uppercase border-b border-dashed text-muted-foreground">
      Kanji Mastery ⭐️
    </p>
    <div className="grid grid-cols-3 divide-x divide-dotted divide-foreground/15">
      {children}
    </div>
  </div>
);

/** One skill: its icon and name, its days big, then its reviews. */
const Column = ({ label, Icon, days, reviews }: MasteryStripColumn) => (
  <div
    className={cn(
      "flex flex-col items-center min-w-0 gap-1 px-1 pt-2.5 pb-2",
      days === 0 && "opacity-40"
    )}
  >
    <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground/80 whitespace-nowrap">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
    <span className="flex flex-col items-center mt-1">
      <StatValue
        display={formatCompactCount(days)}
        raw={formatRawCount(days)}
        abbreviated={days >= 1000}
        className="text-[1.75rem] text-foreground"
      />
      <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
        {days === 1 ? "Day" : "Days"}
      </span>
    </span>
    <span className="w-8 my-1 border-t border-dotted border-foreground/20" />
    <span className="flex items-baseline gap-1 text-[11px] text-muted-foreground">
      <StatValue
        display={formatCompactCount(reviews)}
        raw={formatRawCount(reviews)}
        abbreviated={reviews >= 1000}
        className="text-xs font-bold text-foreground/70"
      />
      {reviews === 1 ? "review" : "reviews"}
    </span>
  </div>
);

/**
 * Phones: the three mastery skills as one panel of three columns (days, then
 * reviews), styled like the practice games table under it. Wider screens
 * show them as cards instead.
 */
export const MasteryStatsStrip = ({
  columns,
}: {
  columns: MasteryStripColumn[];
}) => (
  <StripShell>
    {columns.map((column) => (
      <Column key={column.id} {...column} />
    ))}
  </StripShell>
);

/** The strip with pulsing placeholders, while the counts load. */
export const MasteryStatsStripSkeleton = () => (
  <StripShell>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="flex flex-col items-center gap-2 px-1 pt-3 pb-2 animate-pulse"
      >
        <div className="w-14 h-3 rounded-full bg-muted" />
        <div className="w-8 rounded-lg h-7 bg-muted" />
        <div className="w-10 h-2.5 rounded-full bg-muted" />
        <div className="w-12 h-3 rounded-full bg-muted" />
      </div>
    ))}
  </StripShell>
);
