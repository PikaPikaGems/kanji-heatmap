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

// Structural type information
export const structuralTypeInfo: Record<
  StructuralType,
  { name: string; japanese: string; description: string }
> = {
  shiji: {
    name: "Indicative",
    japanese: "指事",
    description:
      "A simple ideograph that represents an abstract concept through a symbolic or diagrammatic form.",
  },
  shoukei: {
    name: "Pictographic",
    japanese: "象形",
    description:
      "A character that is a stylized depiction of a physical object or natural phenomenon.",
  },
  kaii: {
    name: "Compound Ideographic",
    japanese: "会意",
    description:
      "A compound character formed by combining two or more elements to suggest a meaning.",
  },
  keisei: {
    name: "Phono-semantic",
    japanese: "形声",
    description:
      "A compound character combining a semantic component (meaning) and a phonetic component (sound).",
  },
  unknown: {
    name: "Unknown",
    japanese: "不明",
    description: "The etymological origin of this character is uncertain.",
  },
  derivative: {
    name: "Derivative",
    japanese: "転注",
    description:
      "A character whose meaning has been extended or transferred from its original meaning.",
  },
  rebus: {
    name: "Rebus",
    japanese: "仮借",
    description:
      "A character borrowed for its phonetic value to represent a word with a similar sound.",
  },
  kokuji: {
    name: "Japanese-made",
    japanese: "国字",
    description:
      "A character created in Japan, not found in classical Chinese.",
  },
  shinjitai: {
    name: "Simplified",
    japanese: "新字体",
    description:
      "A simplified form of a traditional character introduced in post-war Japan.",
  },
};
