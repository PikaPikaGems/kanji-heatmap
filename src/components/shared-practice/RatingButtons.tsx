import type { FsrsRating } from "engine-contract";
import { KeyHint } from "@/components/common/KeyHint";
import { PracticeButton } from "@/components/ui/practice-button";
import { cn } from "@/lib/utils";
import type { PassingRating } from "./rating-keys";

const BUTTONS: readonly {
  rating: PassingRating;
  label: string;
  variant: "primary" | "secondary";
  /** Keyboard hint shown on fine-pointer devices. */
  hint: string;
  shortcut: string;
}[] = [
  {
    rating: "hard",
    label: "Hard",
    variant: "secondary",
    hint: "2",
    shortcut: "2",
  },
  {
    rating: "good",
    label: "Good",
    variant: "primary",
    hint: "3 ↵",
    shortcut: "3 Enter",
  },
  {
    rating: "easy",
    label: "Easy",
    variant: "secondary",
    hint: "4",
    shortcut: "4",
  },
];

/**
 * Hard / Good / Easy buttons for a correct answer in a mastery game, as
 * grid children (the caller owns the grid). Each carries the interval it
 * would schedule, e.g. "Good · 5d", and a key hint (2 / 3 ↵ / 4). "Again"
 * has no button: Forgot and wrong answers grade it.
 */
export const RatingButtons = ({
  intervals,
  onRate,
  buttonClassName,
}: {
  intervals: Record<FsrsRating, string>;
  onRate: (rating: PassingRating) => void;
  buttonClassName?: string;
}) => (
  <>
    {BUTTONS.map(({ rating, label, variant, hint, shortcut }) => (
      <PracticeButton
        key={rating}
        variant={variant}
        size="md"
        className={cn("px-1 text-sm whitespace-nowrap", buttonClassName)}
        aria-keyshortcuts={shortcut}
        onClick={() => onRate(rating)}
      >
        {label} · {intervals[rating]}
        <KeyHint>{hint}</KeyHint>
      </PracticeButton>
    ))}
  </>
);
