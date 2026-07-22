import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { useJsonFetch } from "@/hooks/use-json";
import assetsPaths from "@/lib/assets-paths";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import { ChallengeSetData, SessionStats, SpeedKatakanaSettings } from "./types";
import { randomFontIndex } from "@/hooks/use-change-font";
import { shuffle } from "@/lib/utils";
import { GameWord, useSpeedKatakanaGame } from "./use-speed-katakana-game";
import { FlashFeedback } from "./FlashFeedback";

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

  const game = useSpeedKatakanaGame({
    words,
    settings,
    onProgress,
    onComplete,
  });

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

  const current = game.current;

  return (
    <div className="flex flex-col w-full h-full gap-4 mx-auto [@media(min-height:700px)]:justify-center animate-fade-in-fast">
      <EndSession onClick={onEnd} />

      <div className="flex flex-col items-center justify-center flex-1 min-h-0 [@media(min-height:700px)]:flex-none gap-3 text-center">
        <div className="flex items-center justify-center gap-1 pt-4">
          <span className="px-2 text-xs font-bold tabular-nums">
            {game.index + 1} / {game.wordCount}
          </span>
          <button
            className="text-xs font-bold tracking-wide text-red-500 transition-opacity -translate-y-[0.5px] hover:opacity-70"
            tabIndex={-1}
            onClick={game.handleSkip}
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
          <FlashFeedback flash={settings.displayEnglish ? null : game.flash} />
        </div>
      </div>

      <div className="shrink-0 pl-3 pr-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Input
          ref={game.inputRef}
          value={game.inputValue}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label='Type romaji or type "skip"'
          placeholder='Type romaji or "skip"'
          className="w-full text-2xl text-center border-2 z-1000 rounded-2xl h-14"
          onKeyDown={game.handleKeyDown}
          {...game.kanaInput}
        />
      </div>
    </div>
  );
};
