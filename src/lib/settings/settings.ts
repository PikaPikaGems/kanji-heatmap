import { JLTPTtypes } from "../jlpt";
import { FrequencyType, SortKey } from "../options/options-types";

export const SEARCH_TYPE_ARR = [
  "keyword",
  "meanings",
  "readings",
  "onyomi",
  "kunyomi",
  "multi-kanji",
] as const;

export type SearchType = (typeof SEARCH_TYPE_ARR)[number];

export type TextSearch = {
  type: SearchType;
  text: string;
};

export type FilterSettings = {
  strokeRange: { min: number; max: number };
  jlpt: JLTPTtypes[];
  freq: {
    source: FrequencyType;
    rankRange: { min: number; max: number };
  };
};

export type SortSettings = {
  primary: SortKey;
  secondary: SortKey;
};

export type SearchSettings = {
  textSearch: TextSearch;
  filterSettings: FilterSettings;
  sortSettings: SortSettings;
};

export type ItemSettings = {
  cardType: "compact" | "expanded";
  borderColorAttached: boolean;
  backgroundColorSettingDataSource: FrequencyType;
};
