import type { FsrsRating } from "engine-contract";
import { KeyHint } from "@/components/common/KeyHint";
import { PracticeButton } from "@/components/ui/practice-button";
import { FORGOT_HINT, RatingButtons } from "@/components/shared-practice";
import type { PassingRating } from "@/components/shared-practice";

/**
 * Writing Mastery's row under the drawing pad, laid out like Reading
 * Mastery's: Forgot, then Hard / Good / Easy, each of which submits the
 * drawing with that rating.
 */
export const DrawRatingActions = ({
  intervals,
  forgotDisabled,
  rateDisabled,
  onForgot,
  onRate,
}: {
  intervals: Record<FsrsRating, string>;
  forgotDisabled: boolean;
  /** Nothing drawn yet, or the drawing is being checked. */
  rateDisabled: boolean;
  onForgot: () => void;
  onRate: (rating: PassingRating) => void;
}) => (
  <div className="grid w-full max-w-lg grid-cols-4 gap-2 mt-1 sm:mt-0">
    <PracticeButton
      variant="danger"
      size="md"
      className="gap-1.5 px-1 text-xs sm:text-sm whitespace-nowrap"
      aria-keyshortcuts="?"
      disabled={forgotDisabled}
      onClick={onForgot}
    >
      Forgot
      <KeyHint>{FORGOT_HINT}</KeyHint>
    </PracticeButton>
    <RatingButtons
      intervals={intervals}
      disabled={rateDisabled}
      onRate={onRate}
    />
  </div>
);
