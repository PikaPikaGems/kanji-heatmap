import type { FsrsRating } from "engine-contract";
import { KeyHint } from "@/components/common/KeyHint";
import { PracticeButton } from "@/components/ui/practice-button";
import { FORGOT_HINT, RatingButtons } from "@/components/shared-practice";
import type { MasteryGrading } from "@/components/shared-practice";

/**
 * Forgot / Next row under the answer input. In a mastery game, once the typed
 * reading matches, Forgot is disabled and Next gives way to Hard / Good / Easy.
 */
export const AnswerActions = ({
  matched,
  grading,
  onForgot,
  onNext,
  onRate,
}: {
  matched: boolean;
  grading?: MasteryGrading;
  onForgot: () => void;
  onNext: () => void;
  onRate: (rating: FsrsRating) => void;
}) => {
  if (grading && matched) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <PracticeButton
          variant="danger"
          size="md"
          className="px-1 text-xs sm:text-sm"
          disabled
        >
          Forgot
        </PracticeButton>
        <RatingButtons intervals={grading.intervals} onRate={onRate} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <PracticeButton
        variant="danger"
        size="md"
        disabled={matched}
        onClick={onForgot}
      >
        Forgot
        {grading && !matched && <KeyHint>{FORGOT_HINT}</KeyHint>}
      </PracticeButton>
      <PracticeButton
        variant="primary"
        size="md"
        disabled={!matched}
        onClick={onNext}
      >
        Next
      </PracticeButton>
    </div>
  );
};
