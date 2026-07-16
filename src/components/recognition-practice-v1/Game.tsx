import { useEffect, useRef, useState } from "react";
import { CircleArrowLeft } from "lucide-react";
import { translateValue } from "@/lib/wanakana-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PracticeButton } from "@/components/ui/practice-button";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { useKanaInput } from "@/hooks/use-kana-input";
import { BlurredGloss } from "@/components/shared-practice";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import { PracticeItem, SessionResult, SoundMode } from "./types";
import { isReadingCorrect } from "./match-reading";
import { AnswerFeedback } from "./AnswerFeedback";

export const Game = ({
  sessionItems,
  sound,
  onProgress,
  onComplete,
  onEnd,
}: {
  sessionItems: PracticeItem[];
  sound: { enabled: true; type: SoundMode } | { enabled: false };
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
  const playCorrect = useCorrectSound();

  const handleChange = (raw: string) => {
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

  useEffect(() => {
    if (feedback == null) {
      inputRef.current?.focus();
    }
  }, [index, feedback]);

  useEffect(() => {
    onProgress(
      sessionItems.length === 0 ? 0 : (index / sessionItems.length) * 100
    );
  }, [index, onProgress, sessionItems.length]);

  if (!current) {
    return null;
  }

  const openFeedback = (correct: boolean) => {
    if (feedback != null) return;
    inputRef.current?.blur();
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

    setIndex(nextIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (feedback != null || e.nativeEvent.isComposing) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (!matched) openFeedback(false);
      return;
    }

    if (e.key !== "Enter") return;
    e.preventDefault();

    if (matched) {
      openFeedback(true);
      return;
    }
    if (forgotTyped) {
      openFeedback(false);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full gap-5 [@media(pointer:fine)]:justify-center [@media(pointer:fine)]:gap-8 md:justify-center md:gap-8 [@media(min-height:900px)]:justify-center [@media(min-height:900px)]:gap-8">
      <Button
        variant="ghost"
        size="icon"
        className="absolute z-10 top-1 left-1 text-foreground opacity-70 hover:opacity-100 hover:bg-opacity-0"
        tabIndex={-1}
        onClick={onEnd}
        aria-label="End session"
      >
        <CircleArrowLeft />
      </Button>
      {/*
        Touch layout: keep the prompt + input as a top-anchored cluster with a
        fixed gap. A bottom spacer absorbs visual-viewport height changes so
        the keyboard opening/closing does not shove content around.
      */}
      <div className="flex flex-col items-center shrink-0 px-4 pt-8 text-center [@media(pointer:fine)]:pt-8 md:pt-8 [@media(min-height:900px)]:pt-8">
        <div
          className={current.fontIndex === null ? "kanji-font" : undefined}
          style={
            current.fontIndex === null
              ? undefined
              : {
                  fontFamily: `var(--jap-font-${current.fontIndex}), "Noto Sans JP", system-ui`,
                }
          }
        >
          <p
            className={`${current.word.length > 4 ? "text-6xl" : current.word.length < 2 ? "text-8xl" : "text-7xl"} leading-tight break-all md:text-8xl whitespace-nowrap`}
          >
            {current.word}
          </p>
        </div>

        <BlurredGloss
          text={current.englishGloss}
          resetKey={index}
          forceReveal={feedback != null}
          className="focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0"
        />
      </div>

      <div className="flex flex-col gap-3 shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] [@media(pointer:fine)]:pb-0 md:pb-0">
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
              className="relative w-full p-0 mt-2 text-xl text-center border-2 rounded-2xl h-14 focus-visible:ring-offset-0 animate-fade-in"
              onKeyDown={handleKeyDown}
              {...kanaInput}
            />

            <div className="grid grid-cols-2 gap-2">
              <PracticeButton
                variant="danger"
                size="md"
                disabled={matched}
                onClick={() => openFeedback(false)}
              >
                Forgot
              </PracticeButton>
              <PracticeButton
                variant="primary"
                size="md"
                disabled={!matched}
                onClick={() => openFeedback(true)}
              >
                Next
              </PracticeButton>
            </div>
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
        Bottom spacer on coarse-pointer / short screens only. Height changes
        from the on-screen keyboard are absorbed here instead of stretching
        the gap between the gloss and the input.
      */}
      <div
        className="flex-1 min-h-0 [@media(pointer:fine)]:hidden md:hidden [@media(min-height:900px)]:hidden"
        aria-hidden="true"
      />
    </div>
  );
};
