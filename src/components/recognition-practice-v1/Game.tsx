import { useEffect, useRef, useState } from "react";
import { translateValue } from "@/lib/wanakana-adapter";
import type { FsrsRating } from "engine-contract";
import { Input } from "@/components/ui/input";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useKeepAiVoiceWarm } from "@/hooks/use-ai-voice";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { KanjiPopoverWord } from "@/components/shared-practice/KanjiPopoverWord";
import { useKanaInput } from "@/hooks/use-kana-input";
import {
  BlurredGloss,
  hasForgotKey,
  isForgotKeyEvent,
  ratingForKeyEvent,
} from "@/components/shared-practice";
import type { MasteryGrading } from "@/components/shared-practice";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import { PracticeItem, SessionResult, SoundMode } from "./types";
import { isReadingCorrect } from "./match-reading";
import { AnswerActions } from "./AnswerActions";
import { AnswerFeedback } from "./AnswerFeedback";

export const Game = ({
  sessionItems,
  sound,
  grading,
  onProgress,
  onComplete,
  onEnd,
}: {
  sessionItems: PracticeItem[];
  sound: { enabled: true; type: SoundMode } | { enabled: false };
  /** Mastery game only: rating buttons replace Next, grades go to the engine. */
  grading?: MasteryGrading;
  onProgress: (progress: number) => void;
  onComplete: (results: SessionResult[]) => void;
  onEnd: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "forgot" | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const current = sessionItems[index];
  const matched = current
    ? isReadingCorrect(inputValue, current.reading)
    : false;
  const forgotTyped = isForgotCommand(inputValue);

  const speak = useSpeak(current?.word ?? "");
  // Games keep the AI voice in memory so words after a pause play promptly.
  useKeepAiVoiceWarm();
  const playCorrect = useCorrectSound();

  const handleChange = (raw: string) => {
    // Mastery: "?" is Forgot. The key handler catches it on keyboards; soft
    // keyboards and IME commits ("？") only show up here. Never typed in.
    if (grading && hasForgotKey(raw)) {
      const rest = raw.replace(/[?？]/g, "");
      if (current && !isReadingCorrect(rest, current.reading)) {
        openFeedback(false, "again");
        return;
      }
      setInputValue(rest);
      return;
    }
    // Keep "forgot" / "skip" as latin so the command stays typable.
    if (isForgotCommandPrefix(raw)) {
      setInputValue(raw.replace(/\s+/g, ""));
      return;
    }
    setInputValue(translateValue(raw, "hiragana"));
  };

  const kanaInput = useKanaInput({
    setRawValue: setInputValue,
    onCommit: handleChange,
  });

  // Effect needed: imperative focus after render, when returning from
  // feedback to the answer input.
  useEffect(() => {
    if (feedback == null) {
      inputRef.current?.focus();
    }
  }, [index, feedback]);

  if (!current) {
    return null;
  }

  const openFeedback = (correct: boolean, rating?: FsrsRating) => {
    if (feedback != null) return;
    inputRef.current?.blur();
    if (rating) grading?.onGrade(rating);
    const result: SessionResult = { ...current, correct };
    resultsRef.current = [...resultsRef.current, result];
    if (correct) {
      playCorrect({
        enabled: sound.enabled,
        speak: sound.enabled && sound.type === "speak" ? speak : undefined,
      });
    }
    setFeedback(correct ? "correct" : "forgot");
  };

  const advanceFromFeedback = () => {
    const nextIndex = index + 1;
    const allResults = resultsRef.current;

    setFeedback(null);
    setInputValue("");

    if (nextIndex >= sessionItems.length) {
      onProgress(100);
      onComplete(allResults);
      return;
    }

    // Progress is reported here (the only place index advances) rather than
    // via an effect; the parent resets it to 0 when a session starts.
    onProgress((nextIndex / sessionItems.length) * 100);
    setIndex(nextIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (feedback != null || e.nativeEvent.isComposing) return;

    // Reading Practice: Esc is Forgot.
    if (!grading && e.key === "Escape") {
      e.preventDefault();
      if (!matched) openFeedback(false, "again");
      return;
    }

    // Mastery: "?" is Forgot, as on every rating screen. No reading contains
    // it, so it works from the answer box and is never typed into it.
    if (grading && isForgotKeyEvent(e)) {
      e.preventDefault();
      if (!matched && !e.repeat) openFeedback(false, "again");
      return;
    }

    // Mastery shortcuts: once the reading matches, H / G / E = Hard / Good /
    // Easy and Enter = Good. Matched means the answer is complete, so these
    // letters never belong to it. Typing "forgot" is Forgot too.
    const rating = grading && matched ? ratingForKeyEvent(e) : null;
    if (rating) {
      e.preventDefault();
      // Not the Enter that commits an IME composition (Safari reports it
      // after compositionend, as keyCode 229), and not a held key.
      if (e.repeat || e.nativeEvent.keyCode === 229) return;
      openFeedback(true, rating);
      return;
    }

    if (e.key !== "Enter") return;
    e.preventDefault();

    if (matched) {
      openFeedback(true);
      return;
    }
    if (forgotTyped) {
      openFeedback(false, "again");
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full gap-5 [@media(pointer:fine)]:justify-center [@media(pointer:fine)]:gap-8">
      <EndSession onClick={onEnd} />
      {/*
        Coarse-pointer (touch) layout: keep the prompt + input as a
        top-anchored cluster with a fixed gap. A bottom spacer absorbs
        visual-viewport height changes so the keyboard opening/closing does
        not shove content around. Fine-pointer devices center instead.
      */}
      <div className="flex flex-col items-center px-4 pt-8 text-center shrink-0">
        <div
          className={current.fontIndex === null ? "kanji-font" : ""}
          style={
            current.fontIndex === null
              ? undefined
              : {
                  fontFamily: `var(--jap-font-${current.fontIndex}), "Noto Sans JP", system-ui`,
                }
          }
        >
          <p
            className={`${current.word.length > 4 ? "text-6xl" : current.word.length < 2 ? "text-8xl" : "text-7xl"} ${current.word.length > 4 ? "lg:text-8xl" : "lg:text-9xl xl:text-[10rem]"} leading-tight break-all md:text-8xl whitespace-nowrap`}
          >
            {/* Once answered, each kanji opens its popover (before, its
                readings would give the answer away). */}
            {feedback == null ? (
              current.word
            ) : (
              <KanjiPopoverWord word={current.word} />
            )}
          </p>
        </div>

        <BlurredGloss
          text={current.englishGloss}
          resetKey={index}
          forceReveal={feedback != null}
          className="mt-1 focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0"
        />
      </div>

      <div className="flex flex-col gap-3 shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] [@media(pointer:fine)]:pb-0">
        {feedback == null ? (
          <>
            <Input
              ref={inputRef}
              value={inputValue}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              aria-label='Type the reading or type "forgot"'
              placeholder='Type the reading or type "forgot"'
              className="relative w-full p-0 px-2 mt-2 text-xl text-center border-2 rounded-2xl h-14 focus-visible:ring-offset-0 animate-fade-in"
              onKeyDown={handleKeyDown}
              {...kanaInput}
            />

            <AnswerActions
              matched={matched}
              grading={grading}
              onForgot={() => openFeedback(false, "again")}
              onNext={() => openFeedback(true)}
              onRate={(rating) => openFeedback(true, rating)}
            />
          </>
        ) : (
          <AnswerFeedback
            key={`${index}-${feedback}`}
            correct={feedback === "correct"}
            reading={current.reading}
            word={current.word}
            englishGloss={current.englishGloss}
            onNext={advanceFromFeedback}
          />
        )}
      </div>

      {/*
        Bottom spacer on coarse-pointer devices only. Height changes from the
        on-screen keyboard are absorbed here instead of stretching the gap
        between the gloss and the input.
      */}
      <div
        className="flex-1 min-h-0 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
    </div>
  );
};
