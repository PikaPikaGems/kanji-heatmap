import wanakana from "@/lib/wanakana-adapter";
import { JLPTOptionsCount, JLPTRank, JLTPTtypes } from "@/lib/jlpt";
import {
  KanjiExtendedInfo,
  KanjiMainInfo,
} from "@/lib/kanji/kanji-worker-types";
import { SearchSettings, SearchType } from "@/lib/settings/settings";
import {
  K_JLPT,
  K_JOUYOU_KEY,
  K_KKLC_INDEX,
  K_MEANING_KEY,
  K_RTK_INDEX,
  K_RTKB_INDEX,
  K_STROKES,
  K_WK_LVL,
} from "@/lib/options/options-constants";
import { FREQ_RANK_OPTIONS_NONE_REMOVED } from "@/lib/options/options-arr";
import { getFrequency } from "@/lib/options/options-label-maps";
import { SortKey } from "@/lib/options/options-types";
import { radicalStrokeCountMap } from "@/lib/radicals";
import { isKanji } from "@/lib/utils";

type DataPool = {
  main: Record<string, KanjiMainInfo>;
  extended: Record<string, KanjiExtendedInfo>;
  similar?: Record<string, string[]>;
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

// How each search type interprets the query text: how the text is normalized
// before matching, and what makes a kanji a hit. Adding a search type means
// adding one entry here (the SearchType record makes forgetting one a type
// error) instead of editing scattered branches inside filterKanji.
type MatchContext = {
  pool: DataPool;
  /** The normalized search text. */
  text: string;
  /** Kanji characters extracted from the text (for kanji-list searches). */
  kanjiSet: Set<string>;
};

type SearchDescriptor = {
  normalize: (trimmedText: string) => string;
  match: (kanji: string, ctx: MatchContext) => boolean;
};

const toHiraganaText = (text: string) => wanakana.toHiragana(text);
const toRomajiText = (text: string) => wanakana.toRomaji(text.toLowerCase());
const keepRawText = (text: string) => text;

// multi-kanji and the handwriting variants all match against the kanji
// characters found in the query text.
const kanjiListSearch: SearchDescriptor = {
  normalize: keepRawText,
  match: (kanji, { kanjiSet }) => kanjiSet.has(kanji),
};

// similar has its own expansion path in filterKanji, and radicals is handled
// by searchByRadical — inside plain text filtering both match everything.
const matchEverything: SearchDescriptor = {
  normalize: keepRawText,
  match: () => true,
};

const SEARCH_DESCRIPTORS: Record<SearchType, SearchDescriptor> = {
  keyword: {
    normalize: toRomajiText,
    match: (kanji, { pool, text }) => pool.main[kanji].keyword.includes(text),
  },
  meanings: {
    normalize: toRomajiText,
    match: (kanji, { pool, text }) =>
      pool.main[kanji].keyword.includes(text) ||
      pool.extended[kanji].meanings.find((meaning) =>
        meaning.includes(text)
      ) != null,
  },
  onyomi: {
    normalize: toHiraganaText,
    match: (kanji, { pool, text }) => pool.extended[kanji].allOn.has(text),
  },
  kunyomi: {
    normalize: toHiraganaText,
    match: (kanji, { pool, text }) =>
      pool.extended[kanji].allKunStripped.has(text),
  },
  readings: {
    normalize: toHiraganaText,
    match: (kanji, { pool, text }) =>
      pool.extended[kanji].allOn.has(text) ||
      pool.extended[kanji].allKunStripped.has(text),
  },
  "multi-kanji": kanjiListSearch,
  handwriting: kanjiListSearch,
  "handwriting-alt": kanjiListSearch,
  "handwriting-alt-2": kanjiListSearch,
  similar: matchEverything,
  radicals: matchEverything,
};

const extractKanjiCharacters = (text: string) =>
  text.split("").filter((character) => {
    return (
      wanakana.isHiragana(character) === false &&
      wanakana.isKatakana(character) === false &&
      wanakana.isRomaji(character) === false &&
      wanakana.isJapanese(character)
    );
  });

export const filterKanji = (
  allKanji: string[],
  settings: SearchSettings,
  kanjiPool: DataPool
) => {
  const textSearch = settings.textSearch;
  const descriptor = SEARCH_DESCRIPTORS[textSearch.type];
  const textToSearch = descriptor.normalize(textSearch.text.trim());

  if (textSearch.type === "similar" && textToSearch !== "") {
    const queryKanjis = textToSearch.split("").filter(isKanji);
    const similarMap = kanjiPool.similar ?? {};
    const ordered: string[] = [];
    const seen = new Set<string>();

    for (const kanji of queryKanjis) {
      if (!seen.has(kanji)) {
        ordered.push(kanji);
        seen.add(kanji);
      }
      for (const similar of similarMap[kanji] ?? []) {
        if (!seen.has(similar)) {
          ordered.push(similar);
          seen.add(similar);
        }
      }
    }

    const inPool = ordered.filter((kanji) => kanjiPool.main[kanji] != null);
    return filterByKanjiSimple(inPool, settings, kanjiPool);
  }

  // TODO: add logic early exit (return all)
  // when we know there's no need to filter
  // IE:
  // - all strokes selected
  // - no search text
  // - freq filter source = none
  // - all-jlpt selected
  // Also add a LRU cache of recently computed results
  const ctx: MatchContext = {
    pool: kanjiPool,
    text: textToSearch,
    kanjiSet: new Set(extractKanjiCharacters(textToSearch)),
  };
  const filteredBySearchText =
    textToSearch === ""
      ? allKanji
      : allKanji.filter((kanji) => descriptor.match(kanji, ctx));

  return filterByKanjiSimple(filteredBySearchText, settings, kanjiPool);
};

type KanjiEntry = {
  main: KanjiMainInfo;
  extended: KanjiExtendedInfo;
};

type SortComparator = (a: KanjiEntry, b: KanjiEntry) => number;

// One comparator per sort key; unknown keys (e.g. "none" as a secondary)
// simply don't compare.
const SORT_COMPARATORS: Record<string, SortComparator> = {
  [K_JLPT]: (a, b) => jlptSort(a.main.jlpt, b.main.jlpt),
  [K_JOUYOU_KEY]: (a, b) =>
    numericSort(a.extended.jouyouGrade, b.extended.jouyouGrade),
  [K_STROKES]: (a, b) => numericSort(a.extended.strokes, b.extended.strokes),
  [K_WK_LVL]: (a, b) => numericSort(a.extended.wk, b.extended.wk),
  [K_RTK_INDEX]: (a, b) => numericSort(a.extended.rtk, b.extended.rtk),
  [K_RTKB_INDEX]: (a, b) => numericSort(a.extended.rtkb, b.extended.rtkb),
  [K_KKLC_INDEX]: (a, b) =>
    numericSort(a.extended.kklcIndex, b.extended.kklcIndex),
  [K_MEANING_KEY]: (a, b) => alphaSort(a.main.keyword, b.main.keyword),
  ...Object.fromEntries(
    FREQ_RANK_OPTIONS_NONE_REMOVED.map((freqKey) => [
      freqKey,
      ((a, b) =>
        freqSort(
          getFrequency(freqKey, a.main),
          getFrequency(freqKey, b.main)
        )) satisfies SortComparator,
    ])
  ),
};

const compareBy = (sortKey: SortKey, a: KanjiEntry, b: KanjiEntry) =>
  SORT_COMPARATORS[sortKey]?.(a, b) ?? 0;

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

  // TODO: Also add a LRU cache of recently computed results
  return kanjiList.sort((a, b) => {
    const entryA = { main: kanjiPool.main[a], extended: kanjiPool.extended[a] };
    const entryB = { main: kanjiPool.main[b], extended: kanjiPool.extended[b] };

    const compareVal = compareBy(primarySort, entryA, entryB);
    if (compareVal != 0) {
      return compareVal;
    }

    return compareBy(secondarySort, entryA, entryB);
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
