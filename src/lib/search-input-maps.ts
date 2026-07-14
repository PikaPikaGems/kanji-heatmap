import { SearchType } from "@/lib/settings/settings";
import { TranslateType } from "./wanakana-adapter";

export const translateMap: Record<SearchType, TranslateType> = {
  keyword: "romaji",
  onyomi: "katakana",
  kunyomi: "hiragana",
  meanings: "romaji",
  readings: "hiragana",
  "multi-kanji": "none",
  similar: "none",
  radicals: "none",
  handwriting: "none",
  "handwriting-alt": "none",
  "handwriting-alt-2": "none",
};

export const placeholderMap: Record<SearchType, string> = {
  keyword: "Enter an English keyword",
  onyomi: "音読みを入力 (例: シン)", // Standardized to Kanji + localized helper text
  kunyomi: "訓読みを入力 (例: こころ)", // Standardized to Kanji + localized helper text
  meanings: "Enter meanings (e.g., world, person)",
  readings: "Enter any On or Kun reading",
  "multi-kanji": "Paste multiple kanji (e.g., 鼻詰まり)",
  similar: "Paste a single kanji to find similar shapes",
  radicals: "Click to select one or more radicals",
  handwriting: "Click to draw a kanji (online)",
  "handwriting-alt": "Click to draw a kanji (offline)",
  "handwriting-alt-2": "Click to draw a kanji (offline)",
};

export const SEARCH_TYPE_OPTIONS: {
  value: SearchType;
  label: string;
}[] = [
  { value: "keyword", label: "Keyword" },
  { value: "meanings", label: "Meanings" },
  { value: "multi-kanji", label: "Multi-Kanji" },
  { value: "handwriting", label: "Draw · Google" },
  { value: "handwriting-alt-2", label: "Draw · DaKanji" },
  { value: "handwriting-alt", label: "Draw · Canvas" },
  { value: "radicals", label: "Radicals" },
  { value: "readings", label: "Readings" },
  { value: "onyomi", label: "音読み" },
  { value: "kunyomi", label: "訓読み" },
  { value: "similar", label: "Similar Shapes" },
];
