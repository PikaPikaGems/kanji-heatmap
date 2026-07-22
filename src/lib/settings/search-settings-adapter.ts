import { ALL_SORT_OPTIONS } from "@/lib/options/options-arr";
import {
  FilterSettings,
  SEARCH_TYPE_ARR,
  SearchSettings,
  SearchType,
  SortSettings,
  TextSearch,
} from "@/lib/settings/settings";
import { MAX_FREQ_RANK, MAX_STROKE_COUNT } from "@/lib/options/constants";
import { JLPT_TYPE_ARR, JLPTOptionsCount, JLTPTtypes } from "@/lib/jlpt";
import {
  JOUYOU_GRADE_TYPE_ARR,
  JouyouGradeOptionsCount,
  JouyouGradeType,
} from "@/lib/jouyou-grade";
import { isSelectionFilterActive } from "@/lib/selection-filter";
import { FrequencyType, SortKey } from "../options/options-types";
import { translateMap } from "../search-input-maps";
import { FREQ_RANK_OPTIONS } from "../options/options-constants";
import { clamp, toNum } from "../utils";
import { URL_PARAMS } from "./url-params";
import { translateValue } from "../wanakana-adapter";

const defaultFilterSettings: FilterSettings = {
  strokeRange: { min: 1, max: MAX_STROKE_COUNT },
  jlpt: [],
  jouyouGrade: [],
  freq: {
    source: "none",
    rankRange: { min: 1, max: MAX_FREQ_RANK },
  },
  bookmarkedOnly: false,
  withAnchorWordsOnly: false,
};

const defaultSortSettings: SortSettings = {
  primary: "none",
  secondary: "none",
};

const defaultSearchTextSettings: TextSearch = {
  text: "",
  type: "readings",
};

const defaultSearchType = defaultSearchTextSettings.type;

const toSearchType = (val?: string | null): SearchType => {
  if (val != null && SEARCH_TYPE_ARR.includes(val as SearchType)) {
    return val as SearchType;
  }

  return defaultSearchType;
};

const toSelection = <T extends string>(
  rawValue: string | null,
  allowedValues: readonly T[]
) =>
  (rawValue ?? "")
    .split(",")
    .filter((item): item is T => allowedValues.includes(item as T));

const toJLPT = (jlptString: string | null) =>
  toSelection<JLTPTtypes>(jlptString, JLPT_TYPE_ARR);

const toJouyouGrade = (gradeString: string | null) =>
  toSelection<JouyouGradeType>(gradeString, JOUYOU_GRADE_TYPE_ARR);

const toSortKey = (sortKeyStr?: string | null) => {
  if (sortKeyStr != null && ALL_SORT_OPTIONS.includes(sortKeyStr as SortKey)) {
    return sortKeyStr as SortKey;
  }

  return "none" as const;
};

const toFrequencySrc = (srcStr?: string | null) => {
  if (srcStr != null && FREQ_RANK_OPTIONS.includes(srcStr as FrequencyType)) {
    return srcStr as FrequencyType;
  }

  return "none" as const;
};

const toSearchSettings = (sp: URLSearchParams): SearchSettings => {
  const p = URL_PARAMS;

  const searchType = toSearchType(sp.get(p.textSearch.type));

  const text = translateValue(
    (sp.get(p.textSearch.text) ?? "").trim(),
    translateMap[searchType]
  );

  return {
    textSearch: {
      type: searchType,
      text,
    },
    filterSettings: {
      strokeRange: {
        min: clamp(
          toNum(sp.get(p.filterSettings.strokeRange.min), 1),
          1,
          MAX_STROKE_COUNT
        ),
        max: clamp(
          toNum(sp.get(p.filterSettings.strokeRange.max), MAX_STROKE_COUNT),
          1,
          MAX_STROKE_COUNT
        ),
      },
      jlpt: toJLPT(sp.get(p.filterSettings.jlpt)),
      jouyouGrade: toJouyouGrade(sp.get(p.filterSettings.jouyouGrade)),
      freq: {
        source: toFrequencySrc(sp.get(p.filterSettings.freq.source)),
        rankRange: {
          min: clamp(
            toNum(sp.get(p.filterSettings.freq.rankRange.min), 1),
            1,
            MAX_FREQ_RANK
          ),
          max: clamp(
            toNum(sp.get(p.filterSettings.freq.rankRange.max), MAX_FREQ_RANK),
            1,
            MAX_FREQ_RANK
          ),
        },
      },
      bookmarkedOnly: sp.get(p.filterSettings.bookmarkedOnly) === "1",
      withAnchorWordsOnly: sp.get(p.filterSettings.withAnchorWordsOnly) === "1",
    },
    sortSettings: {
      primary: toSortKey(sp.get(p.sortSettings.primary)),
      secondary: toSortKey(sp.get(p.sortSettings.secondary)),
    },
  };
};

// Write `value` under `key`, or drop the param entirely when the value is the
// default (`omitWhen`) — default-valued settings stay out of the URL.
const setOrDelete = (
  params: URLSearchParams,
  key: string,
  value: string,
  omitWhen: boolean
) => {
  if (omitWhen) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
};

const writeTextSearch = (prev: URLSearchParams, newVal: TextSearch) => {
  const trimmedText = newVal.text.trim();
  const text =
    trimmedText === ""
      ? ""
      : translateValue(trimmedText, translateMap[newVal.type]);

  setOrDelete(prev, URL_PARAMS.textSearch.text, text, text === "");
  // if search type is the default one, don't show in url
  setOrDelete(
    prev,
    URL_PARAMS.textSearch.type,
    newVal.type,
    newVal.type === defaultSearchType
  );
  return prev;
};

const writeFilterSettings = (prev: URLSearchParams, newVal: FilterSettings) => {
  const p = URL_PARAMS.filterSettings;

  setOrDelete(
    prev,
    p.strokeRange.min,
    newVal.strokeRange.min.toString(),
    newVal.strokeRange.min <= 1
  );
  setOrDelete(
    prev,
    p.strokeRange.max,
    newVal.strokeRange.max.toString(),
    newVal.strokeRange.max >= MAX_STROKE_COUNT
  );
  setOrDelete(
    prev,
    p.jlpt,
    newVal.jlpt.join(","),
    !isSelectionFilterActive(newVal.jlpt.length, JLPTOptionsCount)
  );
  setOrDelete(
    prev,
    p.jouyouGrade,
    newVal.jouyouGrade.join(","),
    !isSelectionFilterActive(newVal.jouyouGrade.length, JouyouGradeOptionsCount)
  );

  // No frequency source means the rank range is meaningless — drop all three.
  const noFreqSource = newVal.freq.source === "none";
  setOrDelete(prev, p.freq.source, newVal.freq.source, noFreqSource);
  setOrDelete(
    prev,
    p.freq.rankRange.min,
    newVal.freq.rankRange.min.toString(),
    noFreqSource || newVal.freq.rankRange.min <= 1
  );
  setOrDelete(
    prev,
    p.freq.rankRange.max,
    newVal.freq.rankRange.max.toString(),
    noFreqSource || newVal.freq.rankRange.max >= MAX_FREQ_RANK
  );
  setOrDelete(prev, p.bookmarkedOnly, "1", newVal.bookmarkedOnly !== true);
  setOrDelete(
    prev,
    p.withAnchorWordsOnly,
    "1",
    newVal.withAnchorWordsOnly !== true
  );
  return prev;
};

const writeSortSettings = (prev: URLSearchParams, newVal: SortSettings) => {
  const p = URL_PARAMS.sortSettings;

  // No primary sort means the secondary is meaningless — drop both.
  const noPrimary = newVal.primary === "none";
  setOrDelete(prev, p.primary, newVal.primary, noPrimary);
  setOrDelete(
    prev,
    p.secondary,
    newVal.secondary,
    noPrimary || newVal.secondary === "none"
  );
  return prev;
};

const toSearchParams = (
  prev: URLSearchParams,
  key: keyof SearchSettings,
  value: TextSearch | FilterSettings | SortSettings
) => {
  if (key === "textSearch") {
    return writeTextSearch(prev, value as TextSearch);
  }
  if (key === "filterSettings") {
    return writeFilterSettings(prev, value as FilterSettings);
  }
  if (key === "sortSettings") {
    return writeSortSettings(prev, value as SortSettings);
  }
  return prev;
};

export {
  toSearchParams,
  toSearchSettings,
  defaultFilterSettings,
  defaultSortSettings,
  defaultSearchTextSettings,
  defaultSearchType,
};
