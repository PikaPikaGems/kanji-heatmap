import type { PracticeItem } from "@/components/shared-practice";
import { toPracticeWord } from "@/components/shared-practice/build-deck";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { snapshotValue } from "@/lib/engine/store-cache";
import { REVIEW_PILE_ALL_KEY } from "@/lib/engine/use-due-count";
import { useEngineQuery } from "@/lib/engine/use-engine-query";
import { findAnchorWord } from "@/lib/kanji/anchor-words";
import { useGetAnchorWordsFn } from "@/providers/kanji-representative-word-hooks";

/**
 * The practice-game item (anchor word, reading, gloss) for a card in the
 * review pile. `word` is the word the card asks about (the engine's
 * `ActiveReview.word`). When that is the pile item's main word and the item
 * has a secondary word, the item carries it too (the writing game shows
 * both). `getItem` is null until the kanji data has loaded, and returns null
 * when the word is no longer one of the kanji's anchor words or has no
 * reading.
 */
export const useMasteryItemLookup = () => {
  const getAnchorWords = useGetAnchorWordsFn();
  const getKanjiInfo = useGetKanjiInfoFn();
  const pile = snapshotValue(
    useEngineQuery(REVIEW_PILE_ALL_KEY, (api) => api.reviews.pile.watchAll())
  );

  if (getAnchorWords == null || getKanjiInfo == null) return { getItem: null };

  const getItem = (kanji: string, word: string): PracticeItem | null => {
    const anchors = getAnchorWords(kanji);
    const anchor = findAnchorWord(anchors, word);
    if (anchor == null || anchor.readings.length === 0) return null;

    const pileItem = pile?.find((item) => item.kanji === kanji);
    const secondary =
      pileItem?.word === word && pileItem.secondary
        ? findAnchorWord(anchors, pileItem.secondary.word)
        : null;
    return {
      kanji,
      ...toPracticeWord(anchor),
      keyword: getKanjiInfo(kanji)?.keyword || "...",
      fontIndex: null,
      ...(secondary ? { secondary: toPracticeWord(secondary) } : {}),
    };
  };
  return { getItem };
};
