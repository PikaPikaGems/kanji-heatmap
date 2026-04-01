import { KanjiInfoFrequency, KanjiMainInfo } from "../kanji/kanji-worker-types";
import {
  K_JLPT,
  K_JOUYOU_KEY,
  K_KKLC_INDEX,
  K_MEANING_KEY,
  K_RANK_AOZORA_CHAR,
  K_RANK_AOZORA_DOC,
  K_RANK_BUNKA,
  K_RANK_DRAMA_SUBTITLES,
  K_RANK_GOOGLE,
  K_RANK_JISHO,
  K_RANK_JITEN,
  K_RANK_JPDB,
  K_RANK_KD,
  K_RANK_KUF,
  K_RANK_MCD,
  K_RANK_NETFLIX,
  K_RANK_NONE,
  K_RANK_NOVELS_5100,
  K_RANK_ONLINE_NEWS_CHAR,
  K_RANK_ONLINE_NEWS_DOC,
  K_RANK_TWITTER,
  K_RANK_WIKIPEDIA_CHAR,
  K_RANK_WIKIPEDIA_DOC,
  K_RANK_WKFR,
  K_RTK_INDEX,
  K_STROKES,
  K_WK_LVL,
} from "./options-constants";
import {
  FreqMapInverse,
  FrequencyType,
  SortGroup,
  SortNonGroup,
  SortOptionLabelType,
} from "./options-types";

export const nonFreqOptionLabels: Record<SortGroup | SortNonGroup, string> = {
  [K_JLPT]: "JLPT",
  [K_JOUYOU_KEY]: "Jouyou Grade",
  [K_STROKES]: "Stroke Count",
  [K_WK_LVL]: "(WK) WaniKani Level",
  [K_RTK_INDEX]: "(RTK) James W. Heisig's Remembering the Kanji Index",
  [K_MEANING_KEY]: "Keyword",
  [K_KKLC_INDEX]: "(KKLC) The Kodansha Kanji Learner's Course",
};

export const freqMap: Record<
  FrequencyType,
  keyof KanjiInfoFrequency | undefined
> = {
  [K_RANK_NETFLIX]: "netflix",
  [K_RANK_DRAMA_SUBTITLES]: "dramaSubs",
  [K_RANK_NOVELS_5100]: "novels5100",
  [K_RANK_TWITTER]: "twitter",
  [K_RANK_WIKIPEDIA_DOC]: "wikiDoc",
  [K_RANK_WIKIPEDIA_CHAR]: "wikiChar",
  [K_RANK_ONLINE_NEWS_DOC]: "onlineNewsDoc",
  [K_RANK_ONLINE_NEWS_CHAR]: "onlineNewsChar",
  [K_RANK_AOZORA_DOC]: "aozoraDoc",
  [K_RANK_AOZORA_CHAR]: "aozoraChar",
  [K_RANK_GOOGLE]: "google",
  [K_RANK_KUF]: "kuf",
  [K_RANK_MCD]: "mcd",
  [K_RANK_BUNKA]: "bunka",
  [K_RANK_JISHO]: "jisho",
  [K_RANK_KD]: "kd",
  [K_RANK_WKFR]: "wkfr",
  [K_RANK_JPDB]: "jpdb",
  [K_RANK_JITEN]: "jiten",
  [K_RANK_NONE]: undefined,
};

export const frequencyRankLabels: Record<keyof KanjiInfoFrequency, string> = {
  netflix: "Netflix",
  twitter: "Twitter",
  google: "Google",
  kd: "Kanji Database",
  wikiChar: "Wikipedia Characters",
  wikiDoc: "Wikipedia Documents",
  aozoraChar: "Aozora Characters",
  aozoraDoc: "Aozora Documents",
  onlineNewsChar: "Online News Characters",
  onlineNewsDoc: "Online News Documents",
  novels5100: "5100 Novels",
  dramaSubs: "Drama Subtitles",
  kuf: "Kanji Usage Frequency",
  mcd: "Matsushita's Character Database",
  bunka: "Japan's Agency for Cultural Affairs",
  wkfr: "Wikipedia Kanji Frequency Report",
  jisho: "Jisho.org",
  jiten: "Jiten.moe",
  jpdb: "JPDB.io",
};

export const SORT_OPTION_LABELS: SortOptionLabelType = Object.keys({
  ...nonFreqOptionLabels,
  ...freqMap,
}).reduce((acc: SortOptionLabelType, option: string) => {
  const name = freqMap[option as FrequencyType];

  if (name != null) {
    const label = frequencyRankLabels[name];
    acc[option as FrequencyType] = label;
    return acc;
  }

  const label = nonFreqOptionLabels[option as SortGroup | SortNonGroup];

  if (label != null) {
    acc[option as SortGroup | SortNonGroup] = label;
    return acc;
  }

  return acc;
}, {} as SortOptionLabelType);

export const inverseFreqMap = Object.keys(freqMap).reduce((acc, item) => {
  const infoFreq = item as FrequencyType;

  if (item == null) {
    return acc;
  }

  const type = freqMap[infoFreq];

  if (type == null) {
    return acc;
  }

  acc[type] = infoFreq;

  return acc;
}, {} as FreqMapInverse);

export const getFrequency = (freq: FrequencyType, info: KanjiMainInfo) => {
  return freqMap[freq] &&
    info.frequency &&
    (info.frequency[freqMap[freq]] ?? 0) > 0
    ? info.frequency[freqMap[freq]]
    : undefined;
};
