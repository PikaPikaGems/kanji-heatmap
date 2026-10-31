import type { PracticeItem } from "@/components/shared-practice";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { findAnchorWord } from "@/lib/kanji/anchor-words";
import { useGetAnchorWordsFn } from "@/providers/kanji-representative-word-hooks";

/**
 * The practice-game item (anchor word, reading, gloss) for a card in the
 * review pile. `word` is the word the card asks about (the engine's
 * `ActiveReview.word`). `getItem` is null until the kanji data has loaded,
 * and returns null when that word is no longer one of the kanji's anchor
 * words or has no reading.
 */
export const useMasteryItemLookup = () => {
  const getAnchorWords = useGetAnchorWordsFn();
  const getKanjiInfo = useGetKanjiInfoFn();

  if (getAnchorWords == null || getKanjiInfo == null) return { getItem: null };

  const getItem = (kanji: string, word: string): PracticeItem | null => {
    const anchor = findAnchorWord(getAnchorWords(kanji), word);
    if (anchor == null || anchor.readings.length === 0) return null;
    return {
      kanji,
      word: anchor.word,
      reading: anchor.readings.join("・"),
      englishGloss: anchor.englishGloss,
      keyword: getKanjiInfo(kanji)?.keyword || "...",
      fontIndex: null,
    };
  };
  return { getItem };
};
