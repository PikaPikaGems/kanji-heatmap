import { useState } from "react";
import type { ReviewSummary } from "engine-contract";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { RATING_FILL } from "@/components/shared-practice/rating-border";
import {
  addRatings,
  type DayRatings,
  RATING_LABELS,
  RATINGS,
  totalRatings,
} from "@/lib/activity";
import { formatRawCount, formatShare } from "@/lib/format-count";
import { cn } from "@/lib/utils";

/** Forgot / Hard / Good / Easy as one stacked bar; empty when nothing was rated. */
export const RatingsBar = ({
  ratings,
  className,
}: {
  ratings: ReviewSummary;
  className?: string;
}) => {
  const total = totalRatings(ratings);
  return (
    <div
      className={cn(
        "flex w-full h-1.5 overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      {RATINGS.map((rating) => {
        const count = ratings[rating] ?? 0;
        if (count === 0) return null;
        return (
          <div
            key={rating}
            className={RATING_FILL[rating]}
            style={{ width: `${(count / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
};

/** "12% forgot · 30% hard · 50% good · 8% easy", for tight spots. */
export const RatingsLine = ({ ratings }: { ratings: ReviewSummary }) => {
  const total = totalRatings(ratings);
  return (
    <p className="text-[10px] text-muted-foreground tabular-nums">
      {RATINGS.map(
        (rating) =>
          `${formatShare(ratings[rating] ?? 0, total)} ${RATING_LABELS[rating].toLowerCase()}`
      ).join(" · ")}
    </p>
  );
};

/** Every rating as a colored square, its name, its count and its share. */
const RatingsBreakdown = ({
  title,
  ratings,
}: {
  title: string;
  ratings: ReviewSummary;
}) => {
  const total = totalRatings(ratings);
  return (
    <div className="w-56 px-4 py-3 text-left">
      <p className="mb-2 text-xs font-bold">{title}</p>
      <ul className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 gap-y-1 text-[11px]">
        {RATINGS.map((rating) => (
          <li key={rating} className="contents">
            <span
              aria-hidden
              className={`size-3 rounded-sm ${RATING_FILL[rating]}`}
            />
            <span className="font-semibold">{RATING_LABELS[rating]}</span>
            <span className="text-right tabular-nums">
              {formatRawCount(ratings[rating] ?? 0)}
            </span>
            <span className="text-right tabular-nums text-muted-foreground min-w-10">
              {formatShare(ratings[rating] ?? 0, total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * One card type's ratings: its label with an ⓘ, the bar and the review
 * count. Tapping the bar or the label opens the breakdown, like the Kanji
 * Mastery bars.
 */
const RatingsRow = ({
  label,
  ratings,
}: {
  label: string;
  ratings: ReviewSummary;
}) => {
  const [open, setOpen] = useState(false);
  const total = totalRatings(ratings);
  const title = `${label} review ratings`;

  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 font-extrabold text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <InfoIcon
          aria-hidden
          size={11}
          className="shrink-0 text-muted-foreground"
        />
      </button>
      <GenericPopover
        open={open}
        onOpenChange={setOpen}
        focusOnOpen={false}
        trigger={
          <button
            type="button"
            aria-label={`${title}: breakdown`}
            className="block w-full py-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RatingsBar ratings={ratings} />
          </button>
        }
        content={<RatingsBreakdown title={title} ratings={ratings} />}
      />
      <span className="text-[10px] tabular-nums text-right min-w-16">
        {formatRawCount(total)} reviews
      </span>
    </div>
  );
};

/**
 * How mastery reviews were rated: a row each for Reading and Writing (the
 * ones shown), then Combined when both are.
 */
export const ReviewRatings = ({
  ratings,
  showReading = true,
  showWriting = true,
}: {
  ratings: DayRatings;
  showReading?: boolean;
  showWriting?: boolean;
}) => {
  if (!showReading && !showWriting) return null;
  return (
    <section className="w-full max-w-md px-4 py-3 mx-auto mt-4 border rounded-xl border-foreground/5 bg-muted/10">
      <h3 className="mb-1 text-xs font-bold text-center uppercase text-muted-foreground">
        Review ratings
      </h3>
      {showReading && <RatingsRow label="Reading" ratings={ratings.reading} />}
      {showWriting && <RatingsRow label="Writing" ratings={ratings.writing} />}
      {showReading && showWriting && (
        <RatingsRow
          label="Combined"
          ratings={addRatings(ratings.reading, ratings.writing)}
        />
      )}
    </section>
  );
};
