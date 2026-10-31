import { Brain, Brush } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityKind,
  ActivityStats,
  READING_MASTERY_2_LABEL,
  READING_MASTERY_LABEL,
  WRITING_MASTERY_LABEL,
} from "@/lib/activity";
import { ActivityStatCard, ActivityStatCardSkeleton } from "./ActivityStatCard";
import {
  PracticeGamesTable,
  PracticeGamesTableSkeleton,
} from "./PracticeGamesTable";

const REVIEWS = { unit: "Reviews", unitSingular: "Review" };

/** The mastery cards, one per row at every width. */
const CARDS: {
  kind: ActivityKind;
  title: string;
  Icon: LucideIcon;
}[] = [
  {
    kind: "writingMastery",
    title: WRITING_MASTERY_LABEL,
    Icon: Brush,
  },
  {
    kind: "readingMastery",
    title: READING_MASTERY_LABEL,
    Icon: Brain,
  },
  {
    kind: "readingMastery2",
    title: READING_MASTERY_2_LABEL,
    Icon: Brain,
  },
];

const GRID_CN = "grid gap-2 sm:gap-3 md:grid-cols-2";
const CARDS_CN = "grid gap-2 sm:gap-3";

/**
 * The mastery cards (days, then reviews), then the practice games' table:
 * under the cards on phones, beside them from `md`.
 */
export const ActivityCountsGrid = ({ stats }: { stats: ActivityStats }) => (
  <div className={GRID_CN}>
    <div className={CARDS_CN}>
      {CARDS.map(({ kind, title, Icon }) => (
        <div key={kind} className="grid">
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
      {CARDS.map(({ kind }) => (
        <div key={kind} className="grid">
          <ActivityStatCardSkeleton />
        </div>
      ))}
    </div>
    <PracticeGamesTableSkeleton />
  </div>
);
