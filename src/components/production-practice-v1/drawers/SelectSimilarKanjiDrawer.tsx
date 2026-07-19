import { PracticeButton } from "@/components/ui/practice-button";
import { useEnterAction } from "@/hooks/use-enter-action";
import { gradeHeadline } from "@/lib/dakanji-grade";
import { cn } from "@/lib/utils";
import type { GradeRankInfo } from "../types";
import { PracticeDrawerShell } from "./PracticeDrawerShell";

const CONFIRM_KEYS = ["Enter", " "] as const;

export const SelectSimilarKanjiDrawer = ({
  open,
  grade,
  candidates,
  selected,
  gradingEnabled = true,
  onSelect,
  onForgot,
  onNext,
}: {
  open: boolean;
  grade: GradeRankInfo;
  candidates: string[];
  selected: string | null;
  gradingEnabled?: boolean;
  onSelect: (k: string | null) => void;
  onForgot: () => void;
  onNext: () => void;
}) => {
  const hasSelection = selected != null;

  useEnterAction(onNext, open && hasSelection, CONFIRM_KEYS);

  const title = gradingEnabled ? gradeHeadline(grade.rank) : "Pick the kanji";
  const description = gradingEnabled
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
      }
    >
      <div className="px-3 pb-2 overflow-y-auto sm:px-4">
        <div className="grid max-w-md grid-cols-4 gap-1.5 mx-auto sm:gap-2">
          {candidates.map((c, i) => {
            const isSelected = selected === c;
            return (
              <PracticeButton
                key={c}
                type="button"
                size="icon"
                variant={isSelected ? "primary" : "secondary"}
                autoFocus={i === 0}
                onClick={() => onSelect(isSelected ? null : c)}
                className={cn(
                  "aspect-square h-auto w-full min-h-0 p-0 sm:text-5xl text-4xl kanji-font rounded-xl",
                  !isSelected && "border-dashed"
                )}
                aria-pressed={isSelected}
                aria-label={isSelected ? `Deselect ${c}` : `Select ${c}`}
              >
                {c}
              </PracticeButton>
            );
          })}
        </div>
      </div>
    </PracticeDrawerShell>
  );
};
