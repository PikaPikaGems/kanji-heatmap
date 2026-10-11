import assetsPaths from "@/lib/assets-paths";
import { localKanjiSvgUrl } from "@/lib/kanji-svg-url";
import type { MainKanjiInfoResponseType } from "@/lib/kanji/kanji-worker-types";
import type { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import setChunks from "@/lib/fill-the-kanji/set-chunks.json";

const CONCURRENCY = 6;
const KATAKANA_CHALLENGE_SET_COUNT = 200;

export const KANJI_SVG_CACHE_NAME = "kanji-svg-cache";
export const KATAKANA_CACHE_NAME = "kanji-heatmap-katakana-cache";
export const FILL_THE_KANJI_CACHE_NAME = "kanji-heatmap-fill-the-kanji-cache";

type CancellablePreload = {
  promise: Promise<void>;
  cancel: () => void;
};

const katakanaChallengeUrl = (setNumber: number) =>
  `${assetsPaths.SPEED_KATAKANA_CHALLENGE_SET}${setNumber}.json`;

/** Per set: a version plus one content hash per chunk file (generator output). */
const SET_CHUNKS = setChunks as Record<
  string,
  { version: string; chunks: string[] } | undefined
>;

const setVersion = (setId: FillTheKanjiSetId) =>
  SET_CHUNKS[setId]?.version ?? "0";

/** Folder holding a set's chunk files, e.g. /json/fill-the-kanji/n5/. */
const fillTheKanjiSetDir = (setId: FillTheKanjiSetId) =>
  `${assetsPaths.FILL_THE_KANJI_SET}${setId}/`;

/**
 * Versioned URL of one chunk (`<set>/<chunk>.json?v=<content hash>`). The PWA
 * caches these with no age limit (vite.config.ts), so a changed chunk needs a
 * new URL to be fetched again.
 */
export const fillTheKanjiChunkUrl = (setId: FillTheKanjiSetId, chunk: number) =>
  `${fillTheKanjiSetDir(setId)}${chunk}.json?v=${
    SET_CHUNKS[setId]?.chunks[chunk] ?? "0"
  }`;

const fillTheKanjiChunkUrls = (setId: FillTheKanjiSetId) =>
  (SET_CHUNKS[setId]?.chunks ?? []).map((_, chunk) =>
    fillTheKanjiChunkUrl(setId, chunk)
  );

/** localStorage flag set once a challenge set has been downloaded. */
export const FILL_THE_KANJI_PRELOAD_KEY_PREFIX =
  "fill-the-kanji-preload-complete-";

/** Includes the set's version, so a changed set no longer counts as downloaded. */
export const fillTheKanjiPreloadKey = (setId: FillTheKanjiSetId) =>
  `${FILL_THE_KANJI_PRELOAD_KEY_PREFIX}${setId}@${setVersion(setId)}`;

/** Flags for older downloads of a set: the unversioned key or another version. */
const staleFillTheKanjiPreloadKeys = (setId: FillTheKanjiSetId) => {
  const base = `${FILL_THE_KANJI_PRELOAD_KEY_PREFIX}${setId}`;
  const current = fillTheKanjiPreloadKey(setId);
  return Object.keys(localStorage).filter(
    (key) => key !== current && (key === base || key.startsWith(`${base}@`))
  );
};

/** True when an older version of the set was downloaded but not this one. */
export const hasOutdatedFillTheKanjiDownload = (setId: FillTheKanjiSetId) =>
  localStorage.getItem(fillTheKanjiPreloadKey(setId)) !== "true" &&
  staleFillTheKanjiPreloadKeys(setId).length > 0;

const removeStaleFillTheKanjiPreloadKeys = (setId: FillTheKanjiSetId) => {
  staleFillTheKanjiPreloadKeys(setId).forEach((key) =>
    localStorage.removeItem(key)
  );
};

/**
 * Fires `fetch` for each url with bounded concurrency so the existing
 * Workbox CacheFirst rules populate their caches as a side effect. Response
 * bodies are discarded — only the caching side effect matters. Individual
 * failures are swallowed so one bad asset doesn't abort the whole batch.
 */
function runPool(
  urls: string[],
  onProgress?: (done: number, total: number) => void
): CancellablePreload {
  let cancelled = false;
  let done = 0;
  const total = urls.length;
  let nextIndex = 0;

  const worker = async () => {
    while (!cancelled) {
      const index = nextIndex++;
      if (index >= total) return;
      try {
        await fetch(urls[index], { mode: "cors", credentials: "omit" });
      } catch {
        // ignore — bounded-effort cache warm, not a correctness requirement
      }
      done++;
      onProgress?.(done, total);
    }
  };

  const promise = Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, worker)
  ).then(() => undefined);

  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
}

export function preloadKanjiSvgs(
  onProgress?: (done: number, total: number) => void
): CancellablePreload {
  let cancelled = false;
  let inner: CancellablePreload | null = null;

  const promise = fetch(assetsPaths.MAIN_KANJI_INFO_FILE_PATH)
    .then((res) => res.json() as Promise<MainKanjiInfoResponseType>)
    .then((data) => {
      if (cancelled) return;
      const urls = Object.keys(data).map(localKanjiSvgUrl);
      inner = runPool(urls, onProgress);
      return inner.promise;
    });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      inner?.cancel();
    },
  };
}

export function preloadKatakanaChallenges(
  onProgress?: (done: number, total: number) => void
): CancellablePreload {
  const urls = Array.from({ length: KATAKANA_CHALLENGE_SET_COUNT }, (_, i) =>
    katakanaChallengeUrl(i + 1)
  );
  return runPool(urls, onProgress);
}

/** One request: each challenge set is a single file. */
export function preloadFillTheKanjiSet(
  setId: FillTheKanjiSetId,
  onProgress?: (done: number, total: number) => void
): CancellablePreload {
  const preload = runPool(fillTheKanjiChunkUrls(setId), onProgress);
  return {
    ...preload,
    promise: preload.promise.then(() =>
      removeStaleFillTheKanjiPreloadKeys(setId)
    ),
  };
}

/**
 * Removes every cached chunk of one set, any version (plus the older
 * single-file `<set>.json`), leaving the other sets in the shared cache.
 */
export async function clearFillTheKanjiSetCache(setId: FillTheKanjiSetId) {
  removeStaleFillTheKanjiPreloadKeys(setId);
  if (!("caches" in window)) return;
  const cache = await caches.open(FILL_THE_KANJI_CACHE_NAME);
  const dir = fillTheKanjiSetDir(setId);
  const legacyFile = `${assetsPaths.FILL_THE_KANJI_SET}${setId}.json`;
  const requests = await cache.keys();
  await Promise.all(
    requests
      .filter((request) => {
        const { pathname } = new URL(request.url);
        return pathname.startsWith(dir) || pathname === legacyFile;
      })
      .map((request) => cache.delete(request))
  );
}

export async function clearKanjiSvgCache() {
  if ("caches" in window) await caches.delete(KANJI_SVG_CACHE_NAME);
}

export async function clearKatakanaCache() {
  if ("caches" in window) await caches.delete(KATAKANA_CACHE_NAME);
}
