import type { LucideIcon } from "lucide-react";
import type { CardProgress } from "engine-contract";
import { formatDaysHuman, formatInterval } from "@/lib/engine/format-interval";
import { relativeTime } from "@/lib/engine/relative-time";

const NONE = "—";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const formatDate = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const nextReviewIn = (dueAt: string, now: number) => {
  const dueMs = Date.parse(dueAt);
  return dueMs <= now ? "Due now" : formatInterval(dueMs - now);
};

/** The rows under "Next review in", for one card (design doc 5.4). */
const progressRows = (card: CardProgress) => {
  // A card nobody has graded yet has no memory model to report.
  const studied = card.learningState !== "new";
  const seen = card.repetitions;
  const ratings = card.ratingsSummary ?? {};
  const correct =
    (ratings.hard ?? 0) + (ratings.good ?? 0) + (ratings.easy ?? 0);

  return [
    {
      label: "Stability",
      value: studied ? formatDaysHuman(card.stability) : NONE,
    },
    {
      label: "Difficulty",
      value: studied ? `${card.difficulty.toFixed(1)} / 10` : NONE,
    },
    { label: "State", value: capitalize(card.learningState) },
    { label: "Seen", value: String(seen) },
    { label: "Correct", value: String(correct) },
    {
      label: "Accuracy",
      value:
        seen > 0
          ? `${Math.min(100, Math.round((correct / seen) * 100))}%`
          : NONE,
    },
    { label: "Lapses", value: String(card.lapses) },
    {
      label: "First studied",
      value: card.firstReviewedAt ? formatDate(card.firstReviewedAt) : NONE,
    },
    {
      label: "Last review",
      value: card.lastReviewedAt
        ? relativeTime(Date.parse(card.lastReviewedAt))
        : NONE,
    },
    {
      label: "Recall now",
      value: studied ? `${Math.round(card.retrievability * 100)}%` : NONE,
    },
  ];
};

/** Reading or writing progress of one kanji, styled like a dashboard stat card. */
export const ProgressCard = ({
  title,
  Icon,
  card,
}: {
  title: string;
  Icon: LucideIcon;
  card: CardProgress;
}) => {
  const now = Date.now();

  return (
    <section className="flex flex-col w-full min-w-0 gap-3 px-2.5 py-2 text-left border rounded-xl border-foreground/5 bg-muted/10 sm:px-3 sm:py-2.5">
      <div className="flex items-center min-w-0 gap-2">
        <div className="flex items-center justify-center border rounded-lg size-7 shrink-0 border-foreground/10 bg-background text-foreground/65">
          <Icon className="size-3.5" aria-hidden />
        </div>
        <h4 className="text-xs truncate">{title}</h4>
      </div>
      <div className="flex flex-wrap items-baseline pl-0.5 gap-x-2 gap-y-0.5">
        <span className="text-[1.75rem] font-extrabold leading-none tabular-nums">
          {nextReviewIn(card.dueAt, now)}
        </span>
        <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
          Next review
        </span>
      </div>
      <dl className="flex flex-col">
        {progressRows(card).map(({ label, value }) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-3 py-1 border-t border-dotted border-foreground/15"
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-bold text-right tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
