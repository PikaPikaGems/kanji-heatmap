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
  fetchRadicalPopoverText,
  fetchRadicals,
  fetchRepWordDetails,
  fetchSegmentedVocab,
  fetchSimilarKanjis,
  fetchSphmnComponents,
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
  sortKanji,
} from "./kanji-search";
import { prepareSphmnComponents } from "@/lib/sphmn-components";
import { SearchSettings, SortSettings } from "@/lib/settings/settings";
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
 * drawer's, as in scripts/sphmn-components.mjs.
 */
const handleSphmnDrawer = async (): Promise<
  [string, number, number | null][]
> => {
  const [sphmn, main, components] = await Promise.all([
    loadSphmnComponents(),
    CORE,
    loadComponents(),
  ]);
  return sphmn.order.map((component) => [
    component,
    sphmn.kanjiOf[component].length + (main[component] != null ? 1 : 0),
    main[component]?.strokes ?? components[component]?.n ?? null,
  ]);
};

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
  const [main, mainInfoMap, hoverMap, components, radicals, vocab] =
    await Promise.all([
      requireKanji(kanji),
      CORE,
      loadHoverInfo(),
      loadComponents(),
      loadRadicals(),
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
  const [mainInfoMap, similar] = await Promise.all([CORE, loadSimilar()]);
  // Kanji outside the main set still show, after the ones we know.
  const matches = similar[kanji] ?? [];
  return [
    ...matches.filter((match) => mainInfoMap[match] != null),
    ...matches.filter((match) => mainInfoMap[match] == null),
  ];
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
      loadHoverInfo(),
      loadVocab(),
      loadGeneralInfo(),
      loadSimilar(),
      loadDecomposition(),
      loadRepWordDetails(),
      loadStructures(),
      loadReadingDetails(),
      loadSphmnComponents(),
    ]);
    return null;
  },
  "component-map": () => loadComponents(),
  "rep-word-details": () => loadRepWordDetails(),
  "similar-map": () => loadSimilar(),
  "kanji-structure": handleKanjiStructure,
  "kanji-reading-details": handleKanjiReadingDetails,
  "radical-popover-text": handleRadicalPopoverText,
  "sphmn-drawer": handleSphmnDrawer,
  "sphmn-kanji-of": requirePayload(
    async ({
      component,
      sortSettings,
    }: {
      component: string;
      sortSettings: SortSettings;
    }) => {
      const [sphmn, main] = await Promise.all([loadSphmnComponents(), CORE]);
      // sortKanji sorts in place; copy so the dataset keeps sph-mn's order.
      const kanji = [...(sphmn.kanjiOf[component] ?? [])];
      return sortKanji(kanji, { sortSettings }, { main, extended: {} });
    }
  ),
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
