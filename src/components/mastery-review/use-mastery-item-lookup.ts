import type { PracticeItem } from "@/components/shared-practice";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useGetRepresentativeWordDetailsFn } from "@/providers/kanji-representative-word-hooks";

/**
 * The practice-game item (representative word, reading, gloss) for a kanji in
 * the review pile. `getItem` is null until the kanji data has loaded, and
 * returns null for a kanji with no usable representative word.
 */
export const useMasteryItemLookup = () => {
  const getDetails = useGetRepresentativeWordDetailsFn();
  const getKanjiInfo = useGetKanjiInfoFn();

  if (getDetails == null || getKanjiInfo == null) return { getItem: null };

  const getItem = (kanji: string): PracticeItem | null => {
    const details = getDetails(kanji);
    if (details == null || !details.reading) return null;
    return {
      kanji,
      word: details.word,
      reading: details.reading,
      englishGloss: details.englishGloss,
      keyword: getKanjiInfo(kanji)?.keyword || "...",
      fontIndex: null,
    };
  };
  return { getItem };
};
