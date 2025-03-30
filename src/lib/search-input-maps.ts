import { SearchType } from "@/lib/settings/settings";
import { TranslateType } from "./wanakana-adapter";

export const translateMap: Record<SearchType, TranslateType> = {
  keyword: "romaji",
  onyomi: "katakana",
  kunyomi: "hiragana",
  meanings: "romaji",
  readings: "hiragana",
  "multi-kanji": "none",
};

export const placeholderMap: Record<SearchType, string> = {
  keyword: "Keyword Search",
  onyomi: "オンヨミ 検索",
  kunyomi: "くんよみ 検索",
  meanings: `e.g. "world" or "person"`,
  readings: "Any Kun or On Reading",
  "multi-kanji": "e.g paste 鼻詰まり ",
};

export const SEARCH_TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "keyword", label: "Keyword" },
  { value: "multi-kanji", label: "Multi-Kanji" },
  { value: "meanings", label: "Meanings" },
  { value: "readings", label: "Readings" },
  { value: "onyomi", label: "Onyomi" },
  { value: "kunyomi", label: "Kunyomi" },
];
