import type { FsrsRating } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import { cn } from "@/lib/utils";

type PassingRating = Exclude<FsrsRating, "again">;

const BUTTONS: readonly {
  rating: PassingRating;
  label: string;
  variant: "primary" | "secondary";
}[] = [
  { rating: "hard", label: "Hard", variant: "secondary" },
  { rating: "good", label: "Good", variant: "primary" },
  { rating: "easy", label: "Easy", variant: "secondary" },
];

/**
 * Hard / Good / Easy buttons for a correct answer in a mastery game, as
 * grid children (the caller owns the grid). Each carries the interval it
 * would schedule, e.g. "Good · 5d". "Again" has no button: Forgot and wrong
 * answers grade it.
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
    {BUTTONS.map(({ rating, label, variant }) => (
      <PracticeButton
        key={rating}
        variant={variant}
        size="md"
        className={cn("px-1 text-sm whitespace-nowrap", buttonClassName)}
        onClick={() => onRate(rating)}
      >
        {label} · {intervals[rating]}
      </PracticeButton>
    ))}
  </>
);
