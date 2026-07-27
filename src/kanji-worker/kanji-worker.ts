import {
  ComponentsMap,
  InitSnapshot,
  KanjiGeneralInfo,
  KanjiHoverInfo,
  KanjiMainInfo,
  KanjiWorkerRequestName,
  OnMessageRequestType,
  PostMessageResponseType,
  SegmentedVocabInfo,
  WorkerApi,
} from "@/lib/kanji/kanji-worker-types";
import {
  fetchComponents,
  fetchGeneralKanjiInfo,
  fetchHoverKanjiInfo,
  fetchKanjiDecomposition,
  fetchKanjiReadingDetails,
  fetchMainKanjiInfo,
  fetchMultiKanjiStructures,
  fetchRepWordDetails,
  fetchSegmentedVocab,
  fetchSimilarKanjis,
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
  searchByRadical,
  searchKanji,
} from "./kanji-search";
import { SearchSettings } from "@/lib/settings/settings";

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

const loadGeneralInfo = lazyDataset(
  (): Promise<Record<string, KanjiGeneralInfo>> =>
    fetchGeneralKanjiInfo().then((raw) =>
      mapValues(raw, transformToGeneralKanjiInfo)
    )
);

const loadHoverInfo = lazyDataset(
  (): Promise<Record<string, KanjiHoverInfo>> =>
    fetchHoverKanjiInfo().then((raw) =>
      mapValues(raw, transformToHoverKanjiInfo)
    )
);

const loadVocab = lazyDataset(
  (): Promise<Record<string, SegmentedVocabInfo>> => fetchSegmentedVocab()
);

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

const loadRepWordDetails = lazyDataset(
  (): Promise<Record<string, [string, string]>> => fetchRepWordDetails()
);

/** Read only by the details "Character Structure" section. */
const loadStructures = lazyDataset(
  (): Promise<MultiKanjiStructureData> => fetchMultiKanjiStructures()
);

/** Read only by the details "Reading Usefulness" section. */
const loadReadingDetails = lazyDataset(
  (): Promise<KanjiReadingsData> => fetchKanjiReadingDetails()
);

// Starts immediately: the worker exists to answer questions about this map.
const CORE = loadMainInfo();

/** Kanji ordered by stroke count, the entry point for radical search. */
let kanjiByStrokeOrder: string[] = [];

const retrieveVocabInfo = (
  vocab: Record<string, SegmentedVocabInfo>,
  word?: string
) => {
  const entry = word == null ? null : vocab[word];
  if (word == null || entry == null) {
    return null;
  }

  return { word, meaning: entry.meaning, wordPartDetails: entry.parts };
};

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

const searchPool = async (settings: SearchSettings) => ({
  main: await CORE,
  extended: needsGeneralInfo(settings) ? await loadGeneralInfo() : {},
  similar: needsSimilar(settings) ? await loadSimilar() : {},
});

const handleSearch = requirePayload(async (settings: SearchSettings) => {
  const pool = await searchPool(settings);

  if (
    settings.textSearch.type === "radicals" &&
    settings.textSearch.text !== ""
  ) {
    const decomposition = await loadDecomposition();
    if (kanjiByStrokeOrder.length === 0) {
      kanjiByStrokeOrder = getSortedByStrokeCount(pool);
    }
    return searchByRadical(kanjiByStrokeOrder, settings, pool, decomposition);
  }

  return { kanjis: searchKanji(settings, pool) };
});

const handleSearchResultCount = requirePayload(
  async (settings: SearchSettings) => {
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
  const [main, mainInfoMap, hoverMap, components, vocab] = await Promise.all([
    requireKanji(kanji),
    CORE,
    loadHoverInfo(),
    loadComponents(),
    loadVocab(),
  ]);

  const hoverInfo = hoverMap[kanji];
  if (hoverInfo == null) {
    throw new Error("No information about this Kanji");
  }

  return extractKanjiHoverData(
    main,
    {
      ...hoverInfo,
      vocabInfo: {
        first: retrieveVocabInfo(vocab, hoverInfo.mainVocab[0]),
        second: retrieveVocabInfo(vocab, hoverInfo.mainVocab[1]),
      },
    },
    mainInfoMap,
    components
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
  const [mainInfoMap, similar] = await Promise.all([CORE, loadSimilar()]);
  return (similar[kanji] ?? []).filter((match) => mainInfoMap[match] != null);
});

const handleRetrieveVocabInfo = requirePayload(async (word: string) =>
  retrieveVocabInfo(await loadVocab(), word)
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

const handleKanjiReadingDetails = requirePayload(async (kanji: string) => {
  const readingDetails = await loadReadingDetails();
  const entries = readingDetails[kanji];
  // Kanji with no breakdown are absent; an empty array would render an empty
  // table instead of the "no info" state, so both collapse to null here.
  return entries == null || entries.length === 0 ? null : entries;
});

const HANDLERS: {
  [K in KanjiWorkerRequestName]: (
    payload: WorkerApi[K]["payload"]
  ) => WorkerApi[K]["response"] | Promise<WorkerApi[K]["response"]>;
} = {
  init: async (): Promise<InitSnapshot> => {
    const [mainInfoMap, componentsMap] = await Promise.all([
      CORE,
      loadComponents(),
    ]);
    return { mainInfoMap, componentsMap };
  },
  // Best-effort: allSettled so one failed fetch does not abort the rest;
  // lazyDataset clears failed promises so a later real request can retry.
  preload: async () => {
    await Promise.allSettled([
      loadHoverInfo(),
      loadVocab(),
      loadGeneralInfo(),
      loadSimilar(),
      loadDecomposition(),
      loadRepWordDetails(),
      loadStructures(),
      loadReadingDetails(),
    ]);
    return null;
  },
  "component-map": () => loadComponents(),
  "rep-word-details": () => loadRepWordDetails(),
  "similar-map": () => loadSimilar(),
  "kanji-structure": handleKanjiStructure,
  "kanji-reading-details": handleKanjiReadingDetails,
  "retrieve-vocab-info": handleRetrieveVocabInfo,
  search: handleSearch,
  "search-result-count": handleSearchResultCount,
  "kanji-hover": handleKanjiHover,
  "kanji-general": handleKanjiGeneral,
  "kanji-similar": handleKanjiSimilar,
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
