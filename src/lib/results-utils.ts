import { MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPTOptions } from "@/lib/jlpt";
import { JouyouGradeOptions } from "@/lib/jouyou-grade";
import { isSelectionFilterActive } from "@/lib/selection-filter";
import { FilterSettings, SearchSettings } from "@/lib/settings/settings";
import { dedupe, isKanji } from "@/lib/utils";

export const hasNoFilters = (settings: SearchSettings) => {
  const {
    strokeRange,
    freq,
    jlpt,
    jouyouGrade,
    bookmarkedOnly,
    withAnchorWordsOnly,
  } = settings.filterSettings;
  const fullRangeStrokes =
    strokeRange.min <= 1 && strokeRange.max >= MAX_STROKE_COUNT;
  const fullRangeFreq = freq.source === "none";
  const allJLPT = !isSelectionFilterActive(jlpt.length, JLPTOptions.length);
  const allGrades = !isSelectionFilterActive(
    jouyouGrade.length,
    JouyouGradeOptions.length
  );

  return (
    fullRangeStrokes &&
    fullRangeFreq &&
    allJLPT &&
    allGrades &&
    !bookmarkedOnly &&
    !withAnchorWordsOnly
  );
};

/**
 * Final order of the displayed kanji, shared by the list tiles and the
 * drawer's next / previous navigation. Follows the worker's (sorted) result
 * order, except multi-kanji, where the pasted order always wins and kanji
 * dropped by active filters are skipped.
 */
export const getFinalResults = (
  searchSettings: SearchSettings,
  resultData: string[]
): string[] => {
  const { type, text } = searchSettings.textSearch;
  if (type !== "multi-kanji") {
    return resultData;
  }

  const pastedOrder = dedupe(text.split("").filter(isKanji));
  if (pastedOrder.length === 0) {
    return resultData;
  }
  if (hasNoFilters(searchSettings)) {
    return pastedOrder;
  }

  const resultSet = new Set(resultData);
  return pastedOrder.filter((kanji) => resultSet.has(kanji));
};

export const shouldShowAllKanji = (settings: SearchSettings) => {
  const noText = settings.textSearch.text === "";
  return hasNoFilters(settings) && noText;
};

export const isEqualFilters = (
  a: FilterSettings,
  b: FilterSettings
): boolean => {
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (a.strokeRange.min !== b.strokeRange.min) return false;
  if (a.strokeRange.max !== b.strokeRange.max) return false;

  if (a.jlpt.length !== b.jlpt.length) return false;
  for (let i = 0; i < a.jlpt.length; i++) {
    if (a.jlpt[i] !== b.jlpt[i]) return false;
  }

  if (a.jouyouGrade.length !== b.jouyouGrade.length) return false;
  for (let i = 0; i < a.jouyouGrade.length; i++) {
    if (a.jouyouGrade[i] !== b.jouyouGrade[i]) return false;
  }

  if (a.freq.source !== b.freq.source) return false;
  if (a.freq.rankRange.min !== b.freq.rankRange.min) return false;
  if (a.freq.rankRange.max !== b.freq.rankRange.max) return false;

  if (a.bookmarkedOnly !== b.bookmarkedOnly) return false;
  if (a.withAnchorWordsOnly !== b.withAnchorWordsOnly) return false;

  return true;
};
