import wanakana from "@/lib/wanakana-adapter";
import {
  GeneralKanjiItem,
  HoverItemReturnData,
  VocabExtendedInfo,
} from "@/lib/kanji/kanji-info-types";
import {
  ComponentsMap,
  KanjiGeneralInfo,
  KanjiHoverInfo,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import { componentKeyword } from "@/lib/radicals";

// Pure assembly of the per-kanji payloads behind the hover card and the
// details "general" section. All data comes in as plain caches, so these
// functions can run on the main thread or inside the worker unchanged, and
// the characterization tests can pin their exact output against the real
// JSON data.

type MainInfoMap = Record<string, KanjiMainInfo>;

type Aliases = Record<string, string>;

/**
 * Keyword for a single component: a kanji's own keyword wins, otherwise the
 * component registry answers, following aliases (氵 → ⺡). `isKanji` drives
 * whether the UI links to a kanji page or a component page.
 */
const lookupPart = (
  part: string,
  mainInfoMap: MainInfoMap,
  components: ComponentsMap,
  aliases: Aliases
) => {
  const kanjiKeyword = mainInfoMap[part]?.keyword;
  return {
    keyword:
      kanjiKeyword ??
      componentKeyword(
        part,
        components,
        aliases,
        (kanji) => mainInfoMap[kanji]?.keyword
      ),
    isKanji: kanjiKeyword != null,
  };
};

export const extractKanjiHoverData = (
  main: KanjiMainInfo,
  hoverInfo: KanjiHoverInfo & VocabExtendedInfo,
  mainInfoMap: MainInfoMap,
  components: ComponentsMap,
  aliases: Aliases
) => {
  const getPhonetic = () => {
    const phoneticPart = hoverInfo.phonetic;
    if (phoneticPart == null) {
      return undefined;
    }
    return {
      phonetic: phoneticPart,
      sound: components[phoneticPart]?.s,
      members: [...(components[phoneticPart]?.m ?? "")],
      ...lookupPart(phoneticPart, mainInfoMap, components, aliases),
    };
  };

  // Characters with no keyword (kana, punctuation) are dropped, and a
  // character repeated in the word is listed once.
  const getPartsList = (word: string) => {
    const partCache: Record<string, string> = {};
    const isKanjiCache: Record<string, boolean> = {};

    word.split("").forEach((part) => {
      const { keyword, isKanji } = lookupPart(
        part,
        mainInfoMap,
        components,
        aliases
      );
      if (keyword) {
        partCache[part] = keyword;
        isKanjiCache[part] = isKanji;
      }
    });

    return Object.keys(partCache).map((part) => ({
      kanji: part,
      keyword: partCache[part],
      isKanji: isKanjiCache[part],
    }));
  };

  const phonetic = getPhonetic();

  const vocab = hoverInfo.vocabInfo;

  const result = {
    ...main,
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
    parts: hoverInfo.parts.map((part) => ({
      part,
      ...lookupPart(part, mainInfoMap, components, aliases),
    })),
    frequency: main.frequency,
    phonetic,
  } as HoverItemReturnData;
  return result;
};

export const extractKanjiGeneralData = (
  main: KanjiMainInfo,
  generalInfo: KanjiGeneralInfo
) => {
  const { allKun, allOn, meanings } = generalInfo;
  const { jouyouGrade, wk, rtk, strokes, kklcIndex, topoTwitterIndex, jlpt } =
    main;

  return {
    allKun: Array.from(allKun),
    allOn: Array.from(allOn).map((item) => wanakana.toKatakana(item)),
    meanings,
    jouyouGrade,
    wk,
    rtk,
    strokes,
    kklcIndex,
    topoTwitterIndex,
    jlpt,
  } as GeneralKanjiItem;
};
