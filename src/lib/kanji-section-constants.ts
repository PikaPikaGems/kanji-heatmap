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
      "A simple symbol that points to an idea rather than drawing it—often used to represent abstract concepts like numbers or directions.",
  },
  shoukei: {
    name: "Pictographic",
    japanese: "象形",
    description:
      "A character that started as a drawing of something real, like a tree, mountain, or person, and gradually became more stylized over time.",
  },
  kaii: {
    name: "Compound Ideographic",
    japanese: "会意",
    description:
      "A character made by combining two or more parts, where each piece contributes to the overall meaning—like a little visual puzzle.",
  },
  keisei: {
    name: "Phono-semantic",
    japanese: "形声",
    description:
      "A clever mix of meaning and sound: one part hints at what the character means, while another part gives a clue to how it’s pronounced.",
  },
  unknown: {
    name: "Unknown",
    japanese: "不明",
    description:
      "The origin of this character isn’t clearly understood—its history has been lost or is still debated.",
  },
  derivative: {
    name: "Derivative",
    japanese: "転注",
    description:
      "A character whose meaning has shifted or expanded over time, taking on new uses related to its original sense.",
  },
  rebus: {
    name: "Rebus",
    japanese: "仮借",
    description:
      "A character borrowed for its sound rather than its meaning—used to represent a different word that sounds the same or similar.",
  },
  kokuji: {
    name: "Japanese-made",
    japanese: "国字",
    description:
      "A character created in Japan to express ideas or things unique to Japanese life, not originally found in Chinese writing.",
  },
  shinjitai: {
    name: "Simplified",
    japanese: "新字体",
    description:
      "A modern simplified version of a traditional character, introduced in Japan to make writing and reading easier.",
  },
};
