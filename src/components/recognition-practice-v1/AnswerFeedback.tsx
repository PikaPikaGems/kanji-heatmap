import { useEffect, useState } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { pickCorrectCheer, pickForgotCheer } from "@/lib/practice-cheers";

/** Inline answer reveal shown in place of the input controls. */
export const AnswerFeedback = ({
  correct,
  reading,
  word,
  englishGloss,
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

  const [cheer] = useState(() =>
    correct ? pickCorrectCheer() : pickForgotCheer()
  );

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
      className="flex flex-col items-center gap-3 animate-fade-in-fast"
      role="status"
      aria-live="polite"
      aria-label={correct ? "Correct" : "Forgot"}
    >
      <p
        key={cheer}
        className={`animate-practice-bounce-soft text-lg font-bold tracking-wide kanji-font animate-practice-pop ${
          correct ? "text-green-500" : "text-muted-foreground"
        }`}
      >
        {correct ? "🥳" : ""} {cheer}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <SpeakButton word={word} iconType="volume-2" />
        {readings.map((r) => (
          <RomajiBadge key={r} kana={r} />
        ))}
        <p className="text-xl font-bold kanji-font">· {word}</p>
      </div>
      {englishGloss && englishGloss.length > 0 ? (
        <p className="max-w-sm text-sm text-center text-muted-foreground">
          {englishGloss}
        </p>
      ) : null}
      <PracticeButton size="lg" className="max-w-xs" onClick={onNext}>
        Continue
      </PracticeButton>
    </div>
  );
};
