import { Brain, Brush, Eye, Keyboard, PenLine, Puzzle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ActivityKind,
  ActivityStats,
  READING_MASTERY_2_LABEL,
  READING_MASTERY_LABEL,
  WRITING_MASTERY_LABEL,
} from "@/lib/activity";
import {
  fillTheKanjiPageMeta,
  productionPracticePageMeta,
  recognitionPractice2PageMeta,
  recognitionPracticePageMeta,
  speedKatakanaPageMeta,
} from "@/lib/pages/practice-pages";
import { cn } from "@/lib/utils";
import {
  ActivityStatCard,
  ActivityStatCardSkeleton,
  type StatCount,
} from "./ActivityStatCard";

type CountUnit = Pick<StatCount, "unit" | "unitSingular">;

const REVIEWS: CountUnit = { unit: "Reviews", unitSingular: "Review" };
const ROUNDS: CountUnit = { unit: "Rounds", unitSingular: "Round" };

/**
 * The cards, in their order on phones: Writing Mastery (whole row) /
 * Reading Mastery I, II / Speed Katakana, Fill in the Kanji / Writing
 * Practice (whole row) / Reading Practice I, II. On large screens
 * (`lg:order-*`, six columns): the three mastery games, the three practice
 * games, then Speed Katakana and Fill in the Kanji.
 */
const CARDS: {
  kind: ActivityKind;
  title: string;
  Icon: LucideIcon;
  count: CountUnit;
  cellCn: string;
}[] = [
  {
    kind: "writingMastery",
    title: WRITING_MASTERY_LABEL,
    Icon: Brush,
    count: REVIEWS,
    cellCn: "col-span-2 lg:order-1",
  },
  {
    kind: "readingMastery",
    title: READING_MASTERY_LABEL,
    Icon: Brain,
    count: REVIEWS,
    cellCn: "lg:col-span-2 lg:order-2",
  },
  {
    kind: "readingMastery2",
    title: READING_MASTERY_2_LABEL,
    Icon: Brain,
    count: REVIEWS,
    cellCn: "lg:col-span-2 lg:order-3",
  },
  {
    kind: "speedKatakana",
    title: speedKatakanaPageMeta.shortLabel,
    Icon: Keyboard,
    count: { unit: "Sessions", unitSingular: "Session" },
    cellCn: "lg:col-span-3 lg:order-7",
  },
  {
    kind: "fillTheKanji",
    title: fillTheKanjiPageMeta.shortLabel,
    Icon: Puzzle,
    count: { unit: "Batches", unitSingular: "Batch" },
    cellCn: "lg:col-span-3 lg:order-8",
  },
  {
    kind: "production",
    title: productionPracticePageMeta.shortLabel,
    Icon: PenLine,
    count: ROUNDS,
    cellCn: "col-span-2 lg:order-4",
  },
  {
    kind: "recognition",
    title: recognitionPracticePageMeta.shortLabel,
    Icon: Eye,
    count: ROUNDS,
    cellCn: "lg:col-span-2 lg:order-5",
  },
  {
    kind: "recognition2",
    title: recognitionPractice2PageMeta.shortLabel,
    Icon: Eye,
    count: ROUNDS,
    cellCn: "lg:col-span-2 lg:order-6",
  },
];

const GRID_CN = "grid grid-cols-2 gap-2 lg:grid-cols-6 sm:gap-3";

/** One card per activity: its days, then its reviews / rounds / batches / sessions. */
export const ActivityCountsGrid = ({ stats }: { stats: ActivityStats }) => (
  <div className={GRID_CN}>
    {CARDS.map(({ kind, title, Icon, count, cellCn }) => (
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
            { value: stats.kinds[kind].count, ...count },
          ]}
        />
      </div>
    ))}
  </div>
);

/** The same grid of cards as pulsing placeholders, while the counts load. */
export const ActivityCountsGridSkeleton = () => (
  <div className={GRID_CN}>
    {CARDS.map(({ kind, cellCn }) => (
      <div key={kind} className={cn("grid", cellCn)}>
        <ActivityStatCardSkeleton />
      </div>
    ))}
  </div>
);
