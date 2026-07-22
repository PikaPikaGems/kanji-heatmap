import { MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPTOptions } from "@/lib/jlpt";
import { JouyouGradeOptions } from "@/lib/jouyou-grade";
import { isSelectionFilterActive } from "@/lib/selection-filter";
import { FilterSettings, SearchSettings } from "@/lib/settings/settings";
import { dedupe, isKanji } from "@/lib/utils";
import { GetBasicKanjiInfo } from "@/lib/kanji/kanji-worker-types";
import { K_MEANING_KEY } from "@/lib/options/options-constants";

export const hasNoFilters = (settings: SearchSettings) => {
  const { strokeRange, freq, jlpt, jouyouGrade } = settings.filterSettings;
  const fullRangeStrokes =
    strokeRange.min <= 1 && strokeRange.max >= MAX_STROKE_COUNT;
  const fullRangeFreq = freq.source === "none";
  const allJLPT = !isSelectionFilterActive(jlpt.length, JLPTOptions.length);
  const allGrades = !isSelectionFilterActive(
    jouyouGrade.length,
    JouyouGradeOptions.length
  );

  return fullRangeStrokes && fullRangeFreq && allJLPT && allGrades;
};

const alphaSort = (a: string, b: string) => {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA < lowerB) return -1;
  if (lowerA > lowerB) return 1;
  return 0;
};

export const getFinalResults = (
  searchSettings: SearchSettings,
  resultData: string[],
  getBasicInfo?: GetBasicKanjiInfo | null
): string[] => {
  const { type, text } = searchSettings.textSearch;

  if (type !== "multi-kanji") {
    return resultData;
  }

  const uniqueKanjiChars = dedupe(text.split("").filter(isKanji));
  if (uniqueKanjiChars.length === 0) {
    return resultData;
  }

  const hasSort = searchSettings.sortSettings.primary !== "none";
  const hasFilters = !hasNoFilters(searchSettings);

  if (!hasSort && !hasFilters) {
    return uniqueKanjiChars;
  }

  if (!hasSort) {
    return resultData;
  }

  // Keyword sort is client-side so component-keyword-only kanji are included.
  if (
    searchSettings.sortSettings.primary === K_MEANING_KEY &&
    getBasicInfo != null
  ) {
    const withKeyword: { kanji: string; keyword: string }[] = [];
    const withoutKeyword: string[] = [];

    for (const kanji of uniqueKanjiChars) {
      const keyword = getBasicInfo(kanji)?.keyword?.trim() ?? "";
      if (keyword.length > 0) {
        withKeyword.push({ kanji, keyword });
      } else {
        withoutKeyword.push(kanji);
      }
    }

    withKeyword.sort((a, b) => alphaSort(a.keyword, b.keyword));
    return [...withKeyword.map((item) => item.kanji), ...withoutKeyword];
  }

  const resultSet = new Set(resultData);
  const remaining = uniqueKanjiChars.filter((kanji) => !resultSet.has(kanji));
  return [...resultData, ...remaining];
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

  return true;
};
