import wanakana from "@/lib/wanakana-adapter";
import { JLTPTtypes } from "@/lib/jlpt";
import {
  ComponentsMap,
  GeneralInfoResponseType,
  HoverInfoResponseType,
  KanjiGeneralInfo,
  KanjiHoverInfo,
  KanjiMainInfo,
  MainKanjiInfoItemType,
  MainKanjiInfoResponseType,
  ReadingDetailsResponseType,
  SegmentedVocabInfo,
  StructuresResponseType,
  VocabResponseType,
} from "@/lib/kanji/kanji-worker-types";
import assetsPaths from "@/lib/assets-paths";
import { decodeFurigana } from "@/lib/furigana";
import type {
  KanjiReadingsData,
  MultiKanjiStructureData,
} from "@/lib/kanji-section-constants";

const createFetch = <T>(path: string) => {
  return () =>
    fetch(path).then((response) => {
      const json = response.json();
      return json as Promise<T>;
    });
};

export const fetchMainKanjiInfo = createFetch<MainKanjiInfoResponseType>(
  assetsPaths.MAIN_KANJI_INFO_FILE_PATH
);

export const fetchGeneralKanjiInfo = createFetch<GeneralInfoResponseType>(
  assetsPaths.EXTENDED_GENERAL_FILE_PATH
);

export const fetchHoverKanjiInfo = createFetch<HoverInfoResponseType>(
  assetsPaths.EXTENDED_HOVER_FILE_PATH
);

export const fetchComponents = createFetch<ComponentsMap>(
  assetsPaths.COMPONENTS_FILE
);

export const fetchRepWordDetails = createFetch<
  Record<string, [string, string]>
>(assetsPaths.REP_WORD_DETAILS_FILE);

export const fetchKanjiDecomposition = createFetch<Record<string, string>>(
  assetsPaths.KANJI_DECOMPOSITION
);

export const fetchSimilarKanjis = createFetch<Record<string, string[]>>(
  assetsPaths.SIMILAR_KANJIS
);

const fetchStructuresFile = createFetch<StructuresResponseType>(
  assetsPaths.KANJI_STRUCTURES
);

/**
 * Expand the stored short keys into the named fields the "Character Structure"
 * section reads. A source absent from an entry becomes `null`, which is what
 * the section already treats as "this source has nothing to say".
 */
export const fetchMultiKanjiStructures = () =>
  fetchStructuresFile().then((entries) => {
    const cache: MultiKanjiStructureData = {};
    for (const kanji of Object.keys(entries)) {
      const { hl, ka, sc, ya } = entries[kanji];
      cache[kanji] = {
        hlorenzi: hl ?? null,
        kanjium: ka ?? null,
        scott: sc ?? null,
        yagays: ya ?? null,
      };
    }
    return cache;
  });

const fetchReadingDetailsFile = createFetch<ReadingDetailsResponseType>(
  assetsPaths.KANJI_READING_DETAILS
);

/** Expand the stored `{r,t,f,w}` entries into named reading fields. */
export const fetchKanjiReadingDetails = () =>
  fetchReadingDetailsFile().then((entries) => {
    const cache: KanjiReadingsData = {};
    for (const kanji of Object.keys(entries)) {
      cache[kanji] = entries[kanji].map((entry) => ({
        reading: entry.r,
        type: entry.t,
        frequency: entry.f,
        example_word: entry.w,
      }));
    }
    return cache;
  });

const fetchVocabFile = createFetch<VocabResponseType>(assetsPaths.VOCAB_FILE);

/** Furigana is stored as one string per word; decode it back into segments. */
export const fetchSegmentedVocab = () =>
  fetchVocabFile().then((entries) => {
    const cache: Record<string, SegmentedVocabInfo> = {};
    for (const word of Object.keys(entries)) {
      const [furigana, meaning] = entries[word];
      cache[word] = { meaning, parts: decodeFurigana(furigana) };
    }
    return cache;
  });

export const transformToMainKanjiInfo = (
  raw: MainKanjiInfoItemType
): KanjiMainInfo => {
  const [
    keyword,
    on,
    kun,
    jlptRaw,
    freq,
    strokes,
    jouyouGrade,
    wk,
    kklcIndex,
    rtk,
    topoTwitterIndex,
    repWord,
    repReading,
  ] = raw;

  const jlptByRawLevel: Record<number, JLTPTtypes> = {
    5: "n5",
    4: "n4",
    3: "n3",
    2: "n2",
    1: "n1",
  };
  const jlpt: JLTPTtypes = jlptByRawLevel[jlptRaw] ?? "none";

  // TODO: This assumes that the "raw" which is the data from JSON
  // has no issues. (IE. No missing values, numbers are not string, undefined or NaN)
  // we can perform transformations here to make sure it is.
  return {
    keyword,
    on,
    kun,
    jlpt,
    strokes,
    jouyouGrade,
    wk,
    kklcIndex,
    rtk,
    topoTwitterIndex,
    repWord,
    repReading,
    frequency: {
      netflix: freq[0], //rank_netflix
      twitter: freq[1], //rank_twitter
      google: freq[2], //rank_google
      kd: freq[3], //rank_wkfr
      wikiChar: freq[4], //rank_wikipedia_char
      wikiDoc: freq[5], //rank_wikipedia_doc
      aozoraChar: freq[6], //rank_aozora_char
      aozoraDoc: freq[7], //rank_aozora_doc
      onlineNewsChar: freq[8], //rank_online_news_char
      onlineNewsDoc: freq[9], //rank_online_news_doc
      novels5100: freq[10], //rank_novels_5100
      dramaSubs: freq[11], //rank_drama_subtitles
      kuf: freq[12], //rank_kuf
      mcd: freq[13], //rank_mcd
      bunka: freq[14], //rank_bunka
      wkfr: freq[15], //rank_kd
      jisho: freq[16], //rank_jisho
      jiten: freq[17] ?? -1,
      jpdb: freq[18] ?? -1,
    },
  };
};

export const transformToGeneralKanjiInfo = ([
  meanings,
  allOn,
  allKun,
]: GeneralInfoResponseType[string]): KanjiGeneralInfo => {
  const hiraganaAllKun = (allKun ?? []).map((val) => wanakana.toHiragana(val));
  const hiraganaAllKunStripped = (allKun ?? []).map((val) =>
    wanakana.toHiragana(val.replace(/[-.。ー]/g, ""))
  );

  return {
    meanings: Array.from(new Set(meanings)),
    allOn: new Set((allOn ?? []).map((val) => wanakana.toHiragana(val))),
    allKun: new Set(hiraganaAllKun),
    allKunStripped: new Set(hiraganaAllKunStripped),
  };
};

export const transformToHoverKanjiInfo = ([
  parts,
  phonetic,
  mainVocab,
]: HoverInfoResponseType[string]): KanjiHoverInfo => ({
  parts: parts ?? [],
  phonetic: (phonetic ?? "").length > 0 ? phonetic : undefined,
  mainVocab: mainVocab ?? [],
});
