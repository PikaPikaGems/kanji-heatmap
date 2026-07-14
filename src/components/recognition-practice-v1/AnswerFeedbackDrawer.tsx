import { useEffect, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { PracticeButton } from "@/components/ui/practice-button";
import { RomajiBadge } from "@/components/dependent/kana/RomajiBadge";
import { SpeakButton } from "@/components/common/SpeakButton";
import { pickCorrectCheer, pickForgotCheer } from "@/lib/practice-cheers";

export const AnswerFeedbackDrawer = ({
  open,
  correct,
  reading,
  word,
  englishGloss,
  onNext,
}: {
  open: boolean;
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

  const [cheer, setCheer] = useState("");

  useEffect(() => {
    if (!open) return;
    setCheer(correct ? pickCorrectCheer() : pickForgotCheer());
  }, [open, correct]);

  useEffect(() => {
    if (!open) return;

    // Don't treat the Enter that *opened* this drawer as "Continue".
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
  }, [open, onNext]);

  return (
    <DrawerPrimitive.Root
      open={open}
      dismissible={false}
      // Non-modal: practice UI is already viewport-pinned; avoids body
      // scrollbar lock/unlock that causes a delayed horizontal layout shift.
      modal={false}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DrawerPrimitive.Content
          className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-2 border-t-4 [border-top-style:dashed] bg-background outline-none ${correct ? "border-green-500/50" : ""
            }`}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DrawerPrimitive.Title className="sr-only">
            {correct ? "Correct" : "Forgot"}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            Reading feedback for {word}
          </DrawerPrimitive.Description>

          <div className="flex flex-col items-center gap-3 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p
              key={cheer}
              className={`animate-practice-bounce-soft  text-lg font-bold tracking-wide kanji-font animate-practice-pop ${correct ? "text-green-500" : "text-muted-foreground"
                }`}
            >
              {correct ? "🥳" : ""} {cheer}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1 animate-fade-in-fast">
              <SpeakButton word={word} iconType="volume-2" />
              {readings.map((r) => (
                <RomajiBadge key={r} kana={r} />
              ))}
              <p className="text-xl font-bold kanji-font">· {word}</p>
            </div>
            {englishGloss && englishGloss.length > 0 ? (
              <p className="max-w-sm text-sm text-center text-muted-foreground animate-fade-in-fast">
                {englishGloss}
              </p>
            ) : null}
            <PracticeButton size="lg" className="max-w-xs" onClick={onNext}>
              Continue
            </PracticeButton>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};
