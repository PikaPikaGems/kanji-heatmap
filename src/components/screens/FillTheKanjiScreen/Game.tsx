import { useEffect, useMemo, useState } from "react";
import { DefaultErrorFallback } from "@/components/error";
import { NOT_CACHED_OFFLINE_MESSAGE } from "@/components/error/DefaultOfflineFallback";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { PracticeButton } from "@/components/ui/practice-button";
import { GameHeader } from "@/components/shared-practice/GameHeader";
import { useNetworkState } from "@/hooks/use-network-state";
import { useTapGuard } from "@/hooks/use-tap-guard";
import {
  loadSimilarLookup,
  peekSimilarLookup,
} from "@/kanji-worker/similar-cache";
import { loadChunk, peekChunk } from "@/lib/fill-the-kanji/chunk-cache";
import { fillTheKanjiChunkUrl } from "@/lib/offline-preload";
import { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import {
  chunkOfBatch,
  chunkRowStart,
  batchRowRange,
  levelOfBatch,
  positionInLevel,
  setLabel,
} from "@/lib/fill-the-kanji/batches";
import {
  buildPuzzle,
  plainSentence,
  buildTiles,
  DEFAULT_TILE_COUNT,
  isTileCount,
  TileCount,
} from "@/lib/fill-the-kanji/puzzle";
import { FillTheKanjiSetFile, rowToItem } from "@/lib/fill-the-kanji/types";
import { isKanji, shuffle } from "@/lib/utils";
import { SentencePrompt } from "./SentencePrompt";
import { TileGrid } from "./TileGrid";
import { AnswerDrawer } from "./AnswerDrawer";
import { SpeakButtons } from "./SpeakButtons";
import { GameCard, useFillTheKanjiGame } from "./use-fill-the-kanji-game";
import { FillTheKanjiSettings, ItemResult } from "./types";

/** The batch's rows: its slice of the chunk, numbered in file order. */
const batchRows = (
  file: FillTheKanjiSetFile,
  setId: FillTheKanjiSetId,
  batch: number
) => {
  const [start, end] = batchRowRange(setId, batch);
  const offset = chunkRowStart(chunkOfBatch(batch));
  return file.data.slice(start - offset, end - offset).map(rowToItem);
};

/** Every kanji in the batch's sentences: the tiles' answers come from these. */
const batchKanji = (
  file: FillTheKanjiSetFile,
  setId: FillTheKanjiSetId,
  batch: number
) => [
  ...new Set(
    batchRows(file, setId, batch).flatMap((item) =>
      Array.from(plainSentence(item.jp)).filter(isKanji)
    )
  ),
];

type GetSimilars = (kanji: string) => string[];

/** The batch's chunk and similar kanji: loading, failed, or ready. */
type BatchLoad =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: FillTheKanjiSetFile; getSimilars: GetSimilars };

/** Ready right away when this visit already loaded both (retry, next batch). */
const cachedBatchLoad = (
  url: string,
  setId: FillTheKanjiSetId,
  batch: number
): BatchLoad => {
  const file = peekChunk(url);
  const getSimilars = file && peekSimilarLookup(batchKanji(file, setId, batch));
  return file && getSimilars
    ? { status: "ready", file, getSimilars }
    : { status: "loading" };
};

/**
 * Loads the set chunk holding this batch (not the whole set), then asks the
 * kanji worker for the similar kanji of just this batch's kanji. Both are kept
 * for the visit, so a retry or the next batch skips the spinner. `retry`
 * tries again after a failure.
 */
const useBatchLoad = (setId: FillTheKanjiSetId, batch: number) => {
  const url = fillTheKanjiChunkUrl(setId, chunkOfBatch(batch));
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<BatchLoad>(() =>
    cachedBatchLoad(url, setId, batch)
  );

  // Effect needed: fetching the chunk and asking the worker are async calls
  // to external systems; the cancelled flag drops a result after unmount.
  useEffect(() => {
    if (cachedBatchLoad(url, setId, batch).status === "ready") return;
    let cancelled = false;
    loadChunk(url)
      .then(async (file) => ({
        file,
        getSimilars: await loadSimilarLookup(batchKanji(file, setId, batch)),
      }))
      .then(({ file, getSimilars }) => {
        if (!cancelled) setLoad({ status: "ready", file, getSimilars });
      })
      .catch(() => {
        if (!cancelled) setLoad({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [url, setId, batch, attempt]);

  const retry = () => {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  return { load, retry };
};

/**
 * Builds the batch's cards: sentences in shuffled order, each with its blanks
 * and 8 or 12 tiles. `onlyJp` keeps just those sentences (retrying mistakes).
 */
const buildCards = (
  file: FillTheKanjiSetFile,
  getSimilars: GetSimilars,
  setId: FillTheKanjiSetId,
  batch: number,
  onlyJp: string[] | null,
  tileCount: TileCount
): GameCard[] => {
  const sourceOf = (sentence: number) =>
    `${setLabel(setId)} · Challenge ${levelOfBatch(batch)} · Batch ${positionInLevel(batch)} · Sentence ${sentence}`;
  // Numbered in file order (1-based), before retries filter some out.
  const rows = batchRows(file, setId, batch)
    .map((item, i) => ({ item, source: sourceOf(i + 1) }))
    .filter(({ item }) => onlyJp == null || onlyJp.includes(item.jp));
  const puzzles = rows.map(({ item }) => buildPuzzle(item.jp, tileCount));
  const allKanji = [...new Set(puzzles.flatMap((p) => p.sentenceKanji))];

  return shuffle(
    rows.map(({ item, source }, i) => ({
      item,
      source,
      puzzle: puzzles[i],
      tiles: buildTiles({
        answers: puzzles[i].answers,
        sentenceKanji: puzzles[i].sentenceKanji,
        getSimilars,
        fallbackPool: allKanji,
        tileCount,
      }),
    }))
  );
};

/** Online: "Couldn't load". Offline: the same "not cached yet" as other pages. */
const LoadError = ({
  onRetry,
  onBack,
}: {
  onRetry: () => void;
  onBack: () => void;
}) => {
  const { online } = useNetworkState();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <DefaultErrorFallback
        message={
          online
            ? "Couldn't load this challenge set."
            : NOT_CACHED_OFFLINE_MESSAGE
        }
        actions={
          // Stacked like the end screen: the main action, then a quiet way out.
          <div className="flex flex-col w-full max-w-xs gap-1">
            <PracticeButton size="lg" onClick={onRetry}>
              Try again
            </PracticeButton>
            <PracticeButton variant="ghost" size="md" onClick={onBack}>
              Back
            </PracticeButton>
          </div>
        }
      />
    </div>
  );
};

/**
 * Forgot and Next. Remounted for each card, so for its first 0.5 s taps do
 * nothing: a double tap on the answer drawer's Continue would otherwise mark
 * the next card as forgotten.
 */
const AnswerButtons = ({
  canForget,
  canSubmit,
  onForgot,
  onSubmit,
}: {
  canForget: boolean;
  canSubmit: boolean;
  onForgot: () => void;
  onSubmit: () => void;
}) => {
  const guarded = useTapGuard();
  return (
    <div className="grid grid-cols-2 gap-2">
      <PracticeButton
        variant="danger"
        size="md"
        disabled={!canForget}
        onClick={guarded(onForgot)}
      >
        Forgot
      </PracticeButton>
      <PracticeButton
        variant="primary"
        size="md"
        disabled={!canSubmit}
        onClick={guarded(onSubmit)}
      >
        Next
      </PracticeButton>
    </div>
  );
};

export const Game = ({
  setId,
  batch,
  onlyJp,
  settings,
  onProgress,
  onComplete,
  onEnd,
}: {
  setId: FillTheKanjiSetId;
  batch: number;
  /** Only these sentences (retrying mistakes); null plays the whole batch. */
  onlyJp: string[] | null;
  settings: FillTheKanjiSettings;
  onProgress: (progress: number) => void;
  onComplete: (results: ItemResult[]) => void;
  onEnd: () => void;
}) => {
  const { load, retry } = useBatchLoad(setId, batch);
  const tileCount = isTileCount(settings.tileCount)
    ? settings.tileCount
    : DEFAULT_TILE_COUNT;
  // Memo needed: the cards are shuffled and their tiles drawn at random, so
  // building them again on a re-render would reshuffle the batch mid-game.
  const cards = useMemo(
    () =>
      load.status === "ready"
        ? buildCards(
            load.file,
            load.getSimilars,
            setId,
            batch,
            onlyJp,
            tileCount
          )
        : [],
    [load, setId, batch, onlyJp, tileCount]
  );
  const game = useFillTheKanjiGame({
    cards,
    sound: settings.sound,
    readAloudOnShow: settings.readAloudOnShow ?? false,
    onProgress,
    onComplete,
  });

  if (load.status === "error") {
    return <LoadError onRetry={retry} onBack={onEnd} />;
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
      {/* Escape asks to leave, except while the answer drawer is open:
          there it closes the notes popover instead. The drawer's overlay
          covers this button anyway. A retry round isn't recorded. */}
      <GameHeader
        position={{ index: game.index, total: cards.length }}
        recorded={onlyJp == null}
        escapeEnabled={!revealed}
        onLeave={onEnd}
      />

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
        <div
          className={`flex flex-col w-full max-w-md gap-3 mx-auto ${
            tiles.length === 12 ? "sm:max-w-2xl" : ""
          }`}
        >
          <TileGrid tiles={tiles} onPick={game.pickTile} />
          <AnswerButtons
            // A new card restarts the tap guard.
            key={game.index}
            canForget={!game.allFilled && !revealed}
            canSubmit={game.allFilled && !revealed}
            onForgot={game.forgot}
            onSubmit={game.submit}
          />
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
