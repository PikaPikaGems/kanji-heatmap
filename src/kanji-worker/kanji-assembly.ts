import wanakana from "@/lib/wanakana-adapter";
import {
  GeneralKanjiItem,
  HoverItemReturnData,
  KanjiCacheItem,
  KanjiCacheType,
  KanjiPartKeywordCacheType,
  KanjiPhoneticCacheType,
  VocabExtendedInfo,
} from "@/lib/kanji/kanji-info-types";
import { KanjiExtendedInfo } from "@/lib/kanji/kanji-worker-types";

// Pure assembly of the per-kanji payloads behind the hover card and the
// details "general" section. All data comes in as plain caches, so these
// functions can run on the main thread or inside the worker unchanged, and
// the characterization tests can pin their exact output against the real
// JSON data.

export const extractKanjiHoverData = (
  kanjiInfo: KanjiCacheItem,
  kanjiInfoExtended: KanjiExtendedInfo & VocabExtendedInfo,
  kanjiCache?: KanjiCacheType | null,
  partKeywordCache?: KanjiPartKeywordCacheType | null,
  phoneticCache?: KanjiPhoneticCacheType | null
) => {
  const getPhonetic = () => {
    if (kanjiInfoExtended.phonetic == null) {
      return undefined;
    }
    const kanjiKeyword = kanjiCache?.[kanjiInfoExtended.phonetic]?.main.keyword;
    return {
      phonetic: kanjiInfoExtended.phonetic,
      sound: phoneticCache?.[kanjiInfoExtended.phonetic],
      keyword: kanjiKeyword ?? partKeywordCache?.[kanjiInfoExtended.phonetic],
      isKanji: kanjiKeyword != null,
    };
  };

  const getPartsList = (word: string) => {
    const parts = word.split("");
    const partCache: Record<string, string> = {};
    const isKanjiCache: Record<string, boolean> = {};
    parts.forEach((part) => {
      const kanjiKeyword = kanjiCache?.[part]?.main.keyword;
      const keyword = kanjiKeyword ?? partKeywordCache?.[part];

      if (keyword) {
        partCache[part] = keyword;
        isKanjiCache[part] = kanjiKeyword != null;
      }
    });

    return Object.keys(partCache).map((part) => {
      return {
        kanji: part,
        keyword: partCache[part],
        isKanji: isKanjiCache[part],
      };
    });
  };

  const phonetic = getPhonetic();

  const vocab = kanjiInfoExtended.vocabInfo;

  const result = {
    ...kanjiInfo.main,
    mainVocab: {
      first: vocab?.first
        ? { ...vocab.first, partsList: getPartsList(vocab.first.word) }
        : undefined,
      second: vocab?.second
        ? {
            ...vocab.second,
            partsList: getPartsList(vocab.second.word),
          }
        : undefined,
    },
    parts: Array.from(kanjiInfoExtended.parts).map((part) => {
      const kanjiKeyword = kanjiCache?.[part]?.main.keyword;
      return {
        part,
        keyword: kanjiKeyword ?? partKeywordCache?.[part],
        isKanji: kanjiKeyword != null,
      };
    }),
    frequency: kanjiInfo.main.frequency,
    phonetic,
  } as HoverItemReturnData;
  return result;
};

export const extractKanjiGeneralData = (
  kanjiInfo: KanjiCacheItem,
  kanjiInfoExtended: KanjiExtendedInfo & VocabExtendedInfo
) => {
  const { allKun, allOn, meanings, jouyouGrade, wk, rtk, strokes, kklcIndex } =
    kanjiInfoExtended;

  return {
    allKun: Array.from(allKun),
    allOn: Array.from(allOn).map((item) => wanakana.toKatakana(item)),
    meanings,
    jouyouGrade,
    wk,
    rtk,
    strokes,
    kklcIndex,
    jlpt: kanjiInfo.main.jlpt,
  } as GeneralKanjiItem;
};
