// Types for the kanji reading data
// Types for the kanji reading data
export type ReadingType = "ON" | "KUN";
export type FrequencyCategory = "↑" | "↔" | "↓";

export interface KanjiReadingEntry {
  reading: string;
  type: ReadingType;
  frequency: FrequencyCategory;
  example_word: string | null;
}

export type KanjiReadingsData = Record<string, KanjiReadingEntry[]>;

// Frequency display mappings
export const frequencyLabels: Record<FrequencyCategory, string> = {
  "↑": "Often Used",
  "↔": "Sometimes Used",
  "↓": "Almost Never Used",
};

export const frequencyColors: Record<FrequencyCategory, string> = {
  "↑": "text-green-500",
  "↔": "text-yellow-500",
  "↓": "text-red-500",
};

export const readingTypeLabels: Record<ReadingType, string> = {
  ON: "On'yomi",
  KUN: "Kun'yomi",
};

export type StructuralType =
  | "shiji"
  | "shoukei"
  | "kaii"
  | "keisei"
  | "unknown"
  | "derivative"
  | "rebus"
  | "kokuji"
  | "shinjitai";

export interface KanjiStructureEntry {
  type: StructuralType;
  semantic?: string;
  phonetic?: string;
}

export type KanjiStructureData = Record<string, KanjiStructureEntry>;

export const structuralTypeInfo: Record<
  StructuralType,
  { name: string; japanese: string; description: string }
> = {
  shiji: {
    name: "Indicative",
    japanese: "指事",
    description:
      "A simple symbol that points to an idea rather than drawing it—often used for abstract concepts. For example, 上 (up) shows a line above a base, and 下 (down) shows it below.",
  },
  shoukei: {
    name: "Pictographic",
    japanese: "象形",
    description:
      "A character that began as a drawing of something real and became more stylized over time. For example, 山 (mountain) and 木 (tree) still resemble their original shapes.",
  },
  kaii: {
    name: "Compound Ideographic",
    japanese: "会意",
    description:
      "A character made by combining parts that each add meaning—like a visual puzzle. For example, 休 (rest) combines 人 (person) and 木 (tree), suggesting a person leaning against a tree.",
  },
  keisei: {
    name: "Phono-semantic",
    japanese: "形声",
    description:
      "A mix of meaning and sound: one part hints at meaning, the other at pronunciation. For example, 河 (river) has 氵 (water) for meaning and 可 (か) for sound.",
  },
  unknown: {
    name: "Unknown",
    japanese: "不明",
    description:
      "The origin of this character isn’t clearly understood—its history is uncertain or debated.",
  },
  derivative: {
    name: "Derivative",
    japanese: "転注",
    description:
      "A character whose meaning has shifted or expanded over time. For example, 楽 originally meant “music” but also came to mean “comfort” or “ease.”",
  },
  rebus: {
    name: "Rebus",
    japanese: "仮借",
    description:
      "A character borrowed for its sound rather than its meaning. For example, 来 originally meant “wheat” but was borrowed to mean “come” because of similar pronunciation.",
  },
  kokuji: {
    name: "Japanese-made",
    japanese: "国字",
    description:
      "A character created in Japan for local needs. For example, 働 (to work) combines 人 (person) and 動 (move).",
  },
  shinjitai: {
    name: "Simplified",
    japanese: "新字体",
    description:
      "A modern simplified form introduced in Japan. For example, 国 is the simplified version of 國, and 学 comes from 學.",
  },
};
