import wanakana from "@/lib/wanakana-adapter";
import { JLTPTtypes } from "@/lib/jlpt";
import {
  ExtendedKanjiInfoItemType,
  ExtendedKanjiInfoResponseType,
  FreqList,
  KanjiExtendedInfo,
  KanjiMainInfo,
  MainKanjiInfoResponseType,
  SegmentedVocabInfo,
  WordPartDetail,
} from "@/lib/kanji/kanji-worker-types";
import assetsPaths from "@/lib/assets-paths";

export const kanjiMainInfoCache: Record<string, KanjiMainInfo> = {};
export const kanjiOtherInfoCache: Record<string, KanjiExtendedInfo> = {};

const createFetch = <T>(path: string) => {
  return () =>
    fetch(path).then((response) => {
      const json = response.json();
      return json as Promise<T>;
    });
};

export const fetchMainManjiInfo = createFetch<MainKanjiInfoResponseType>(
  assetsPaths.MAIN_KANJI_INFO_FILE_PATH
);

export const fetchExtendedKanjiInfo =
  createFetch<ExtendedKanjiInfoResponseType>(
    assetsPaths.EXTENDED_KANJI_INFO_FILE_PATH
  );

export const fetchPhoneticInfo = createFetch<Record<string, string>>(
  assetsPaths.PHONETIC_FILE
);

export const fetchPartKeywordInfo = createFetch<Record<string, string>>(
  assetsPaths.PART_KEYWORD_FILE
);

export const fetchKanjiDecomposition = createFetch<Record<string, string>>(
  assetsPaths.KANJI_DECOMPOSITION
);

export const fetchVocabFurigana = createFetch<Record<string, WordPartDetail[]>>(
  assetsPaths.VOCAB_FURIGANA
);

export const fetchVocabMeaning = createFetch<Record<string, string>>(
  assetsPaths.VOCAB_MEANING
);

export const fetchSegmentedVocab = () => {
  return Promise.all([fetchVocabFurigana(), fetchVocabMeaning()]).then(
    async (result) => {
      const [allFurigana, allMeanings] = result;

      const allWords = Object.keys(allFurigana);
      const cache: Record<string, SegmentedVocabInfo> = {};
      allWords.forEach((word) => {
        cache[word] = {
          meaning: allMeanings[word],
          parts: allFurigana[word],
        };
      });

      return cache;
    }
  );
};

export const transformToMainKanjiInfo = (
  raw: [string, string, string, number, FreqList]
): KanjiMainInfo => {
  const [keyword, on, kun, jlptRaw, freq] = raw;

  const jlpt: JLTPTtypes =
    jlptRaw === 5
      ? "n5"
      : jlptRaw === 4
        ? "n4"
        : jlptRaw === 3
          ? "n3"
          : jlptRaw === 2
            ? "n2"
            : jlptRaw === 1
              ? "n1"
              : "none";

  // TODO: This assumes that the "raw" which is the data from JSON
  // has no issues. (IE. No missing values, numbers are not string, undefined or NaN)
  // we can perform transformations here to make sure it is.
  return {
    keyword,
    on,
    kun,
    jlpt,
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
      jiten: freq[17] ?? 10_000,
      jpdb: freq[18] ?? 10_000,
    },
  };
};

export const transformToExtendedKanjiInfo = (
  item: ExtendedKanjiInfoItemType
): KanjiExtendedInfo => {
  const [
    parts,
    strokes,
    rtk,
    wk,
    jouyouGrade,
    meanings,
    allOn,
    allKun,
    phonetic,
    mainVocab,
    kklcIndex,
  ] = item;

  const hiraganaAllKun = (allKun ?? []).map((val) => wanakana.toHiragana(val));
  const hiraganaAllKunStripped = (allKun ?? []).map((val) =>
    wanakana.toHiragana(val.replace(/[-.。ー]/g, ""))
  );

  return {
    parts: new Set(parts),
    strokes,
    rtk,
    wk,
    jouyouGrade,
    meanings: Array.from(new Set(meanings)),
    allOn: new Set((allOn ?? []).map((val) => wanakana.toHiragana(val))),
    allKun: new Set(hiraganaAllKun),
    allKunStripped: new Set(hiraganaAllKunStripped),
    phonetic: (phonetic ?? "").length > 0 ? phonetic : undefined,
    mainVocab,
    kklcIndex: kklcIndex ?? 10_000,
  };
};
