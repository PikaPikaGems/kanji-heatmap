import { MAX_FREQ_RANK, MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPT_TYPE_ARR } from "@/lib/jlpt";
import { JOUYOU_GRADE_TYPE_ARR } from "@/lib/jouyou-grade";
import { K_RANK_GOOGLE } from "@/lib/options/options-constants";
import type { SearchSettings } from "@/lib/settings/settings";
import {
  useGetKanjiInfoFn,
  useKanjiSearch,
} from "@/kanji-worker/kanji-worker-hooks";
import { useReviewPileByKanji } from "@/lib/engine/use-review-pile";

/** Every kanji, most frequent first by the Google rank. */
const BY_GOOGLE_RANK: SearchSettings = {
  textSearch: { type: "readings", text: "" },
  filterSettings: {
    strokeRange: { min: 1, max: MAX_STROKE_COUNT },
    jlpt: JLPT_TYPE_ARR.map((level) => level),
    jouyouGrade: JOUYOU_GRADE_TYPE_ARR.map((grade) => grade),
    freq: { source: "none", rankRange: { min: 1, max: MAX_FREQ_RANK } },
    bookmarkedOnly: false,
    withAnchorWordsOnly: false,
  },
  sortSettings: { primary: K_RANK_GOOGLE, secondary: "none" },
};

/**
 * The kanji to suggest adding to the review pile: the most frequent one
 * (best Google rank) that isn't in the pile yet and has an anchor word, since
 * the pile stores that word. `null` while the data loads or when none is left.
 *
 * The engine can't say a kanji was removed from the pile earlier, so a
 * removed kanji can be suggested again.
 */
export const useSuggestedKanji = (): string | null => {
  const ranked = useKanjiSearch(BY_GOOGLE_RANK).data;
  const getInfo = useGetKanjiInfoFn();
  const pile = useReviewPileByKanji();

  if (ranked == null || getInfo == null || pile.status !== "ready") {
    return null;
  }
  return (
    ranked.find(
      (kanji) => !pile.byKanji.has(kanji) && Boolean(getInfo(kanji)?.repWord)
    ) ?? null
  );
};
