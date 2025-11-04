/* eslint-disable @typescript-eslint/no-unused-expressions */
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
import { FrequencyType, SortKey } from "../options/options-types";
import { translateMap } from "../search-input-maps";
import { FREQ_RANK_OPTIONS } from "../options/options-constants";
import { clamp, toNum } from "../utils";
import { URL_PARAMS } from "./url-params";
import { translateValue } from "../wanakana-adapter";

const defaultFilterSettings: FilterSettings = {
  strokeRange: { min: 1, max: MAX_STROKE_COUNT },
  jlpt: [],
  freq: {
    source: "none",
    rankRange: { min: 1, max: MAX_FREQ_RANK },
  },
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

const toJLPT = (jlptString?: string | null) => {
  return (jlptString ?? "").split(",").filter((item) => {
    return JLPT_TYPE_ARR.includes(item as JLTPTtypes);
  }) as JLTPTtypes[];
};

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
    },
    sortSettings: {
      primary: toSortKey(sp.get(p.sortSettings.primary)),
      secondary: toSortKey(sp.get(p.sortSettings.secondary)),
    },
  };
};

const toSearchParams = (
  prev: URLSearchParams,
  key: keyof SearchSettings,
  value: TextSearch | FilterSettings | SortSettings
) => {
  if (key === "textSearch") {
    const newVal = value as TextSearch;
    const trimmedText = newVal.text.trim();

    if (trimmedText === "") {
      // if search type is the default one , don't show in url
      newVal.type === defaultSearchType
        ? prev.delete(URL_PARAMS.textSearch.type)
        : prev.set(URL_PARAMS.textSearch.type, newVal.type);
      prev.delete(URL_PARAMS.textSearch.text);
      return prev;
    }

    const text = translateValue(trimmedText, translateMap[newVal.type]);
    prev.set(URL_PARAMS.textSearch.text, text);

    if (newVal.type !== defaultSearchType) {
      prev.set(URL_PARAMS.textSearch.type, newVal.type);
      return prev;
    }

    // if search type is the default one , don't show in url
    prev.delete(URL_PARAMS.textSearch.type);
    return prev;
  }

  if (key === "filterSettings") {
    const newVal = value as FilterSettings;

    newVal.strokeRange.min <= 1
      ? prev.delete(URL_PARAMS.filterSettings.strokeRange.min)
      : prev.set(
          URL_PARAMS.filterSettings.strokeRange.min,
          newVal.strokeRange.min.toString()
        );

    newVal.strokeRange.max >= MAX_STROKE_COUNT
      ? prev.delete(URL_PARAMS.filterSettings.strokeRange.max)
      : prev.set(
          URL_PARAMS.filterSettings.strokeRange.max,
          newVal.strokeRange.max.toString()
        );

    newVal.jlpt.length === 0 || newVal.jlpt.length === JLPTOptionsCount
      ? prev.delete(URL_PARAMS.filterSettings.jlpt)
      : prev.set(URL_PARAMS.filterSettings.jlpt, newVal.jlpt.join(","));

    if (newVal.freq.source === "none") {
      prev.delete(URL_PARAMS.filterSettings.freq.source);
      prev.delete(URL_PARAMS.filterSettings.freq.rankRange.min);
      prev.delete(URL_PARAMS.filterSettings.freq.rankRange.max);
    } else {
      prev.set(URL_PARAMS.filterSettings.freq.source, newVal.freq.source);

      newVal.freq.rankRange.min <= 1
        ? prev.delete(URL_PARAMS.filterSettings.freq.rankRange.min)
        : prev.set(
            URL_PARAMS.filterSettings.freq.rankRange.min,
            newVal.freq.rankRange.min.toString()
          );

      newVal.freq.rankRange.max >= MAX_FREQ_RANK
        ? prev.delete(URL_PARAMS.filterSettings.freq.rankRange.max)
        : prev.set(
            URL_PARAMS.filterSettings.freq.rankRange.max,
            newVal.freq.rankRange.max.toString()
          );
    }
    return prev;
  }

  if (key === "sortSettings") {
    const newVal = value as SortSettings;

    if (newVal.primary === "none") {
      prev.delete(URL_PARAMS.sortSettings.primary);
      prev.delete(URL_PARAMS.sortSettings.secondary);

      return prev;
    }

    prev.set(URL_PARAMS.sortSettings.primary, newVal.primary);

    newVal.secondary === "none"
      ? prev.delete(URL_PARAMS.sortSettings.secondary)
      : prev.set(URL_PARAMS.sortSettings.secondary, newVal.secondary);

    return prev;
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
