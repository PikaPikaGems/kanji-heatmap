import { JLTPTtypes } from "../jlpt";
import type { WordPartDetail } from "../furigana";
import type {
  KanjiReadingEntry,
  KanjiReadingEntrySmall,
  KanjiStructureEntry,
  KanjiumEntry,
  MultiKanjiStructureEntry,
} from "../kanji-section-constants";
import type { SearchSettings } from "../settings/settings";
import type { GeneralKanjiItem, HoverItemReturnData } from "./kanji-info-types";

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

/**
 * Meanings and readings: what the details "General Information" section shows
 * and what meaning/reading searches match against.
 */
export type KanjiGeneralInfo = {
  meanings: string[];
  allOn: Set<string>;
  allKun: Set<string>;
  // allKun with okurigana markers stripped, so a typed reading matches.
  allKunStripped: Set<string>;
};

/** Everything the hover card is assembled from. */
export type KanjiHoverInfo = {
  parts: string[];
  /** The component that signals this kanji's sound; undefined when none. */
  phonetic?: string;
  /** Up to two sample words, keyed into the vocab dataset. */
  mainVocab: string[];
};

/** One entry of a component in components.json. */
export type ComponentInfo = {
  /** Keyword; absent when no source has one for this component. */
  k?: string;
  /** Sounds this component signals. */
  s?: string[];
  /** Stroke count, present for radicals shown in the drawer. */
  n?: number;
};

export type ComponentsMap = Record<string, ComponentInfo>;

export type GeneralInfoResponseType = Record<
  string,
  [meanings: string[], allOn: string[], allKun: string[]]
>;

export type HoverInfoResponseType = Record<
  string,
  [parts: string[], phonetic: string, mainVocab: string[]]
>;

export type VocabResponseType = Record<
  string,
  [furigana: string, meaning: string]
>;

/**
 * One entry of public/json/v2/kanji_structures.json.
 *
 * Short keys, and a source is omitted rather than nulled: coverage per source
 * runs 2,061–2,426 of 2,426 kanji, so most entries are missing at least one.
 * The worker expands these into `MultiKanjiStructureEntry` so the detail
 * sections keep reading named fields.
 */
export type StructuresResponseType = Record<
  string,
  {
    /** hlorenzi: `{type, semantic?, phonetic?}`. */
    hl?: KanjiStructureEntry;
    /** kanjium: `[semantic, radicalVariant, phonetic, ids, structureType]`. */
    ka?: KanjiumEntry;
    /** scott component list. */
    sc?: string[];
    /** yagays component list. */
    ya?: string[];
  }
>;

/** One entry of public/json/v2/kanji_reading_details.json. */
export type ReadingDetailsResponseType = Record<
  string,
  KanjiReadingEntrySmall[]
>;

export type WordMeaning = string;
// One furigana segment: text plus an optional reading.
export type { WordPartDetail } from "../furigana";
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

/**
 * The one copy of worker data that lives on the main thread. It exists because
 * grid tiles read keyword, frequency, JLPT, grade and the representative word
 * during render, where awaiting a promise is not an option.
 */
export type InitSnapshot = {
  mainInfoMap: Record<string, KanjiMainInfo>;
  componentsMap: ComponentsMap;
};

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
  /** One round trip that hands the main thread everything it reads during render. */
  init: { payload: undefined; response: InitSnapshot };
  "retrieve-vocab-info": { payload: string; response: VocabInfoResponse };
  search: { payload: SearchSettings; response: SearchResponse };
  "search-result-count": { payload: SearchSettings; response: number };
  "kanji-hover": { payload: string; response: HoverItemReturnData };
  "kanji-general": { payload: string; response: GeneralKanjiItem };
  "component-map": { payload: undefined; response: ComponentsMap };
  /** Gloss and emoji tag, needed only by detail surfaces and practice decks. */
  "rep-word-details": {
    payload: undefined;
    response: Record<string, [englishGloss: string, emojiTag: string]>;
  };
  "kanji-similar": { payload: string; response: string[] };
  /** The whole similar map, for callers that look up many kanji at once. */
  "similar-map": { payload: undefined; response: Record<string, string[]> };
  /**
   * Whole-map responses rather than per-kanji: both back a detail section that
   * the user arrows through kanji by kanji, so one round trip on first open
   * beats a request per kanji, and it matches what the main-thread providers
   * these replaced already did.
   */
  /**
   * One kanji's structure entry, not the whole map. The drawer displays a
   * single kanji, and the worker already holds the map in memory, so the reply
   * is one small object rather than a 2,426-entry structured clone.
   */
  "kanji-structure": {
    payload: string;
    response: MultiKanjiStructureEntry | null;
  };
  /** One kanji's reading breakdown; empty and absent both answer null. */
  "kanji-reading-details": {
    payload: string;
    response: KanjiReadingEntry[] | null;
  };
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
