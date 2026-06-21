import { useEffect, useMemo, useRef, useState } from "react";
import { translateValue, tryConvertRomaji } from "@/lib/wanakana-adapter";
import { Input } from "@/components/ui/input";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { useJsonFetch } from "@/hooks/use-json";
import { useSpeak } from "@/hooks/use-jp-speak";
import assetsPaths from "@/lib/assets-paths";
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

    const converted = translateValue(raw, "katakana");
    const target = current.katakana;
    // Compare in romaji space so the long-vowel mark ー matches a doubled vowel
    // too (e.g. typing "paasento" → パアセント still clears パーセント).
    const targetRomaji = tryConvertRomaji(target);

    // Ignore a trailing partial romaji tail (e.g. "k" before "ka" → "カ") so
    // mid-syllable typing isn't mistaken for an error.
    const committedKana = converted.replace(/[a-zA-Z]+$/, "");
    const committedRomaji = tryConvertRomaji(committedKana);
    const isOnTrack = targetRomaji.startsWith(committedRomaji);
    if (!isOnTrack && !inErrorStateRef.current) {
      errorsRef.current += 1;
    }
    inErrorStateRef.current = !isOnTrack;

    if (tryConvertRomaji(converted) === targetRomaji) {
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
    <div className="flex flex-col w-full h-full max-w-lg gap-4 mx-auto [@media(min-height:900px)]:justify-center">
      <div className="flex flex-col items-center justify-center flex-1 [@media(min-height:900px)]:flex-none gap-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="px-3 py-1 text-xs font-bold rounded-full">
            {index + 1} / {words.length}
          </span>
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
          <p className="font-bold leading-tight break-all text-7xl">
            {current.katakana}
          </p>
        </div>
        {settings.displayEnglish && (
          <p className="text-sm font-bold tracking-wide uppercase text-muted-foreground">
            {current.english}
          </p>
        )}
        <div className="mt-3 mb-6 ">
          <button
            className="mx-3 text-xs font-bold tracking-wide text-red-500 underline transition-opacity decoration-dotted underline-offset-4 hover:opacity-70"
            tabIndex={-1}
            onClick={handleSkip}
          >
            {`Skip this`}
          </button>
          <span>⚡️</span>
          <button
            className="mx-3 text-xs font-bold tracking-wide underline transition-opacity decoration-dotted underline-offset-4 hover:opacity-70 text-muted-foreground"
            tabIndex={-1}
            onClick={onEnd}
          >
            {`End Session`}
          </button>
        </div>
      </div>

      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] md:pb-0">
        <Input
          ref={inputRef}
          value={inputValue}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Type the katakana"
          placeholder="Type romaji here"
          className="w-full text-2xl text-center border-2 rounded-2xl h-14 kanji-font"
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
};
