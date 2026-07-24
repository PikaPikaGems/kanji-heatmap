import { JLTPTtypes } from "../jlpt";
import type { SearchSettings } from "../settings/settings";
import type { VocabExtendedInfo } from "./kanji-info-types";

export type KanjiMainInfo = {
  keyword: string;
  jlpt: JLTPTtypes;
  on: string;
  kun: string;
  frequency: KanjiInfoFrequency;
  // Sort and filter read these. They live here rather than in the extended
  // info because sort settings are URL-reachable at first paint, so requiring
  // the extended file would make it eager again.
  strokes: number;
  jouyouGrade: number;
  wk: number;
  kklcIndex: number;
  rtk: number;
  // Rendered by expanded tiles during render, so it cannot be async.
  repWord: string | null;
  repReading: string | null;
};

export type GetBasicKanjiInfo = (kanji: string) => {
  keyword: string;
  jlpt?: JLTPTtypes;
  on?: string;
  kun?: string;
  frequency?: KanjiInfoFrequency;
  jouyouGrade?: number;
  repWord?: string | null;
  repReading?: string | null;
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
  jiten: number | null; // rank_jiten,
  jpdb: number | null; // rank_jpdb,
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
  kklcIndex: number;
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
  number, //rank_jiten
  number, // rank_jpdb
];

/** One entry of public/json/v2/kanji_main.json. */
export type MainKanjiInfoItemType = [
  keyword: string,
  on: string,
  kun: string,
  jlptRaw: number,
  freq: FreqList,
  strokes: number,
  jouyouGrade: number,
  wk: number,
  kklcIndex: number,
  rtk: number,
  repWord: string | null,
  repReading: string | null,
];

export type MainKanjiInfoResponseType = Record<string, MainKanjiInfoItemType>;

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
  string[], // sample vocabulary,
  number, // kklc index
  number, // rtkb index
];
export type ExtendedKanjiInfoResponseType = Record<
  string,
  ExtendedKanjiInfoItemType
>;

// ---------------------------------------------------------------------------
// Worker protocol
//
// One entry per request: its payload and its response. The promise wrapper on
// the main thread and the HANDLERS map inside the worker both derive their
// types from this, so adding a request means one entry here plus one handler,
// and a mismatch on either side is a compile error rather than a runtime cast.
// ---------------------------------------------------------------------------

export type SearchResponse = {
  kanjis: string[];
  possibleRadicals?: Set<string>;
};

export type VocabInfoResponse = {
  word: string;
  meaning: WordMeaning;
  wordPartDetails: WordPartDetail[];
} | null;

export interface WorkerApi {
  "initialize-extended-kanji-map": { payload: undefined; response: void };
  "initialize-segmented-vocab-map": { payload: undefined; response: void };
  "initialize-decomposition-map": { payload: undefined; response: void };
  "kanji-main-map": {
    payload: undefined;
    response: Record<string, KanjiMainInfo>;
  };
  "phonetic-map": { payload: undefined; response: Record<string, string[]> };
  "part-keyword-map": { payload: undefined; response: Record<string, string> };
  "retrieve-vocab-info": { payload: string; response: VocabInfoResponse };
  search: { payload: SearchSettings; response: SearchResponse };
  "search-result-count": { payload: SearchSettings; response: number };
  "kanji-extended": {
    payload: string;
    response: KanjiExtendedInfo & VocabExtendedInfo;
  };
  "kanji-similar": { payload: string; response: string[] };
}

export type KanjiWorkerRequestName = keyof WorkerApi;

/** The `{type, payload}` envelope for one request name. */
export type WorkerRequestOf<K extends KanjiWorkerRequestName> =
  undefined extends WorkerApi[K]["payload"]
    ? { type: K; payload?: WorkerApi[K]["payload"] }
    : { type: K; payload: WorkerApi[K]["payload"] };

export type KanjiWorkerRequest = {
  [K in KanjiWorkerRequestName]: WorkerRequestOf<K>;
}[KanjiWorkerRequestName];

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
