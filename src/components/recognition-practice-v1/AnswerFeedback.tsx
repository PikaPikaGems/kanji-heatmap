import { useEffect } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";

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

  useEffect(() => {
    // Don't treat the Enter that opened feedback as "Continue".
    let armed = false;
    const arm = () => {
      armed = true;
    };
    const armTimeout = window.setTimeout(arm, 300);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Enter") arm();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!armed || e.key !== "Enter" || e.isComposing) return;
      e.preventDefault();
      onNext();
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(armTimeout);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onNext]);

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
