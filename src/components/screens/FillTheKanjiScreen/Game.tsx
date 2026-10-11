import { useMemo } from "react";
import { DefaultErrorFallback } from "@/components/error";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { PracticeButton } from "@/components/ui/practice-button";
import { SpeakButton } from "@/components/common/SpeakButton";
import { EndSession } from "@/components/shared-practice/EndSessionButton";
import { useJsonFetch } from "@/hooks/use-json";
import { useSimilarKanjiMap } from "@/kanji-worker/kanji-worker-hooks";
import { fillTheKanjiSetUrl } from "@/lib/offline-preload";
import { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import { roundRowRange } from "@/lib/fill-the-kanji/rounds";
import {
  buildPuzzle,
  buildTiles,
  plainSentence,
} from "@/lib/fill-the-kanji/puzzle";
import { FillTheKanjiSetFile, rowToItem } from "@/lib/fill-the-kanji/types";
import { shuffle } from "@/lib/utils";
import { SentencePrompt } from "./SentencePrompt";
import { TileGrid } from "./TileGrid";
import { AnswerDrawer } from "./AnswerDrawer";
import { GameCard, useFillTheKanjiGame } from "./use-fill-the-kanji-game";
import { FillTheKanjiSettings, ItemResult } from "./types";

/**
 * Loads the set file and the similar-kanji map, then builds the round's
 * cards: sentences in shuffled order, each with its blanks and 8 tiles.
 */
const useRoundCards = (setId: FillTheKanjiSetId, round: number) => {
  const { data, status } = useJsonFetch<FillTheKanjiSetFile>(
    fillTheKanjiSetUrl(setId)
  );
  const similarMap = useSimilarKanjiMap();

  const cards = useMemo<GameCard[]>(() => {
    if (!data?.data || !similarMap) return [];
    const [start, end] = roundRowRange(setId, round);
    const items = data.data.slice(start, end).map(rowToItem);
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
  }, [data, similarMap, setId, round]);

  return { cards, status };
};

const ignoreEscape = () => {};

export const Game = ({
  setId,
  round,
  settings,
  onProgress,
  onComplete,
  onEnd,
}: {
  setId: FillTheKanjiSetId;
  round: number;
  settings: FillTheKanjiSettings;
  onProgress: (progress: number) => void;
  onComplete: (results: ItemResult[]) => void;
  onEnd: () => void;
}) => {
  const { cards, status } = useRoundCards(setId, round);
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
            <SpeakButton word={plainSentence(item.jp)} iconType="headphones" />
            <p className="max-w-md text-xs font-bold tracking-wide text-left">
              {item.en}
            </p>
          </div>
        </div>
      </div>

      {/* Stays mounted under the answer drawer so nothing shifts on submit. */}
      <div className="shrink-0 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-2 border-dashed rounded-t-3xl">
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

      <AnswerDrawer answer={game.answer} onContinue={game.advance} />
    </div>
  );
};
