import { useMemo } from "react";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { PracticeButton } from "@/components/ui/practice-button";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import { useJsonFetch } from "@/hooks/use-json";
import { useSimilarKanjiMap } from "@/kanji-worker/kanji-worker-hooks";
import { fillTheKanjiChunkUrl } from "@/lib/offline-preload";
import { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import {
  chunkOfRound,
  chunkRowStart,
  roundRowRange,
} from "@/lib/fill-the-kanji/rounds";
import { buildPuzzle, buildTiles } from "@/lib/fill-the-kanji/puzzle";
import { FillTheKanjiSetFile, rowToItem } from "@/lib/fill-the-kanji/types";
import { shuffle } from "@/lib/utils";
import { SentencePrompt } from "./SentencePrompt";
import { TileGrid } from "./TileGrid";
import { AnswerDrawer } from "./AnswerDrawer";
import { SpeakButtons } from "./SpeakButtons";
import { GameCard, useFillTheKanjiGame } from "./use-fill-the-kanji-game";
import { FillTheKanjiSettings, ItemResult } from "./types";

/**
 * Loads the set chunk holding this round (not the whole set) and the
 * similar-kanji map, then builds the round's cards: sentences in shuffled
 * order, each with its blanks and 8 tiles. `onlyJp` keeps just those
 * sentences (retrying mistakes).
 */
const useRoundCards = (
  setId: FillTheKanjiSetId,
  round: number,
  onlyJp: string[] | null
) => {
  const chunk = chunkOfRound(round);
  const { data, status } = useJsonFetch<FillTheKanjiSetFile>(
    fillTheKanjiChunkUrl(setId, chunk)
  );
  const similarMap = useSimilarKanjiMap();

  const cards = useMemo<GameCard[]>(() => {
    if (!data?.data || !similarMap) return [];
    const [start, end] = roundRowRange(setId, round);
    const offset = chunkRowStart(chunk);
    const items = data.data
      .slice(start - offset, end - offset)
      .map(rowToItem)
      .filter((item) => onlyJp == null || onlyJp.includes(item.jp));
    const puzzles = items.map((item) => buildPuzzle(item.jp));
    const roundKanji = [...new Set(puzzles.flatMap((p) => p.sentenceKanji))];
    const getSimilars = (k: string) => similarMap[k] ?? [];

    return shuffle(
      items.map((item, i) => ({
        item,
        puzzle: puzzles[i],
        tiles: buildTiles({
          answers: puzzles[i].answers,
          sentenceKanji: puzzles[i].sentenceKanji,
          getSimilars,
          fallbackPool: roundKanji,
        }),
      }))
    );
  }, [data, similarMap, setId, round, chunk, onlyJp]);

  return { cards, status };
};

const ignoreEscape = () => {};

export const Game = ({
  setId,
  round,
  onlyJp,
  settings,
  onProgress,
  onComplete,
  onEnd,
}: {
  setId: FillTheKanjiSetId;
  round: number;
  /** Only these sentences (retrying mistakes); null plays the whole round. */
  onlyJp: string[] | null;
  settings: FillTheKanjiSettings;
  onProgress: (progress: number) => void;
  onComplete: (results: ItemResult[]) => void;
  onEnd: () => void;
}) => {
  const { cards, status } = useRoundCards(setId, round, onlyJp);
  const game = useFillTheKanjiGame({
    cards,
    sound: settings.sound,
    readAloudOnShow: settings.readAloudOnShow ?? false,
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

  const { card } = game;
  if (!card) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <KaomojiAnimation />
      </div>
    );
  }

  const { item, puzzle, tiles } = card;
  const revealed = game.feedback != null;

  return (
    <div className="relative flex flex-col w-full h-full animate-fade-in-fast">
      {/* Escape ends the round, except while the answer drawer is open:
          there it closes the notes popover instead. The drawer's overlay
          covers this button anyway. */}
      <EndSession onClick={revealed ? ignoreEscape : onEnd} />

      <div className="flex-1 min-h-0 px-4 overflow-y-auto">
        <div className="flex flex-col items-center justify-center max-w-2xl min-h-full gap-4 py-10 mx-auto text-center">
          {item.emoji && (
            <p className="text-7xl leading-none" aria-hidden>
              {item.emoji}
            </p>
          )}

          <SentencePrompt
            // Fresh blanks per sentence, so the last answer's green/red
            // doesn't transition into the new sentence's blanks.
            key={game.index}
            puzzle={puzzle}
            filled={game.filled}
            cursor={game.cursor}
            revealed={revealed}
            onBlankClick={game.selectBlank}
          />

          <div className="flex items-center justify-center gap-2 px-2">
            <SpeakButtons speech={game.speech} />
            <p className="max-w-md text-xs font-bold tracking-wide text-left">
              {item.en}
            </p>
          </div>
        </div>
      </div>

      {/* Stays mounted under the answer drawer so nothing shifts on submit. */}
      <div className="shrink-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
        <div className="flex flex-col w-full max-w-md gap-3 mx-auto">
          <TileGrid tiles={tiles} onPick={game.pickTile} />
          <div className="grid grid-cols-2 gap-2">
            <PracticeButton
              variant="danger"
              size="md"
              disabled={game.allFilled || revealed}
              onClick={game.forgot}
            >
              Forgot
            </PracticeButton>
            <PracticeButton
              variant="primary"
              size="md"
              disabled={!game.allFilled || revealed}
              onClick={game.submit}
            >
              Next
            </PracticeButton>
          </div>
        </div>
      </div>

      <AnswerDrawer
        answer={game.answer}
        speech={game.speech}
        onContinue={game.advance}
      />
    </div>
  );
};
