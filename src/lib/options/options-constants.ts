import { KanjiInfoFrequency } from "../kanji/kanji-worker-types";

export const K_JLPT = "jlpt";
export const K_JOUYOU_KEY = "jouyou-grade";
export const K_ONYOMI = "onyomi";
export const K_KUNYOMI = "kunyomi";
export const K_STROKES = "strokes";
export const K_WK_LVL = "wanikani-level";

export const K_RTK_INDEX = "rtk-index";
export const K_MEANING_KEY = "keyword";

export const K_RANK_NETFLIX = "rank-netflix";
export const K_RANK_DRAMA_SUBTITLES = "rank-drama-subtitles";
export const K_RANK_NOVELS_5100 = "rank-novels-5100";
export const K_RANK_TWITTER = "rank-twitter";
export const K_RANK_WIKIPEDIA_DOC = "rank-wikipedia-doc";
export const K_RANK_WIKIPEDIA_CHAR = "rank-wikipedia-char";
export const K_RANK_ONLINE_NEWS_DOC = "rank-online-news-doc";
export const K_RANK_ONLINE_NEWS_CHAR = "rank-online-news-char";
export const K_RANK_AOZORA_DOC = "rank-aozora-doc";
export const K_RANK_AOZORA_CHAR = "rank-aozora-char";

export const K_RANK_GOOGLE = "rank-google";
export const K_RANK_KUF = "rank-kuf";
export const K_RANK_MCD = "rank-mcd";
export const K_RANK_BUNKA = "rank-bunka";
export const K_RANK_JISHO = "rank-jisho";
export const K_RANK_KD = "rank-kd";
export const K_RANK_WKFR = "rank-wkfr";

export const GROUP_OPTIONS = [
  K_JLPT,
  K_JOUYOU_KEY,
  K_STROKES,
  K_WK_LVL,
] as const; // removed K_KUNYOMI, K_ONYOMI for now

export const NONGROUP_OPTIONS = [K_RTK_INDEX, K_MEANING_KEY] as const;

export const K_RANK_NONE = "none" as const;

export const FREQ_RANK_OPTIONS = [
  K_RANK_GOOGLE,
  K_RANK_NETFLIX,
  K_RANK_TWITTER,
  K_RANK_WKFR,
  K_RANK_WIKIPEDIA_CHAR,
  K_RANK_WIKIPEDIA_DOC,
  K_RANK_KUF,
  K_RANK_KD,
  K_RANK_BUNKA,
  K_RANK_JISHO,
  K_RANK_ONLINE_NEWS_CHAR,
  K_RANK_ONLINE_NEWS_DOC,
  K_RANK_AOZORA_CHAR,
  K_RANK_AOZORA_DOC,
  K_RANK_NOVELS_5100,
  K_RANK_MCD,
  K_RANK_DRAMA_SUBTITLES,
  K_RANK_NONE,
] as const;

// TODO: Make this a function of FREQ_RANK_OPTIONS
export const frequencyRankNamesOrdered: (keyof KanjiInfoFrequency)[] = [
  "google",
  "netflix",
  "twitter",
  "wkfr",
  "wikiChar",
  "wikiDoc",
  "kuf",
  "kd",
  "bunka",
  "jisho",
  "onlineNewsChar",
  "onlineNewsDoc",
  "aozoraChar",
  "aozoraDoc",
  "novels5100",
  "mcd",
  "dramaSubs",
] as const;
