import { PracticeButton } from "@/components/ui/practice-button";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { useArmedConfirmKey } from "@/hooks/use-armed-confirm-key";

/** Inline answer reveal shown in place of the input controls. */
export const AnswerFeedback = ({
  correct,
  reading,
  word,
  onNext,
}: {
  correct: boolean;
  reading: string;
  word: string;
  englishGloss: string;
  onNext: () => void;
}) => {
  const readings = reading
    .split("・")
    .map((r) => r.trim())
    .filter(Boolean);

  // Don't treat the Enter that opened feedback as "Continue".
  useArmedConfirmKey({ onConfirm: onNext });

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={correct ? "Correct" : "Forgot"}
    >
      <div className="flex flex-wrap items-center justify-center gap-1 animate-practice-bounce-soft">
        <p>{correct ? "🎉 ·" : ""}</p>
        <SpeakButton word={word} iconType="volume-2" />
        {readings.map((r) => (
          <RomajiBadge key={r} kana={r} />
        ))}
      </div>
      <PracticeButton
        size="lg"
        className="max-w-xs animate-fade-in"
        onClick={onNext}
      >
        Continue
      </PracticeButton>
    </div>
  );
};
