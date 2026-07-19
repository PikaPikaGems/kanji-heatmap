import { useEffect, useRef, useState } from "react";
import { translateValue } from "@/lib/wanakana-adapter";
import { isMatch, isOnTrack } from "@/lib/speed-katakana-match";
import { useSpeak } from "@/hooks/use-jp-speak";
import { useCorrectSound } from "@/hooks/use-correct-sound";
import { useKanaInput } from "@/hooks/use-kana-input";
import {
  isForgotCommand,
  isForgotCommandPrefix,
} from "@/lib/practice-commands";
import { percent } from "@/lib/utils";
import { SessionStats, SpeedKatakanaSettings } from "./types";

export type GameWord = {
  katakana: string;
  english: string;
  /** Index into the --jap-font-* CSS vars, or null to use the default font. */
  fontIndex: number | null;
};

export type FlashState = {
  english: string;
  key: number;
  skipped: boolean;
};

export const FLASH_DURATION_MS = 1200;

/**
 * The Speed Katakana game loop: word cursor, kana input handling, correct/skip
 * accounting, the english-gloss flash, and end-of-session stats. The Game
 * component stays responsible for fetching the word list and rendering.
 */
export const useSpeedKatakanaGame = ({
  words,
  settings,
  onProgress,
  onComplete,
}: {
  words: GameWord[];
  settings: SpeedKatakanaSettings;
  onProgress: (progress: number) => void;
  onComplete: (stats: SessionStats) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [flash, setFlash] = useState<FlashState | null>(null);
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

  // Effect needed: clears any pending flash timeout on unmount.
  useEffect(() => {
    const timer = flashTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

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

  // Briefly reveal the english gloss (only when it isn't already displayed).
  const showFlash = (skipped: boolean) => {
    if (settings.displayEnglish) {
      return;
    }
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashKeyRef.current += 1;
    setFlash({
      english: current.english,
      key: flashKeyRef.current,
      skipped,
    });
    flashTimerRef.current = setTimeout(() => setFlash(null), FLASH_DURATION_MS);
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
    showFlash(true);
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

    // Matching happens in romaji space (see lib/speed-katakana-match) so the
    // long-vowel mark, IME whitespace, and mid-syllable typing behave.
    const onTrack = isOnTrack(converted, target);
    if (!onTrack && !inErrorStateRef.current) {
      errorsRef.current += 1;
    }
    inErrorStateRef.current = !onTrack;

    if (isMatch(converted, target)) {
      correctCharsRef.current += target.length;
      inErrorStateRef.current = false;
      playFeedback();
      showFlash(false);
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

  return {
    index,
    current,
    wordCount: words.length,
    inputValue,
    flash,
    inputRef,
    kanaInput,
    handleKeyDown,
    handleSkip,
  };
};
