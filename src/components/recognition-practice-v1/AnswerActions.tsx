import type { FsrsRating } from "engine-contract";
import { PracticeButton } from "@/components/ui/practice-button";
import {
  FORGOT_HINT,
  RatingButtons,
  RatingLabel,
} from "@/components/shared-practice";
import type { MasteryGrading } from "@/components/shared-practice";

/**
 * The buttons under the answer input. Mastery games: Forgot / Hard / Good /
 * Easy, with the ratings greyed out until the typed reading matches, then
 * Forgot greyed out. Practice games: Forgot / Next.
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
  if (grading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <PracticeButton
          variant="danger"
          size="md"
          className="px-1 text-xs sm:text-sm"
          disabled={matched}
          onClick={onForgot}
        >
          <RatingLabel
            label="Forgot"
            interval={grading.intervals.again}
            hint={matched ? undefined : FORGOT_HINT}
          />
        </PracticeButton>
        <RatingButtons
          intervals={grading.intervals}
          disabled={!matched}
          onRate={onRate}
        />
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
