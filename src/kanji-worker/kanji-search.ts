import wanakana from "@/lib/wanakana-adapter";
import { JLPTOptionsCount, JLPTRank, JLTPTtypes } from "@/lib/jlpt";
import {
  KanjiExtendedInfo,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import { SearchSettings } from "@/lib/settings/settings";
import {
  K_JLPT,
  K_JOUYOU_KEY,
  K_MEANING_KEY,
  K_RTK_INDEX,
  K_STROKES,
  K_WK_LVL,
} from "@/lib/options/options-constants";
import { FREQ_RANK_OPTIONS_NONE_REMOVED } from "@/lib/options/options-arr";
import { getFrequency } from "@/lib/options/options-label-maps";
import { SortKey } from "@/lib/options/options-types";
import { radicalStrokeCountMap } from "@/lib/radicals";

type DataPool = {
  main: Record<string, KanjiMainInfo>;
  extended: Record<string, KanjiExtendedInfo>;
};

const jlptSort = (a: JLTPTtypes, b: JLTPTtypes) => {
  const rankA = JLPTRank[a];
  const rankB = JLPTRank[b];
  return rankA - rankB;
};

const alphaSort = (a: string, b: string) => {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA < lowerB) {
    return -1;
  }
  if (lowerA > lowerB) {
    return 1;
  }
  return 0;
};

const numericSort = (a: number, b: number) => {
  if (a === b) return 0;
  if (a === -1) return 1;
  if (b === -1) return -1;
  return a - b;
};

const freqSort = (a?: number | null, b?: number | null) => {
  const numA = a ?? Number.MAX_VALUE;
  const numB = b ?? Number.MAX_VALUE;
  return numA - numB;
};

export const filterByKanjiSimple = (
  allKanji: string[],
  settings: SearchSettings,
  kanjiPool: DataPool
) => {
  const jlptFilters = new Set(settings.filterSettings.jlpt);
  const minStrokes = settings.filterSettings.strokeRange.min;
  const maxStrokes = settings.filterSettings.strokeRange.max;
  const freqFilter = settings.filterSettings.freq;

  return allKanji
    .filter((kanji) => {
      const info = kanjiPool.main[kanji];
      if ([0, JLPTOptionsCount].includes(jlptFilters.size)) {
        return true;
      }
      return jlptFilters.has(info.jlpt);
    })
    .filter((kanji) => {
      const exInfo = kanjiPool.extended[kanji];
      const withinRange =
        maxStrokes >= exInfo.strokes && exInfo.strokes >= minStrokes;
      return withinRange;
    })
    .filter((kanji) => {
      if (freqFilter.source === "none") {
        return true;
      }
      const info = kanjiPool.main[kanji];
      const freq = getFrequency(freqFilter.source, info) ?? Number.MAX_VALUE;
      const withinRange =
        freq >= freqFilter.rankRange.min && freq <= freqFilter.rankRange.max;
      return withinRange;
    });
};

export const filterKanji = (
  allKanji: string[],
  settings: SearchSettings,
  kanjiPool: DataPool
) => {
  const textSearch = settings.textSearch;

  const trimmedSearchText = textSearch.text.trim();
  const textToSearch =
    textSearch.type === "onyomi" ||
    textSearch.type === "kunyomi" ||
    textSearch.type === "readings"
      ? wanakana.toHiragana(trimmedSearchText)
      : textSearch.type == "meanings" || textSearch.type === "keyword"
        ? wanakana.toRomaji(trimmedSearchText.toLowerCase())
        : trimmedSearchText;

  const kanjisToSearchList =
    textSearch.type === "multi-kanji"
      ? textToSearch.split("").filter((character) => {
          return (
            wanakana.isHiragana(character) === false &&
            wanakana.isKatakana(character) === false &&
            wanakana.isRomaji(character) === false &&
            wanakana.isJapanese(character)
          );
        })
      : [];

  const kanjiToSearchSet = new Set(kanjisToSearchList);

  // TODO: add logic early exit (return all)
  // when we know there's no need to filter
  // IE:
  // - all strokes selected
  // - no search text
  // - freq filter source = none
  // - all-jlpt selected
  // Also add a LRU cache of recently computed results
  const filteredBySearchText =
    textToSearch === ""
      ? allKanji
      : allKanji.filter((kanji) => {
          if (textSearch.type === "keyword") {
            const info = kanjiPool.main[kanji];

            // return fuzzysearch(textToSearch, info.keyword);
            return info.keyword.includes(textToSearch);
          }

          if (textSearch.type === "meanings") {
            const info = kanjiPool.main[kanji];
            const meanings = kanjiPool.extended[kanji].meanings;
            return (
              info.keyword.includes(textToSearch) ||
              meanings.find((meaning) => meaning.includes(textToSearch))
            );
          }

          const exInfo = kanjiPool.extended[kanji];
          if (textSearch.type === "kunyomi") {
            const hit = exInfo.allKunStripped.has(textToSearch);
            return hit;
          }

          if (textSearch.type === "onyomi") {
            return exInfo.allOn.has(textToSearch);
          }

          if (textSearch.type === "readings") {
            return (
              exInfo.allOn.has(textToSearch) ||
              exInfo.allKunStripped.has(textToSearch)
            );
          }

          if (textSearch.type === "multi-kanji") {
            return kanjiToSearchSet.has(kanji);
          }

          return true;
        });

  return filterByKanjiSimple(filteredBySearchText, settings, kanjiPool);
};

export const sortKanji = (
  kanjiList: string[],
  settings: SearchSettings,
  kanjiPool: DataPool
) => {
  const primarySort = settings.sortSettings.primary;
  const secondarySort = settings.sortSettings.secondary;

  if (primarySort === "none") {
    return kanjiList;
  }

  return kanjiList.sort((a, b) => {
    const infoA = kanjiPool.main[a];
    const infoB = kanjiPool.main[b];
    const exInfoA = kanjiPool.extended[a];
    const exInfoB = kanjiPool.extended[b];
    // TODO: Also add a LRU cache of recently computed results
    const sortBy = (sortKey: SortKey) => {
      if (sortKey === K_JLPT) {
        return jlptSort(infoA.jlpt, infoB.jlpt);
      }

      if (sortKey === K_JOUYOU_KEY) {
        return numericSort(exInfoA.jouyouGrade, exInfoB.jouyouGrade);
      }

      if (sortKey === K_STROKES) {
        return numericSort(exInfoA.strokes, exInfoB.strokes);
      }

      if (sortKey === K_WK_LVL) {
        return numericSort(exInfoA.wk, exInfoB.wk);
      }

      if (sortKey === K_RTK_INDEX) {
        return numericSort(exInfoA.rtk, exInfoB.rtk);
      }

      if (sortKey === K_MEANING_KEY) {
        return alphaSort(infoA.keyword, infoB.keyword);
      }

      if ((FREQ_RANK_OPTIONS_NONE_REMOVED as string[]).includes(sortKey)) {
        return freqSort(
          getFrequency(sortKey, infoA),
          getFrequency(sortKey, infoB)
        );
      }

      return 0;
    };

    const compareVal = sortBy(primarySort);
    if (compareVal != 0) {
      return compareVal;
    }

    return sortBy(secondarySort);
  });
};

export const searchKanji = (settings: SearchSettings, kanjiPool: DataPool) => {
  const allKanji = Object.keys(kanjiPool.main);
  const filteredKanji = filterKanji(allKanji, settings, kanjiPool);
  return sortKanji(filteredKanji, settings, kanjiPool);
};

export const getSortedByStrokeCount = (kanjiPool: DataPool) => {
  const allKanji = Object.keys(kanjiPool.main);
  return allKanji.sort((a, b) => {
    const exInfoA = kanjiPool.extended[a];
    const exInfoB = kanjiPool.extended[b];
    return numericSort(exInfoA.strokes, exInfoB.strokes);
  });
};

export const searchByRadical = (
  initialKanjis: string[],
  settings: SearchSettings,
  kanjiPool: DataPool,
  kanjiDecompositionCache: Record<string, Set<string>>
) => {
  // override minimum stroke count by user with
  // the largest stroke count given all the selected radicals
  // if largest strokecount is creater than user input minimum stroke count
  const prevMin = settings.filterSettings.strokeRange.min;
  const radicalPayload = [...settings.textSearch.text];
  const newMin = radicalPayload.reduce((acc, current) => {
    const count = radicalStrokeCountMap[current];
    return Math.max(acc, Number(count));
  }, prevMin);
  settings.filterSettings.strokeRange.min = newMin;

  // apply user filter settings first
  const filteredKanjisSimple = filterByKanjiSimple(
    initialKanjis,
    settings,
    kanjiPool
  );

  // if kanji has all the radicals in the set then include this in the search result
  const filteredKanjis = filteredKanjisSimple.filter((kanji) => {
    const kanjiRadicalSet = kanjiDecompositionCache[kanji];
    return radicalPayload.every((radical) => {
      return kanjiRadicalSet.has(radical);
    });
  });

  const kanjis = sortKanji(filteredKanjis, settings, kanjiPool);

  // get all radicals in all the remaining kanjis
  const possibleRadicals = kanjis.reduce((acc, kanji) => {
    const kanjiRadicalSet = kanjiDecompositionCache[kanji];
    kanjiRadicalSet.forEach((item) => acc.add(item));
    return acc;
  }, new Set<string>([]));

  return { kanjis, possibleRadicals };
};
