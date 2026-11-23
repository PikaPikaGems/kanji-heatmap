import {
  ComponentsMap,
  InitSnapshot,
  KanjiGeneralInfo,
  KanjiHoverInfo,
  KanjiMainInfo,
  KanjiWorkerRequestName,
  OnMessageRequestType,
  PostMessageResponseType,
  SearchRequest,
  VocabInfoResponse,
  WorkerApi,
} from "@/lib/kanji/kanji-worker-types";
import type { VocabExtendedInfo } from "@/lib/kanji/kanji-info-types";
import {
  toAnchorWordBasics,
  withFrequencyTags,
  type AnchorIndex,
  type AnchorWordBasics,
  type KanjiAnchorWords,
} from "@/lib/kanji/anchor-words";
import { decodeFurigana } from "@/lib/furigana";
import {
  fetchComponents,
  fetchGeneralKanjiInfo,
  fetchIndonesianMeanings,
  fetchKanjiDecomposition,
  fetchKanjiParts,
  fetchKanjiReadingDetails,
  fetchKanjiWords,
  fetchMainKanjiInfo,
  fetchMultiKanjiStructures,
  fetchRadicalPopoverText,
  fetchRadicals,
  fetchSimilarKanjis,
  fetchSphmnComponents,
  fetchWordMeanings,
  fetchWordRanks,
  fetchWordReadings,
  fetchWordTags,
  transformToGeneralKanjiInfo,
  transformToHoverKanjiInfo,
  transformToMainKanjiInfo,
} from "./helpers";
import type {
  KanjiReadingsData,
  MultiKanjiStructureData,
} from "@/lib/kanji-section-constants";
import {
  extractKanjiGeneralData,
  extractKanjiHoverData,
} from "./kanji-assembly";
import {
  filterKanji,
  getSortedByStrokeCount,
  searchByParts,
  searchByRadical,
  searchKanji,
} from "./kanji-search";
import { prepareSphmnComponents } from "@/lib/sphmn-components";
import { SearchSettings } from "@/lib/settings/settings";
import {
  followAlias,
  prepareRadicals,
  radicalFamily,
  RadicalPopoverDetails,
  RadicalPopoverText,
  resolveRadicalForSearch,
} from "@/lib/radicals";

// ---------------------------------------------------------------------------
// Datasets
//
// The main info is the only file loaded up front: the grid cannot paint
// without it, and sort/filter settings arriving in the URL read from it. Every
// other dataset is fetched the first time a request actually needs it, behind
// the loading UI that surface already has.
// ---------------------------------------------------------------------------

/** Fetch once, remember the promise, and allow a retry if it fails. */
const lazyDataset = <T>(load: () => Promise<T>) => {
  let pending: Promise<T> | null = null;

  return () => {
    if (pending == null) {
      pending = load().catch((error) => {
        pending = null;
        throw error;
      });
    }
    return pending;
  };
};

const mapValues = <Raw, Value>(
  entries: Record<string, Raw>,
  transform: (raw: Raw) => Value
): Record<string, Value> => {
  const result: Record<string, Value> = {};
  for (const key of Object.keys(entries)) {
    result[key] = transform(entries[key]);
  }
  return result;
};

const loadMainInfo = lazyDataset(
  (): Promise<Record<string, KanjiMainInfo>> =>
    fetchMainKanjiInfo().then((raw) => mapValues(raw, transformToMainKanjiInfo))
);

const loadComponents = lazyDataset(
  (): Promise<ComponentsMap> => fetchComponents()
);

const loadRadicals = lazyDataset(() => fetchRadicals().then(prepareRadicals));

const loadGeneralInfo = lazyDataset(
  (): Promise<Record<string, KanjiGeneralInfo>> =>
    fetchGeneralKanjiInfo().then((raw) =>
      mapValues(raw, transformToGeneralKanjiInfo)
    )
);

/** Parts and sound part: the hover card and the details component breakdown. */
const loadKanjiParts = lazyDataset(
  (): Promise<Record<string, KanjiHoverInfo>> =>
    fetchKanjiParts().then((raw) => mapValues(raw, transformToHoverKanjiInfo))
);

/**
 * Each kanji's anchor and sample words. Asked for right after `init` (the
 * anchor index), so tiles, the anchor-words filter and mastery have it early.
 */
const loadKanjiWords = lazyDataset(fetchKanjiWords);

/** Every anchor and sample word's readings ("・"-joined): tiles and popovers. */
const loadWordReadings = lazyDataset(fetchWordReadings);

/** Every anchor and sample word's gloss: the card, popovers, drawer and games. */
const loadWordMeanings = lazyDataset(fetchWordMeanings);

/** Tags and tier per anchor and sample word: word popovers and the drawer. */
const loadWordTags = lazyDataset(fetchWordTags);

/** 17 ranks per anchor word: only the anchor panel's frequency table. */
const loadWordRanks = lazyDataset(fetchWordRanks);

/**
 * The radical-search index: which drawer-selectable radicals each kanji
 * contains. Only `searchByRadical` reads it — multi-kanji and handwriting
 * searches match the kanji characters in the query directly.
 */
const loadDecomposition = lazyDataset(
  (): Promise<Record<string, Set<string>>> =>
    fetchKanjiDecomposition().then((raw) =>
      mapValues(raw, (chars) => new Set([...chars]))
    )
);

/**
 * Read by similar search, by the details "Character Structure" section (which
 * lists similar kanji), and by the practice game.
 */
const loadSimilar = lazyDataset(
  (): Promise<Record<string, string[]>> => fetchSimilarKanjis()
);

/** Component search and the sph-mn rows of the kanji details. */
const loadSphmnComponents = lazyDataset(() =>
  fetchSphmnComponents().then(prepareSphmnComponents)
);

/** Read only by the radical popover. */
const loadRadicalPopoverText = lazyDataset(
  (): Promise<Record<string, RadicalPopoverText>> => fetchRadicalPopoverText()
);

/** Read only by the details "Character Structure" section. */
const loadStructures = lazyDataset(
  (): Promise<MultiKanjiStructureData> => fetchMultiKanjiStructures()
);

/** Read only by the details "Reading Usefulness" section. */
const loadReadingDetails = lazyDataset(
  (): Promise<KanjiReadingsData> => fetchKanjiReadingDetails()
);

/**
 * Each kanji's Indonesian meanings, split once from "a,b". Read by the details
 * "Indonesian Meanings" row and by opted-in "meanings" searches; both are
 * opt-in, so it is not part of `preload`.
 */
const loadIndonesianMeanings = lazyDataset(() =>
  fetchIndonesianMeanings().then((joinedByKanji) => {
    const meaningsByKanji: Record<string, string[]> = {};
    for (const [kanji, joined] of Object.entries(joinedByKanji)) {
      const meanings = joined
        .split(",")
        .map((meaning) => meaning.trim())
        .filter((meaning) => meaning !== "");
      if (meanings.length > 0) meaningsByKanji[kanji] = meanings;
    }
    return meaningsByKanji;
  })
);

// Starts immediately: the worker exists to answer questions about this map.
const CORE = loadMainInfo();

/** Kanji ordered by stroke count, the entry point for radical search. */
let kanjiByStrokeOrder: string[] = [];

/** A sample word from its furigana slot in kanji_words.json, with its gloss. */
const sampleWordInfo = (
  furigana: string | undefined,
  meanings: Record<string, string>
) => {
  if (!furigana) return null;
  const parts = decodeFurigana(furigana);
  const word = parts.map(([text]) => text).join("");
  return { word, meaning: meanings[word] ?? "", wordPartDetails: parts };
};

/** Every kanji's main word, its readings and its secondary word. */
const loadAnchorIndex = lazyDataset(async (): Promise<AnchorIndex> => {
  const [words, readings] = await Promise.all([
    loadKanjiWords(),
    loadWordReadings(),
  ]);
  const index: AnchorIndex = {};
  for (const [kanji, [main, secondary]] of Object.entries(words)) {
    if (!main) continue;
    index[kanji] = { word: main, reading: readings[main] ?? "", secondary };
  }
  return index;
});

/** Every kanji's anchor words with readings and glosses. */
const loadAnchorWordsDetails = lazyDataset(
  async (): Promise<Record<string, KanjiAnchorWords<AnchorWordBasics>>> => {
    const [words, readings, meanings] = await Promise.all([
      loadKanjiWords(),
      loadWordReadings(),
      loadWordMeanings(),
    ]);
    const basics = (word: string) =>
      toAnchorWordBasics(word, readings[word], meanings[word]);
    const details: Record<string, KanjiAnchorWords<AnchorWordBasics>> = {};
    for (const [kanji, [main, secondary]] of Object.entries(words)) {
      if (!main) continue;
      details[kanji] = {
        main: basics(main),
        secondary: secondary ? basics(secondary) : null,
      };
    }
    return details;
  }
);

// ---------------------------------------------------------------------------
// Request handlers
//
// Each awaits the datasets it needs, so there is no "not initialized" state to
// guard against: a request that arrives early resolves a moment later instead
// of erroring.
// ---------------------------------------------------------------------------

const MISSING_PAYLOAD_MESSAGE =
  "Please provide both an eventType and payload. One of them is missing";

const requirePayload =
  <P, R>(run: (payload: P) => R) =>
  (payload: P | undefined): R => {
    if (payload == null) {
      throw new Error(MISSING_PAYLOAD_MESSAGE);
    }
    return run(payload);
  };

/** Only text searches read meanings and readings. */
const needsGeneralInfo = (settings: SearchSettings) =>
  settings.textSearch.text !== "" &&
  ["keyword", "meanings", "onyomi", "kunyomi", "readings"].includes(
    settings.textSearch.type
  );

const needsSimilar = (settings: SearchSettings) =>
  settings.textSearch.type === "similar" && settings.textSearch.text !== "";

const needsIndonesian = (request: SearchRequest) =>
  request.includeIndonesian === true &&
  request.textSearch.type === "meanings" &&
  request.textSearch.text !== "";

/**
 * Loaded on the first opted-in "meanings" search when the switch or a details
 * drawer hasn't loaded it yet. A failed load still answers with the English
 * matches (and lazyDataset lets the next search retry).
 */
const searchIndonesian = (request: SearchRequest) =>
  needsIndonesian(request)
    ? loadIndonesianMeanings().catch(() => ({}))
    : Promise.resolve({});

const searchPool = async (request: SearchRequest) => ({
  main: await CORE,
  extended: needsGeneralInfo(request) ? await loadGeneralInfo() : {},
  similar: needsSimilar(request) ? await loadSimilar() : {},
  indonesian: await searchIndonesian(request),
});

const handleSearch = requirePayload(async (settings: SearchRequest) => {
  const pool = await searchPool(settings);

  if (
    settings.textSearch.type === "radicals" &&
    settings.textSearch.text !== ""
  ) {
    const decomposition = await loadDecomposition();
    const radicals = await loadRadicals();
    if (kanjiByStrokeOrder.length === 0) {
      kanjiByStrokeOrder = getSortedByStrokeCount(pool);
    }
    const resolvedText = [...settings.textSearch.text]
      .map((ch) => resolveRadicalForSearch(ch, radicals))
      .join("");
    return searchByRadical(
      kanjiByStrokeOrder,
      {
        ...settings,
        textSearch: { ...settings.textSearch, text: resolvedText },
      },
      pool,
      decomposition,
      radicals.strokeCountMap
    );
  }

  if (
    settings.textSearch.type === "components" &&
    settings.textSearch.text !== ""
  ) {
    const sphmn = await loadSphmnComponents();
    if (kanjiByStrokeOrder.length === 0) {
      kanjiByStrokeOrder = getSortedByStrokeCount(pool);
    }
    return searchByParts(
      kanjiByStrokeOrder,
      [...settings.textSearch.text],
      settings,
      pool,
      sphmn.searchIndex
    );
  }

  return { kanjis: searchKanji(settings, pool) };
});

/**
 * The component drawer, in order, each with how many kanji component search
 * returns for it (the kanji that contain it, plus itself when it's a kanji)
 * and its stroke count when known: the kanji's own, else the radical
 * drawer's.
 */
const handleSphmnDrawer = async (): Promise<
  [string, number, number | null][]
> => {
  // Stroke counts only order ties: a kanji's own, else the radical drawer's.
  const [sphmn, main, radicals] = await Promise.all([
    loadSphmnComponents(),
    CORE,
    loadRadicals(),
  ]);
  return sphmn.order.map((component) => [
    component,
    sphmn.kanjiOf[component].length + (main[component] != null ? 1 : 0),
    main[component]?.strokes ??
      (radicals.strokeCountMap[component] != null
        ? Number(radicals.strokeCountMap[component])
        : null),
  ]);
};

const handleSearchResultCount = requirePayload(
  async (settings: SearchRequest) => {
    const pool = await searchPool(settings);
    return filterKanji(Object.keys(pool.main), settings, pool).length;
  }
);

const requireKanji = async (kanji: string) => {
  const main = (await CORE)[kanji];
  if (main == null) {
    throw new Error("No information about this Kanji");
  }
  return main;
};

const handleKanjiHover = requirePayload(async (kanji: string) => {
  const [main, mainInfoMap, partsMap, components, radicals, words, meanings] =
    await Promise.all([
      requireKanji(kanji),
      CORE,
      loadKanjiParts(),
      loadComponents(),
      loadRadicals(),
      loadKanjiWords(),
      loadWordMeanings(),
    ]);

  const partsInfo = partsMap[kanji];
  if (partsInfo == null) {
    throw new Error("No information about this Kanji");
  }

  const [, , sample1, sample2] = words[kanji] ?? [];
  const vocabInfo: VocabExtendedInfo["vocabInfo"] = {
    first: sampleWordInfo(sample1, meanings),
    second: sampleWordInfo(sample2, meanings),
  };
  return extractKanjiHoverData(
    main,
    { ...partsInfo, vocabInfo },
    mainInfoMap,
    components,
    radicals.aliases
  );
});

const handleKanjiGeneral = requirePayload(async (kanji: string) => {
  const [main, generalMap] = await Promise.all([
    requireKanji(kanji),
    loadGeneralInfo(),
  ]);

  const generalInfo = generalMap[kanji];
  if (generalInfo == null) {
    throw new Error("No information about this Kanji");
  }

  return extractKanjiGeneralData(main, generalInfo);
});

const handleKanjiSimilar = requirePayload(async (kanji: string) => {
  const similar = await loadSimilar();
  // Most similar first, including kanji outside the main set.
  return similar[kanji] ?? [];
});

const handleSimilarForKanji = requirePayload(async (kanji: string[]) => {
  const similar = await loadSimilar();
  return Object.fromEntries(kanji.map((k) => [k, similar[k] ?? []]));
});

/** A word's readings and gloss, for word popovers; null outside the word set. */
const handleRetrieveVocabInfo = requirePayload(
  async (word: string): Promise<VocabInfoResponse> => {
    const [readings, meanings] = await Promise.all([
      loadWordReadings(),
      loadWordMeanings(),
    ]);
    const reading = readings[word];
    const meaning = meanings[word];
    if (reading == null && meaning == null) return null;
    return { word, reading: reading ?? "", meaning: meaning ?? "" };
  }
);

/**
 * Both detail sections answer for one kanji. The whole map stays in the worker
 * — sending it to the main thread would put a second copy of it there, which
 * is the duplication this redesign set out to remove.
 */
const handleKanjiStructure = requirePayload(async (kanji: string) => {
  const structures = await loadStructures();
  return structures[kanji] ?? null;
});

/**
 * One kanji's anchor words with their tags, ranks and tier. Per kanji, so the
 * drawer never copies the whole word files to the main thread.
 */
const handleKanjiAnchorWords = requirePayload(
  async (kanji: string): Promise<KanjiAnchorWords | null> => {
    const [details, tags, ranks] = await Promise.all([
      loadAnchorWordsDetails(),
      loadWordTags(),
      loadWordRanks(),
    ]);
    const basics = details[kanji];
    if (basics == null) return null;
    const withTags = (word: AnchorWordBasics) =>
      withFrequencyTags(word, tags[word.word], ranks[word.word]);
    return {
      main: withTags(basics.main),
      secondary: basics.secondary ? withTags(basics.secondary) : null,
    };
  }
);

/** One word's tags and tier (anchor and sample words); null when it has none. */
const handleWordTags = requirePayload(async (word: string) => {
  const entry = (await loadWordTags())[word];
  if (entry == null) return null;
  const [tags, tier] = entry;
  return { tags: tags.split(",").filter((tag) => tag !== ""), tier };
});

const handleKanjiReadingDetails = requirePayload(async (kanji: string) => {
  const readingDetails = await loadReadingDetails();
  const entries = readingDetails[kanji];
  // Kanji with no breakdown are absent; an empty array would render an empty
  // table instead of the "no info" state, so both collapse to null here.
  return entries == null || entries.length === 0 ? null : entries;
});

/** One kanji's Indonesian meanings; null when it has none. */
const handleIndonesianMeanings = requirePayload(
  async (kanji: string) => (await loadIndonesianMeanings())[kanji] ?? null
);

/**
 * One radical's popover text, following aliases (氵 → ⺡) like every other
 * radical fact, plus the sounds it gives as a sound part. Null when there is
 * neither.
 */
const handleRadicalPopoverText = requirePayload(
  async (radical: string): Promise<RadicalPopoverDetails | null> => {
    const [texts, radicals, components] = await Promise.all([
      loadRadicalPopoverText(),
      loadRadicals(),
      loadComponents(),
    ]);
    const textOf = (char: string) => {
      const glyph = followAlias(char, radicals.aliases, (g) => g in texts);
      return glyph == null ? null : texts[glyph];
    };
    const glyph = followAlias(radical, radicals.aliases, (g) => g in texts);
    let text: RadicalPopoverDetails = glyph == null ? {} : texts[glyph];
    // A form without its own origin shows its family head's (⺡ → 水),
    // followed by its own note.
    const family = radicalFamily(radical, radicals);
    const headText =
      family != null && family.head !== family.current
        ? textOf(family.head)
        : null;
    if (text.cn == null && headText?.cn != null) {
      text = {
        ...text,
        cn: headText.cn,
        refs: [...(headText.refs ?? []), ...(text.refs ?? [])],
      };
    }
    const sounds = components[glyph ?? radical]?.s;
    if (glyph == null && sounds == null && text.cn == null) return null;
    return sounds == null ? text : { ...text, sounds };
  }
);

const HANDLERS: {
  [K in KanjiWorkerRequestName]: (
    payload: WorkerApi[K]["payload"]
  ) => WorkerApi[K]["response"] | Promise<WorkerApi[K]["response"]>;
} = {
  init: async (): Promise<InitSnapshot> => {
    const [mainInfoMap, componentsMap, radicals] = await Promise.all([
      CORE,
      loadComponents(),
      loadRadicals(),
    ]);
    return { mainInfoMap, componentsMap, radicals };
  },
  // Best-effort: allSettled so one failed fetch does not abort the rest;
  // lazyDataset clears failed promises so a later real request can retry.
  preload: async () => {
    await Promise.allSettled([
      loadAnchorIndex(),
      loadKanjiParts(),
      loadWordMeanings(),
      loadGeneralInfo(),
      loadSimilar(),
      loadDecomposition(),
      loadAnchorWordsDetails(),
      loadWordTags(),
      loadStructures(),
      loadReadingDetails(),
      loadSphmnComponents(),
    ]);
    return null;
  },
  "component-map": () => loadComponents(),
  "anchor-index": () => loadAnchorIndex(),
  "anchor-words-details": () => loadAnchorWordsDetails(),
  "kanji-anchor-words": handleKanjiAnchorWords,
  "word-tags": handleWordTags,
  "similar-map": () => loadSimilar(),
  "kanji-structure": handleKanjiStructure,
  "kanji-reading-details": handleKanjiReadingDetails,
  "indonesian-meanings-load": async () => {
    await loadIndonesianMeanings();
    return null;
  },
  "indonesian-meanings": handleIndonesianMeanings,
  "radical-popover-text": handleRadicalPopoverText,
  "sphmn-drawer": handleSphmnDrawer,
  "retrieve-vocab-info": handleRetrieveVocabInfo,
  search: handleSearch,
  "search-result-count": handleSearchResultCount,
  "kanji-hover": handleKanjiHover,
  "kanji-general": handleKanjiGeneral,
  "kanji-similar": handleKanjiSimilar,
  "similar-for-kanji": handleSimilarForKanji,
};

self.onmessage = function (event: { data: OnMessageRequestType }) {
  const { id, data } = event.data;
  const eventType = data.type;
  const payload = data.payload;

  const postReply = (response: PostMessageResponseType["response"]) => {
    self.postMessage({ id, response } satisfies PostMessageResponseType);
  };

  const postError = (message: string, cause?: unknown) => {
    const response: PostMessageResponseType["response"] = {
      requestType: eventType,
      status: "ERRORED",
      error: { message: `Message:${message}, request:${eventType} failed` },
    };
    console.error({ id, response }, cause);
    postReply(response);
  };

  const handler = (
    HANDLERS as Record<string, ((payload: unknown) => unknown) | undefined>
  )[eventType];

  if (handler == null) {
    postError(
      eventType == null || payload == null
        ? MISSING_PAYLOAD_MESSAGE
        : "Not implemented"
    );
    return;
  }

  // Wrapping in a resolved promise means a handler can throw or reject and
  // only that request fails; the worker itself stays alive.
  Promise.resolve()
    .then(() => handler(payload))
    .then((responseData) =>
      postReply({
        requestType: eventType,
        status: "COMPLETED",
        data: responseData,
      })
    )
    .catch((error: unknown) =>
      postError(error instanceof Error ? error.message : String(error), error)
    );
};
