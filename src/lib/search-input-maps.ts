import { SearchType } from "@/lib/settings/settings";
import { TranslateType } from "./wanakana-adapter";

export const translateMap: Record<SearchType, TranslateType> = {
  keyword: "romaji",
  onyomi: "katakana",
  kunyomi: "hiragana",
  meanings: "romaji",
  readings: "hiragana",
  "multi-kanji": "none",
  radicals: "none",
  handwriting: "none",
  "handwriting-alt": "none",
};

export const placeholderMap: Record<SearchType, string> = {
  keyword: "Keyword Search",
  onyomi: "オンヨミ 検索",
  kunyomi: "くんよみ 検索",
  meanings: `e.g. "world" or "person"`,
  readings: "Any Kun or On Reading",
  "multi-kanji": "e.g paste 鼻詰まり ",
  radicals: "Click to open radical selection",
  handwriting: "Click to draw a kanji",
  "handwriting-alt": "Click to draw a kanji (offline)",
};

export const SEARCH_TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "keyword", label: "Keyword" },
  { value: "meanings", label: "Meanings" },
  { value: "multi-kanji", label: "Multi-Kanji" },
  { value: "handwriting", label: "Handwriting" },
  { value: "handwriting-alt", label: "Handwriting Alt" },
  { value: "radicals", label: "Radicals" },
  { value: "readings", label: "Readings" },
  { value: "onyomi", label: "音読み" },
  { value: "kunyomi", label: "訓読み" },
];
