import type { FsrsRating } from "engine-contract";
import { KeyHint } from "@/components/common/KeyHint";
import { PracticeButton } from "@/components/ui/practice-button";
import type { PassingRating } from "./rating-keys";

const BUTTONS: readonly {
  rating: PassingRating;
  label: string;
  variant: "orange" | "blue" | "green";
  /** Key shown as the hint on fine-pointer devices (see rating-keys.ts). */
  hint: string;
  shortcut: string;
}[] = [
  {
    rating: "hard",
    label: "Hard",
    variant: "orange",
    hint: "H",
    shortcut: "H",
  },
  {
    rating: "good",
    label: "Good",
    variant: "blue",
    hint: "G",
    shortcut: "G Enter",
  },
  { rating: "easy", label: "Easy", variant: "green", hint: "E", shortcut: "E" },
];

/**
 * Hard / Good / Easy buttons for a correct answer in a mastery game, as
 * grid children (the caller owns the grid). Each carries the interval it
 * would schedule, e.g. "Good · 5d", and its key as a tiny hint (H / G / E).
 * "Again" has no button here: Forgot and wrong answers grade it.
 */
export const RatingButtons = ({
  intervals,
  onRate,
}: {
  intervals: Record<FsrsRating, string>;
  onRate: (rating: PassingRating) => void;
}) => (
  <>
    {BUTTONS.map(({ rating, label, variant, hint, shortcut }) => (
      <PracticeButton
        key={rating}
        variant={variant}
        size="md"
        className="gap-1.5 px-1 text-xs sm:text-sm whitespace-nowrap"
        aria-keyshortcuts={shortcut}
        onClick={() => onRate(rating)}
      >
        {label} · {intervals[rating]}
        <KeyHint>{hint}</KeyHint>
      </PracticeButton>
    ))}
  </>
);
