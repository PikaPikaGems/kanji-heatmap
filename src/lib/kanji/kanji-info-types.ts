import { JLTPTtypes } from "../jlpt";
import {
  KanjiExtendedInfo,
  KanjiInfoFrequency,
  KanjiMainInfo,
} from "./kanji-worker-types";

export type KanjiInfoRequestType = "hover-card" | "general" | "radical-keyword";

export type VocabExtendedInfo = {
  vocabInfo?: {
    first?: {
      word: string;
      meaning: string;
      wordPartDetails: string[][];
    };
    second?: {
      word: string;
      meaning: string;
      wordPartDetails: string[][];
    };
  };
};
export type KanjiCacheItem = {
  main: KanjiMainInfo;
  extended?: KanjiExtendedInfo & VocabExtendedInfo;
};

export type KanjiWordDetails = {
  word: string;
  meaning: string;
  // word: part details
  // "行為": [["行", "こう"], ["為","い"]]
  wordPartDetails: string[][];
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

export type KanjiCacheType = Record<string, KanjiCacheItem>;
export type KanjiPhoneticCacheType = Record<string, string[]>;
export type KanjiPartKeywordCacheType = Record<string, string>;
export type KanjiVocabCacheType = Record<
  string,
  { meaning: string; parts: string[][] }
>;
