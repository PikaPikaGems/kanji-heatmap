import { useEffect, useMemo, useRef, useState } from "react";
import { translateValue, tryConvertRomaji } from "@/lib/wanakana-adapter";
import { Input } from "@/components/ui/input";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { useJsonFetch } from "@/hooks/use-json";
import { useSpeak } from "@/hooks/use-jp-speak";
import assetsPaths from "@/lib/assets-paths";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import {
  ChallengeSetData,
  SessionStats,
  SpeedKatakanaSettings,
} from "./types";
import { NUMBER_OF_FONTS } from "@/hooks/use-change-font";
import { shuffle } from "@/lib/utils";

type GameWord = {
  katakana: string;
  english: string;
  /** Index into the --jap-font-* CSS vars, or null to use the default font. */
  fontIndex: number | null;
};


export const Game = ({
  settings,
  onProgress,
  onComplete,
  onEnd,
}: {
  settings: SpeedKatakanaSettings;
  onProgress: (progress: number) => void;
  onComplete: (stats: SessionStats) => void;
  onEnd: () => void;
}) => {
  const path = `${assetsPaths.SPEED_KATAKANA_CHALLENGE_SET}${settings.challengeSet}.json`;
  const { data, status } = useJsonFetch<ChallengeSetData>(path);

  const words = useMemo<GameWord[]>(() => {
    if (!data?.data) return [];
    const list: GameWord[] = data.data.map(([katakana, english]) => ({
      katakana,
      english,
      fontIndex: settings.randomizeFont
        ? Math.floor(Math.random() * NUMBER_OF_FONTS)
        : null,
    }));
    const ordered = settings.randomizeOrder ? shuffle(list) : list;
    return ordered.slice(0, settings.wordCount);
  }, [
    data,
    settings.randomizeFont,
    settings.randomizeOrder,
    settings.wordCount,
  ]);

  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [flash, setFlash] = useState<{ english: string; key: number; skipped: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // True while an IME (e.g. iOS Japanese romaji/kana keyboard) is mid-composition.
  // During composition we must not re-transform the value, or iOS Safari renders
  // the committed character twice. See onChange handler below.
  const isComposingRef = useRef(false);
  // Set right after compositionend so the redundant trailing change event that
  // desktop browsers fire isn't processed a second time. Cleared on a macrotask
  // so it only ever swallows that one synchronous follow-up event.
  const suppressNextChangeRef = useRef(false);

  // Stats live in refs so per-keystroke bookkeeping doesn't trigger re-renders.
  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);
  const errorsRef = useRef(0);
  const inErrorStateRef = useRef(false);
  const flashKeyRef = useRef(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sound feedback. useSpeak is a hook, so it must run before any early return;
  // an empty word is harmless while the set is still loading.
  const speak = useSpeak(words[index]?.katakana ?? "");
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);

  // Keep the input focused as words advance and once the set has loaded.
  useEffect(() => {
    inputRef.current?.focus();
  }, [index, words.length]);

  useEffect(() => {
    const timer = flashTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (status === "error") {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <DefaultErrorFallback message="Couldn't load this challenge set." />
      </div>
    );
  }

  if (status !== "success" || words.length === 0) {
    return <>
      <div className="flex items-center justify-center w-full h-full">
        <KaomojiAnimation />
      </div>
    </>;
  }

  const current = words[index];

  const playFeedback = () => {
    if (!settings.sound.enabled) return;
    if (settings.sound.type === "speak") {
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
      // ignore audio playback failures
    }
  };

  const advance = () => {
    const nextIndex = index + 1;
    if (nextIndex >= words.length) {
      finish();
      return;
    }
    setIndex(nextIndex);
    setInputValue("");
    onProgress((nextIndex / words.length) * 100);
  };

  const handleSkip = () => {
    // Skipping counts against accuracy so it isn't a free pass.
    errorsRef.current += 1;
    inErrorStateRef.current = false;
    if (!settings.displayEnglish) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashKeyRef.current += 1;
      setFlash({ english: current.english, key: flashKeyRef.current, skipped: true });
      flashTimerRef.current = setTimeout(() => setFlash(null), 1200);
    }
    advance();
    inputRef.current?.focus();
  };

  const handleChange = (raw: string) => {
    if (startTimeRef.current === null) startTimeRef.current = Date.now();

    // Keep "skip" / "forgot" as latin so the keyboard command stays typable.
    if (isForgotCommandPrefix(raw) || isForgotCommand(raw)) {
      setInputValue(raw.replace(/\s+/g, ""));
      return;
    }

    const converted = translateValue(raw, "katakana");
    const target = current.katakana;
    // Compare in romaji space so the long-vowel mark ー matches a doubled vowel
    // too (e.g. typing "paasento" → パアセント still clears パーセント).
    const targetRomaji = tryConvertRomaji(target);

    // iOS autocomplete / the IME suggestion bar appends a trailing space (often
    // the full-width U+3000) to the inserted word. Strip all whitespace so a
    // correct-but-spaced commit like the full-width-spaced word still matches.
    // JS \s already covers the full-width U+3000 and other Unicode spaces.
    const cleaned = converted.replace(/\s+/g, "");

    // Ignore a trailing partial romaji tail (e.g. "k" before "ka" → "カ") so
    // mid-syllable typing isn't mistaken for an error.
    const committedKana = cleaned.replace(/[a-zA-Z]+$/, "");
    const committedRomaji = tryConvertRomaji(committedKana);
    const isOnTrack = targetRomaji.startsWith(committedRomaji);
    if (!isOnTrack && !inErrorStateRef.current) {
      errorsRef.current += 1;
    }
    inErrorStateRef.current = !isOnTrack;

    if (tryConvertRomaji(cleaned) === targetRomaji) {
      correctCharsRef.current += target.length;
      inErrorStateRef.current = false;
      playFeedback();
      if (!settings.displayEnglish) {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashKeyRef.current += 1;
        setFlash({ english: current.english, key: flashKeyRef.current, skipped: false });
        flashTimerRef.current = setTimeout(() => setFlash(null), 1200);
      }
      advance();
      return;
    }

    setInputValue(converted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Escape") {
      e.preventDefault();
      handleSkip();
      return;
    }

    if (e.key === "Enter" && isForgotCommand(inputValue)) {
      e.preventDefault();
      handleSkip();
    }
  };

  const finish = () => {
    const elapsedMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;
    const minutes = elapsedMs / 60000;
    const charsPerMinute =
      minutes > 0 ? Math.round(correctCharsRef.current / minutes) : 0;

    const attempts = correctCharsRef.current + errorsRef.current;
    const accuracy =
      attempts > 0
        ? Math.round((100 * correctCharsRef.current) / attempts)
        : 100;

    onProgress(100);
    onComplete({ accuracy, charsPerMinute });
  };

  return (
    <div className="flex flex-col w-full h-full max-w-lg gap-4 mx-auto [@media(min-height:900px)]:justify-center  animate-fade-in-fast">
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 [@media(min-height:900px)]:flex-none gap-3 text-center">
        <div className="pt-4">
          <button
            className="mx-3 text-xs font-bold tracking-wide text-red-500 underline transition-opacity decoration-dotted underline-offset-4 hover:opacity-70"
            tabIndex={-1}
            onClick={handleSkip}
          >
            {`Skip this word`}
          </button>
          ·
          <span className="px-3 pt-6 pb-1 text-xs font-bold rounded-full">
            {index + 1} / {words.length}
          </span>

          <span>·</span>
          <button
            className="mx-3 text-xs font-bold tracking-wide underline transition-opacity decoration-dotted underline-offset-4 hover:opacity-70 text-muted-foreground"
            tabIndex={-1}
            onClick={onEnd}
          >
            {`End Session`}
          </button>
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
          <p className="text-5xl font-bold leading-tight break-all md:text-7xl">
            {current.katakana}
          </p>
        </div>
        {settings.displayEnglish && (
          <p className="pb-6 text-sm font-bold tracking-wide uppercase text-muted-foreground">
            {current.english}
          </p>
        )}
        <div className="flex flex-col items-center gap-1 pb-4">
          <div className="h-4">
            {!settings.displayEnglish && flash && (
              <span
                key={flash.key}
                className={`text-xs font-bold tracking-wide uppercase animate-english-flash ${flash.skipped ? "text-muted-foreground" : "text-green-500"}`}
              >
                {flash.skipped ? "→" : "✓"} {flash.english}
              </span>
            )}
          </div>
        </div>

      </div>

      <div className="shrink-0 pl-3 pr-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Input
          ref={inputRef}
          value={inputValue}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label='Type romaji or type "skip"'
          placeholder='Type romaji or "skip"'
          className="w-full text-2xl text-center border-2 z-1000 rounded-2xl h-14 kanji-font"
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true;
            // A new composition means any pending suppression is stale.
            suppressNextChangeRef.current = false;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            // iOS commits hiragana and fires no trailing change event, so the
            // conversion + match logic must run here or the value stays raw
            // hiragana. Desktop *does* fire a trailing change, so suppress that
            // one duplicate (cleared on a macrotask, after it has fired).
            suppressNextChangeRef.current = true;
            setTimeout(() => {
              suppressNextChangeRef.current = false;
            }, 0);
            handleChange(e.currentTarget.value);
          }}
          onChange={(e) => {
            const raw = e.target.value;
            // While an IME is composing, keep the field exactly as the IME has
            // it (no romaji→katakana transform). Transforming mid-composition
            // makes iOS Safari duplicate the committed character; the real
            // conversion runs in onCompositionEnd instead.
            // nativeEvent is typed as Event; isComposing lives on InputEvent.
            const composing =
              "isComposing" in e.nativeEvent &&
              (e.nativeEvent as InputEvent).isComposing;
            if (isComposingRef.current || composing) {
              setInputValue(raw);
              return;
            }
            // Swallow the redundant change desktop fires right after commit.
            if (suppressNextChangeRef.current) {
              suppressNextChangeRef.current = false;
              return;
            }
            handleChange(raw);
          }}
        />
      </div>
    </div>
  );
};
