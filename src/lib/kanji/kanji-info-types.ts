import { JLTPTtypes } from "../jlpt";
import { KanjiInfoFrequency, WordPartDetail } from "./kanji-worker-types";

export type KanjiInfoRequestType = "hover-card" | "general" | "radical-keyword";

type VocabWord = {
  word: string;
  meaning: string;
  wordPartDetails: WordPartDetail[];
};

export type VocabExtendedInfo = {
  vocabInfo?: {
    // null (not undefined) when the kanji has no first/second sample word —
    // that is what the worker's retrieveVocabInfo returns.
    first?: VocabWord | null;
    second?: VocabWord | null;
  };
};
export type KanjiWordDetails = {
  word: string;
  meaning: string;
  // word: part details
  // "行為": [["行", "こう"], ["為","い"]]
  wordPartDetails: WordPartDetail[];
  partsList: {
    kanji: string;
    keyword: string;
  }[];
};

export type GeneralKanjiItem = {
  allOn: string[];
  allKun: string[];
  meanings: string[];
  jouyouGrade: number;
  wk: number;
  rtk: number;
  strokes: number;
  kklcIndex: number;
  jlpt: JLTPTtypes;
};

export type HoverItemReturnData = {
  keyword: string;
  on: string;
  kun: string;
  jlpt: JLTPTtypes;
  parts: { part: string; keyword: string; isKanji: boolean }[];
  frequency?: KanjiInfoFrequency;
  phonetic?: {
    phonetic: string;
    sound: string[];
    keyword: string;
    isKanji: boolean;
  };
  mainVocab?: {
    first: KanjiWordDetails;
    second?: KanjiWordDetails;
  };
};

export type KanjiVocabCacheType = Record<
  string,
  { meaning: string; parts: string[][] }
>;
