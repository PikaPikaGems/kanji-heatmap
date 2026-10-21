import { useState } from "react";
import type { ReviewSummary } from "engine-contract";
import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { LegendDot, StackedBar } from "@/components/common/StackedBar";
import { RATING_FILL } from "@/components/shared-practice/rating-border";
import {
  addRatings,
  type DayRatings,
  RATING_LABELS,
  RATINGS,
  totalRatings,
} from "@/lib/activity";
import { formatRawCount, formatShare } from "@/lib/format-count";

/** Forgot / Hard / Good / Easy as one StackedBar; empty when nothing was rated. */
export const RatingsBar = ({ ratings }: { ratings: ReviewSummary }) => (
  <StackedBar
    total={totalRatings(ratings)}
    segments={RATINGS.map((rating) => ({
      key: rating,
      value: ratings[rating] ?? 0,
      cn: RATING_FILL[rating],
    }))}
  />
);

/** Each rating's share after its color dot: "● 12% forgot  ● 30% hard …". */
export const RatingsLine = ({ ratings }: { ratings: ReviewSummary }) => {
  const total = totalRatings(ratings);
  return (
    <ul className="flex flex-wrap justify-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground tabular-nums">
      {RATINGS.map((rating) => (
        <li key={rating} className="inline-flex items-center gap-1">
          <LegendDot className={RATING_FILL[rating]} />
          <span>
            <span className="font-bold text-foreground">
              {formatShare(ratings[rating] ?? 0, total)}
            </span>{" "}
            {RATING_LABELS[rating].toLowerCase()}
          </span>
        </li>
      ))}
    </ul>
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
            <LegendDot className={RATING_FILL[rating]} />
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
 * How mastery reviews were rated: a row each for Reading, Writing and
 * Combined, whatever the activity filters show.
 */
export const ReviewRatings = ({ ratings }: { ratings: DayRatings }) => (
  <section className="w-full px-4 py-3 mt-4 border rounded-xl border-foreground/5 bg-muted/10">
    <h3 className="mb-1 text-xs font-bold text-center uppercase text-muted-foreground">
      Review ratings
    </h3>
    <RatingsRow label="Reading" ratings={ratings.reading} />
    <RatingsRow label="Writing" ratings={ratings.writing} />
    <RatingsRow
      label="Combined"
      ratings={addRatings(ratings.reading, ratings.writing)}
    />
  </section>
);
