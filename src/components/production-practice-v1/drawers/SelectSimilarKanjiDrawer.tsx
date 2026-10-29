import { KeyHint } from "@/components/common/KeyHint";
import { PracticeButton } from "@/components/ui/practice-button";
import {
  FORGOT_HINT,
  FORGOT_KEYS,
  RATING_KEYS,
  RatingButtons,
  RatingLabel,
  ratingForKey,
} from "@/components/shared-practice";
import type { PassingRating } from "@/components/shared-practice";
import type { FsrsRating } from "engine-contract";
import { useEnterAction } from "@/hooks/use-enter-action";
import { gradeHeadline } from "@/lib/dakanji-grade";
import {
  KanjiTile,
  KanjiTileGrid,
} from "@/components/shared-practice/KanjiTileGrid";
import type { GradeRankInfo } from "../types";
import { PracticeDrawerShell } from "./PracticeDrawerShell";

const CONFIRM_KEYS = ["Enter", " "] as const;

/** Writing Mastery: rate the pick instead of a plain Next. */
type PickRating = {
  intervals: Record<FsrsRating, string>;
  onRate: (rating: PassingRating) => void;
};

/**
 * Writing Mastery's row, the same as Reading Mastery's once a reading
 * matches: Forgot until a kanji is picked, then Hard / Good / Easy.
 */
const RatingFooter = ({
  rating,
  hasSelection,
  onForgot,
}: {
  rating: PickRating;
  hasSelection: boolean;
  onForgot: () => void;
}) => (
  <div className="grid grid-cols-4 gap-2 px-3 sm:px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
    <PracticeButton
      variant="danger"
      size="md"
      className="gap-1.5 px-1 text-xs sm:text-sm whitespace-nowrap"
      aria-keyshortcuts="?"
      disabled={hasSelection}
      onClick={onForgot}
    >
      <RatingLabel label="Forgot" interval={rating.intervals.again} />
      {!hasSelection && <KeyHint>{FORGOT_HINT}</KeyHint>}
    </PracticeButton>
    <RatingButtons
      intervals={rating.intervals}
      disabled={!hasSelection}
      onRate={rating.onRate}
    />
  </div>
);

export const SelectSimilarKanjiDrawer = ({
  open,
  grade,
  candidates,
  selected,
  gradingEnabled = true,
  recognitionSkipped = false,
  rating,
  onSelect,
  onForgot,
  onNext,
}: {
  open: boolean;
  grade: GradeRankInfo;
  candidates: string[];
  selected: string | null;
  gradingEnabled?: boolean;
  /** Mid-session recognize failure — quiet pick-only notice for this card. */
  recognitionSkipped?: boolean;
  /**
   * Mastery game: Hard / Good / Easy (H / G / E, Enter = Good) rate the
   * pick in place of Next, and "?" is Forgot while nothing is selected.
   */
  rating?: PickRating;
  onSelect: (k: string | null) => void;
  onForgot: () => void;
  onNext: () => void;
}) => {
  const hasSelection = selected != null;

  useEnterAction(onNext, open && hasSelection && !rating, CONFIRM_KEYS);
  useEnterAction(
    rating ? (key) => rating.onRate(ratingForKey(key) ?? "good") : null,
    open && hasSelection,
    RATING_KEYS
  );
  useEnterAction(
    onForgot,
    open && rating != null && !hasSelection,
    FORGOT_KEYS
  );

  const title = gradingEnabled ? gradeHeadline(grade.rank) : "Pick the kanji";
  const description = recognitionSkipped
    ? "Couldn't grade this drawing — pick the kanji instead."
    : gradingEnabled
      ? grade.inTop10
        ? "Which kanji did you draw?"
        : "Which kanji is correct?"
      : "Stroke grading isn't available — choose the character that fits.";

  return (
    <PracticeDrawerShell
      open={open}
      autoFocus
      title={title}
      description={description}
      footer={
        rating ? (
          <RatingFooter
            rating={rating}
            hasSelection={hasSelection}
            onForgot={onForgot}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 px-3 sm:px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-md mx-auto w-full">
            <PracticeButton
              variant="danger"
              size="md"
              disabled={hasSelection}
              onClick={onForgot}
            >
              Forgot
            </PracticeButton>
            <PracticeButton
              variant="primary"
              size="md"
              disabled={!hasSelection}
              onClick={onNext}
            >
              Next
            </PracticeButton>
          </div>
        )
      }
    >
      <div className="px-3 pb-2 overflow-y-auto sm:px-4">
        <KanjiTileGrid className="sm:grid-cols-6 sm:max-w-2xl">
          {candidates.map((c, i) => {
            const isSelected = selected === c;
            return (
              <KanjiTile
                key={c}
                kanji={c}
                selected={isSelected}
                autoFocus={i === 0}
                ariaLabel={isSelected ? `Deselect ${c}` : `Select ${c}`}
                onClick={() => onSelect(isSelected ? null : c)}
              />
            );
          })}
        </KanjiTileGrid>
      </div>
    </PracticeDrawerShell>
  );
};
