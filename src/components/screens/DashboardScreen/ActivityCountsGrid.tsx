import type { LucideIcon } from "lucide-react";
import {
  ActivityKind,
  ActivityStats,
  READING_MASTERY_2_LABEL,
  READING_MASTERY_LABEL,
  WRITING_MASTERY_LABEL,
} from "@/lib/activity";
import { GAME_ICONS } from "@/lib/pages/nav-links";
import { ActivityStatCard, ActivityStatCardSkeleton } from "./ActivityStatCard";
import {
  MasteryStatsStrip,
  MasteryStatsStripSkeleton,
} from "./MasteryStatsStrip";
import {
  PracticeGamesTable,
  PracticeGamesTableSkeleton,
} from "./PracticeGamesTable";

const REVIEWS = { unit: "Reviews", unitSingular: "Review" };

/**
 * The mastery skills: one strip of three columns on phones, cards stacked
 * beside the practice games from `md`. Icons match the menus'.
 */
const CARDS: {
  kind: ActivityKind;
  title: string;
  /** The skill alone, under the phone strip's "Kanji Mastery" header. */
  shortTitle: string;
  Icon: LucideIcon;
}[] = [
  {
    kind: "writingMastery",
    title: WRITING_MASTERY_LABEL,
    shortTitle: "Writing",
    Icon: GAME_ICONS.writingMastery,
  },
  {
    kind: "readingMastery",
    title: READING_MASTERY_LABEL,
    shortTitle: "Reading I",
    Icon: GAME_ICONS.readingMastery,
  },
  {
    kind: "readingMastery2",
    title: READING_MASTERY_2_LABEL,
    shortTitle: "Reading II",
    Icon: GAME_ICONS.readingMastery,
  },
];

const GRID_CN = "grid gap-2 sm:gap-3 md:grid-cols-2";
const CARDS_CN = "hidden gap-3 md:grid";

/**
 * The mastery cards (days, then reviews), then the practice games' table:
 * under the cards on phones, beside them from `md`.
 */
export const ActivityCountsGrid = ({ stats }: { stats: ActivityStats }) => (
  <div className={GRID_CN}>
    <div className="md:hidden">
      <MasteryStatsStrip
        columns={CARDS.map(({ kind, shortTitle, Icon }) => ({
          id: kind,
          label: shortTitle,
          Icon,
          days: stats.kinds[kind].days,
          reviews: stats.kinds[kind].count,
        }))}
      />
    </div>
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
    <div className="md:hidden">
      <MasteryStatsStripSkeleton />
    </div>
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
