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
 * A rating button's label with its interval on a smaller second line, so a
 * long interval ("3.5mo") can't overflow a narrow button. The key hint hangs
 * off the label's right edge (out of flow) so the label stays centered over
 * the interval.
 */
export const RatingLabel = ({
  label,
  interval,
  hint,
}: {
  label: string;
  interval: string;
  hint?: string;
}) => (
  <span className="flex flex-col items-center leading-tight">
    <span className="relative">
      {label}
      {hint && (
        <KeyHint className="absolute left-full top-1/2 ml-1 -translate-y-1/2">
          {hint}
        </KeyHint>
      )}
    </span>
    <span className="text-[10px] sm:text-xs font-semibold opacity-80 tabular-nums">
      {interval}
    </span>
  </span>
);

/**
 * Hard / Good / Easy buttons for a correct answer in a mastery game, as
 * grid children (the caller owns the grid). Each carries the interval it
 * would schedule under its label ("Good", then "5d"), and its key as a tiny
 * hint (H / G / E), hidden while disabled since the keys don't work then.
 * "Again" has no button here: Forgot and wrong answers grade it.
 */
export const RatingButtons = ({
  intervals,
  disabled = false,
  onRate,
}: {
  intervals: Record<FsrsRating, string>;
  /** E.g. Writing Mastery before anything is drawn. */
  disabled?: boolean;
  onRate: (rating: PassingRating) => void;
}) => (
  <>
    {BUTTONS.map(({ rating, label, variant, hint, shortcut }) => (
      <PracticeButton
        key={rating}
        variant={variant}
        size="md"
        className="px-1 text-xs sm:text-sm whitespace-nowrap"
        aria-keyshortcuts={shortcut}
        disabled={disabled}
        onClick={() => onRate(rating)}
      >
        <RatingLabel
          label={label}
          interval={intervals[rating]}
          hint={disabled ? undefined : hint}
        />
      </PracticeButton>
    ))}
  </>
);
