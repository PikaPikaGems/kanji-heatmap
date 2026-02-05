import { JLTPTtypes } from "../jlpt";

export type KanjiWorkerInfoRequestType = "kanji-extended";
// | "kanji-related-kanji"
// | "kanji-notes"
// | "kanji-other-vocab";

export type KanjiSearchRequestType = "search-result-count" | "search";

export type KanjiMainInfo = {
  keyword: string;
  jlpt: JLTPTtypes;
  on: string;
  kun: string;
  frequency: KanjiInfoFrequency;
};

export type GetBasicKanjiInfo = (kanji: string) => {
  keyword: string;
  jlpt?: JLTPTtypes;
  on?: string;
  kun?: string;
  frequency?: KanjiInfoFrequency;
} | null;

export type KanjiInfoFrequency = {
  netflix: number | null; //rank_netflix,
  twitter: number | null; //rank_twitter,
  google: number | null; //rank_google,
  wkfr: number | null; //rank_wkfr,
  wikiChar: number | null; //rank_wikipedia_char,
  wikiDoc: number | null; //rank_wikipedia_doc,
  aozoraChar: number | null; //rank_aozora_char,
  aozoraDoc: number | null; //rank_aozora_doc,
  onlineNewsChar: number | null; //rank_online_news_char,
  onlineNewsDoc: number | null; //rank_online_news_doc,
  novels5100: number | null; //rank_novels_5100,
  dramaSubs: number | null; //rank_drama_subtitles,
  kuf: number | null; //rank_kuf,
  mcd: number | null; //rank_mcd,
  bunka: number | null; //rank_bunka,
  kd: number | null; //rank_kd,
  jisho: number | null; //rank_jisho,
};

export type KanjiExtendedInfo = {
  parts: Set<string>;
  strokes: number;
  rtk: number;
  wk: number;
  jouyouGrade: number;
  meanings: string[];
  allOn: Set<string>;
  allKun: Set<string>;
  allKunStripped: Set<string>; // same as allKun except wanakana.toHiragana(item.replace(/[-.。ー]/g, ""))
  phonetic?: string;
  mainVocab?: string[];
};

export type WordMeaning = string;
export type WordPartDetail = [string, string | undefined];
export type SegmentedVocabResponseType = Record<string, SegmentedVocabInfo>;

export type SegmentedVocabInfo = {
  meaning: WordMeaning;
  parts: WordPartDetail[];
};

export type FreqList = [
  number, //rank_netflix,
  number, //rank_twitter,
  number, //rank_google,
  number, //rank_wkfr,
  number, //rank_wikipedia_char,
  number, //rank_wikipedia_doc,
  number, //rank_aozora_char,
  number, //rank_aozora_doc,
  number, //rank_online_news_char,
  number, //rank_online_news_doc,
  number, //rank_novels_5100,
  number, //rank_drama_subtitles,
  number, //rank_kuf,
  number, //rank_mcd,
  number, //rank_bunka,
  number, //rank_kd,
  number, //rank_jisho,
];

export type MainKanjiInfoResponseType = Record<
  string,
  [string, string, string, number, FreqList]
>;

export type ExtendedKanjiInfoItemType = [
  string[], // component parts
  number, // strokes
  number, // rtk index
  number, // wk level
  number, // jouyou grade
  string[], // meanings
  string[], // on readings
  string[], // kun readings
  string, // semantic phonetic if any
  string[], // sample vocabulary
];
export type ExtendedKanjiInfoResponseType = Record<
  string,
  ExtendedKanjiInfoItemType
>;

export type KanjiWorkerRequestName =
  | KanjiWorkerInfoRequestType
  | KanjiSearchRequestType
  | "initialize-extended-kanji-map"
  | "initalize-segmented-vocab-map"
  | "initialize-decomposition-map"
  | "kanji-main-map"
  | "phonetic-map"
  | "part-keyword-map"
  | "retrieve-vocab-info";

export type KanjiWorkerRequest = {
  type: KanjiWorkerRequestName;
  payload?: unknown;
};

export type OnMessageRequestType = {
  id: number;
  data: KanjiWorkerRequest;
};

export type PostMessageResponseType = {
  id: number;
  response: {
    requestType: KanjiWorkerRequestName;
    error?: { message: string } | null;
    status: "COMPLETED" | "ERRORED";
    data?: unknown;
  };
};
