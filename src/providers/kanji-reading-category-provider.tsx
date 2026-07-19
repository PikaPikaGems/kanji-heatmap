import { createKanjiLookupProvider } from "./create-kanji-lookup-provider";
import assetsPaths from "@/lib/assets-paths";

import type {
  KanjiReadingEntry,
  KanjiReadingEntrySmall,
} from "@/lib/kanji-section-constants";

const readingCategory = createKanjiLookupProvider<
  [Record<string, KanjiReadingEntrySmall[]>],
  KanjiReadingEntry[]
>({
  name: "KanjiReadingCategory",
  assetPaths: [assetsPaths.KANJI_READING_DETAILS],
  select: ([data], kanji) => {
    const kanjiData = data[kanji];
    if (!kanjiData || kanjiData.length <= 0) {
      return null;
    }
    return kanjiData.map((entry) => ({
      reading: entry.r,
      type: entry.t,
      frequency: entry.f,
      example_word: entry.w,
    }));
  },
});

export const KanjiReadingCategoryProvider = readingCategory.Provider;

// Hook to get reading data for a specific kanji
export const useKanjiReadingDetails = (kanji: string) => {
  const { status, error, data } = readingCategory.useLookupState(kanji);
  return { status, error, kanjiReadingData: data };
};
