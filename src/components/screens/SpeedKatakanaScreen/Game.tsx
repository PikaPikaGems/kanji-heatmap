import { useEffect, useMemo, useRef, useState } from "react";
import { translateValue, tryConvertRomaji } from "@/lib/wanakana-adapter";
import { Input } from "@/components/ui/input";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { useJsonFetch } from "@/hooks/use-json";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { useKanaInput } from "@/hooks/use-kana-input";
import assetsPaths from "@/lib/assets-paths";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import { ChallengeSetData, SessionStats, SpeedKatakanaSettings } from "./types";
import { randomFontIndex } from "@/hooks/use-change-font";
import { percent, shuffle } from "@/lib/utils";

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
      fontIndex: settings.randomizeFont ? randomFontIndex() : null,
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
  const [flash, setFlash] = useState<{
    english: string;
    key: number;
    skipped: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
  const playCorrect = useCorrectSound();
  const kanaInput = useKanaInput({
    setRawValue: setInputValue,
    onCommit: (raw) => handleChange(raw),
  });

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
    return (
      <>
        <div className="flex items-center justify-center w-full h-full">
          <KaomojiAnimation />
        </div>
      </>
    );
  }

  const current = words[index];

  const playFeedback = () => {
    playCorrect({
      enabled: settings.sound.enabled,
      speak:
        settings.sound.enabled && settings.sound.type === "speak"
          ? speak
          : undefined,
    });
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
      setFlash({
        english: current.english,
        key: flashKeyRef.current,
        skipped: true,
      });
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
        setFlash({
          english: current.english,
          key: flashKeyRef.current,
          skipped: false,
        });
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
    const accuracy = percent(correctCharsRef.current, attempts, 100);

    onProgress(100);
    onComplete({ accuracy, charsPerMinute });
  };

  return (
    <div className="flex flex-col w-full h-full gap-4 mx-auto [@media(min-height:900px)]:justify-center animate-fade-in-fast">
      <EndSession onClick={onEnd} />

      <div className="flex flex-col items-center justify-center flex-1 min-h-0 [@media(min-height:900px)]:flex-none gap-3 text-center">
        <div className="flex items-center justify-center gap-1 pt-4">
          <span className="px-2 text-xs font-bold tabular-nums">
            {index + 1} / {words.length}
          </span>
          <button
            className="text-xs font-bold tracking-wide text-red-500 transition-opacity -translate-y-[0.5px] hover:opacity-70"
            tabIndex={-1}
            onClick={handleSkip}
          >
            {`>>`}
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
          className="w-full text-2xl text-center border-2 z-1000 rounded-2xl h-14"
          onKeyDown={handleKeyDown}
          {...kanaInput}
        />
      </div>
    </div>
  );
};
