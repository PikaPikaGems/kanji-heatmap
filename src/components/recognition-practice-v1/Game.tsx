import { useEffect, useRef, useState } from "react";
import { CircleArrowLeft } from "lucide-react";
import { translateValue } from "@/lib/wanakana-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PracticeButton } from "@/components/ui/practice-button";
import { useSpeak } from "@/hooks/use-jp-speak";
import assetsPaths from "@/lib/assets-paths";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import { PracticeItem, SessionResult, SoundMode } from "./types";
import { isReadingCorrect } from "./match-reading";
import { AnswerFeedbackDrawer } from "./AnswerFeedbackDrawer";

export const Game = ({
  sessionItems,
  blurEnglishGloss,
  sound,
  onProgress,
  onComplete,
  onEnd,
}: {
  sessionItems: PracticeItem[];
  blurEnglishGloss: boolean;
  sound: { enabled: true; type: SoundMode } | { enabled: false };
  onProgress: (progress: number) => void;
  onComplete: (results: SessionResult[]) => void;
  onEnd: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [glossBlurred, setGlossBlurred] = useState(blurEnglishGloss);
  const [feedback, setFeedback] = useState<"correct" | "forgot" | null>(null);
  const resultsRef = useRef<SessionResult[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);
  const suppressNextChangeRef = useRef(false);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);

  const current = sessionItems[index];
  const matched = current
    ? isReadingCorrect(inputValue, current.reading)
    : false;
  const forgotTyped = isForgotCommand(inputValue);

  const speak = useSpeak(current?.word ?? "");

  useEffect(() => {
    setGlossBlurred(blurEnglishGloss);
  }, [blurEnglishGloss, index]);

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

  const playCorrectFeedback = () => {
    if (!sound.enabled) return;
    if (sound.type === "speak") {
      speak();
      return;
    }
    try {
      if (!correctAudioRef.current) {
        correctAudioRef.current = new Audio(
          assetsPaths.SPEED_KATAKANA_CORRECT_SOUND
        );
      }
      correctAudioRef.current.currentTime = 0;
      void correctAudioRef.current.play();
    } catch {
      // ignore playback failures
    }
  };

  const openFeedback = (correct: boolean) => {
    if (feedback != null) return;
    const result: SessionResult = { ...current, correct };
    resultsRef.current = [...resultsRef.current, result];
    if (correct) playCorrectFeedback();
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

  const handleChange = (raw: string) => {
    // Keep "forgot" / "skip" as latin so the command stays typable.
    if (isForgotCommandPrefix(raw)) {
      setInputValue(raw.replace(/\s+/g, ""));
      return;
    }
    setInputValue(translateValue(raw, "hiragana"));
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
    <div className="flex flex-col w-full h-full gap-3 animate-fade-in [@media(pointer:fine)]:justify-center [@media(pointer:fine)]:gap-8 md:justify-center md:gap-8 [@media(min-height:900px)]:justify-center [@media(min-height:900px)]:gap-8">
      <div className="flex flex-col items-center justify-start flex-1 min-h-0 gap-3 px-4 pt-2 text-center [@media(pointer:fine)]:flex-none [@media(pointer:fine)]:justify-center [@media(pointer:fine)]:pt-8 md:flex-none md:justify-center md:pt-8 [@media(min-height:900px)]:flex-none [@media(min-height:900px)]:justify-center [@media(min-height:900px)]:pt-8">
        <div className="flex items-center justify-center [@media(pointer:fine)]:translate-y-4 md:translate-y-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground opacity-70 hover:opacity-100 hover:bg-opacity-0"
            tabIndex={-1}
            onClick={onEnd}
            aria-label="End session"
          >
            <CircleArrowLeft />
          </Button>
        </div>
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
          <p className="text-6xl leading-tight break-all md:text-8xl whitespace-nowrap">
            {current.word}
          </p>
        </div>

        <button
          type="button"
          className={`max-w-sm px-2 py-1 text-xs font-bold tracking-wide transition-all outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 ${glossBlurred ? "blur-[5px] hover:blur-none" : ""
            }`}
          onClick={() => setGlossBlurred((v) => !v)}
          aria-label={
            glossBlurred ? "Reveal English gloss" : "Blur English gloss"
          }
        >
          {current.englishGloss || "—"}
        </button>
      </div>

      <div className="flex flex-col gap-3 shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] [@media(pointer:fine)]:pb-0 md:pb-0">
        <Input
          ref={inputRef}
          value={inputValue}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          disabled={feedback != null}
          aria-label='Type the reading or type "forgot"'
          placeholder='Type the reading or type "forgot"'
          className="relative w-full text-center border-2 rounded-2xl h-14 kanji-font"
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
            suppressNextChangeRef.current = false;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            suppressNextChangeRef.current = true;
            setTimeout(() => {
              suppressNextChangeRef.current = false;
            }, 0);
            handleChange(e.currentTarget.value);
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const composing =
              "isComposing" in e.nativeEvent &&
              (e.nativeEvent as InputEvent).isComposing;
            if (isComposingRef.current || composing) {
              setInputValue(raw);
              return;
            }
            if (suppressNextChangeRef.current) {
              suppressNextChangeRef.current = false;
              return;
            }
            handleChange(raw);
          }}
        />

        <div className="grid grid-cols-2 gap-2">
          <PracticeButton
            variant="danger"
            size="md"
            disabled={feedback != null || matched}
            onClick={() => openFeedback(false)}
          >
            Forgot
          </PracticeButton>
          <PracticeButton
            variant="primary"
            size="md"
            disabled={!matched || feedback != null}
            onClick={() => openFeedback(true)}
          >
            Next
          </PracticeButton>
        </div>
      </div>

      <AnswerFeedbackDrawer
        open={feedback != null}
        correct={feedback === "correct"}
        reading={current.reading}
        word={current.word}
        englishGloss={current.englishGloss}
        onNext={advanceFromFeedback}
      />
    </div>
  );
};
