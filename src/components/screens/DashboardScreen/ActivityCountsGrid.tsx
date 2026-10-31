import { Brain, Brush } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityKind,
  ActivityStats,
  READING_MASTERY_2_LABEL,
  READING_MASTERY_LABEL,
  WRITING_MASTERY_LABEL,
} from "@/lib/activity";
import { cn } from "@/lib/utils";
import { ActivityStatCard, ActivityStatCardSkeleton } from "./ActivityStatCard";
import {
  PracticeGamesTable,
  PracticeGamesTableSkeleton,
} from "./PracticeGamesTable";

const REVIEWS = { unit: "Reviews", unitSingular: "Review" };

/**
 * The mastery cards. On phones Writing Mastery takes a whole row over
 * Reading Mastery I and II; from `md` the three stack in one column.
 */
const CARDS: {
  kind: ActivityKind;
  title: string;
  Icon: LucideIcon;
  cellCn: string;
}[] = [
  {
    kind: "writingMastery",
    title: WRITING_MASTERY_LABEL,
    Icon: Brush,
    cellCn: "col-span-2 md:col-span-1",
  },
  {
    kind: "readingMastery",
    title: READING_MASTERY_LABEL,
    Icon: Brain,
    cellCn: "",
  },
  {
    kind: "readingMastery2",
    title: READING_MASTERY_2_LABEL,
    Icon: Brain,
    cellCn: "",
  },
];

const GRID_CN = "grid gap-2 sm:gap-3 md:grid-cols-2";
const CARDS_CN = "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-1";

/**
 * The mastery cards (days, then reviews), then the practice games' table:
 * under the cards on phones, beside them from `md`.
 */
export const ActivityCountsGrid = ({ stats }: { stats: ActivityStats }) => (
  <div className={GRID_CN}>
    <div className={CARDS_CN}>
      {CARDS.map(({ kind, title, Icon, cellCn }) => (
        <div key={kind} className={cn("grid", cellCn)}>
          <ActivityStatCard
            title={title}
            Icon={Icon}
            counts={[
              {
                value: stats.kinds[kind].days,
                unit: "Days",
                unitSingular: "Day",
              },
              { value: stats.kinds[kind].count, ...REVIEWS },
            ]}
          />
        </div>
      ))}
    </div>
    <PracticeGamesTable stats={stats} />
  </div>
);

/** The same cards and table as pulsing placeholders, while the counts load. */
export const ActivityCountsGridSkeleton = () => (
  <div className={GRID_CN}>
    <div className={CARDS_CN}>
      {CARDS.map(({ kind, cellCn }) => (
        <div key={kind} className={cn("grid", cellCn)}>
          <ActivityStatCardSkeleton />
        </div>
      ))}
    </div>
    <PracticeGamesTableSkeleton />
  </div>
);
