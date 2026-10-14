import { useMemo } from "react";
import { useKanjiSearchResult } from "@/kanji-worker/kanji-worker-hooks";
import { useSearchSettings } from "@/providers/search-settings-hooks";
import { getFinalResults } from "@/lib/results-utils";
import { isPracticePath } from "@/lib/practice-return-path";
import { useUrlLocation } from "@/hooks/routing-hooks";

export const useNextPrevKanji = (currentKanji: string) => {
  const kanjisData = useKanjiSearchResult();
  const searchSettings = useSearchSettings();
  // On practice pages the drawer opens on a single kanji from the end-of-round
  // recap, which has nothing to do with the home screen's search results.
  const navigationEnabled = !isPracticePath(useUrlLocation());

  const nextPrev = useMemo(() => {
    if (!navigationEnabled) {
      return { next: null, prev: null };
    }

    if (kanjisData.data == null || kanjisData.data.length <= 0) {
      return null;
    }
    const kanjis = getFinalResults(searchSettings, kanjisData.data);
    if (kanjis.length <= 0) {
      return null;
    }

    const index = kanjis.findIndex((kanji) => kanji == currentKanji);

    // not in current displayed kanjis
    if (index === -1) {
      return {
        next: kanjis[0],
      };
    }

    // the current kanji is the only one in the list
    if (kanjis.length === 1) {
      return null;
    }

    return {
      next: index + 1 === kanjis.length ? null : kanjis[index + 1],
      prev: index === 0 ? null : kanjis[index - 1],
    };
  }, [currentKanji, kanjisData, searchSettings, navigationEnabled]);

  return nextPrev;
};
