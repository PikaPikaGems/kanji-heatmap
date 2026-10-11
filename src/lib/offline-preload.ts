import assetsPaths from "@/lib/assets-paths";
import { localKanjiSvgUrl } from "@/lib/kanji-svg-url";
import type { MainKanjiInfoResponseType } from "@/lib/kanji/kanji-worker-types";
import type { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import setVersions from "@/lib/fill-the-kanji/set-versions.json";

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

/** Content hash per set, written by scripts/generate-fill-the-kanji.mjs. */
const SET_VERSIONS = setVersions as Record<string, string>;

const fillTheKanjiSetPath = (setId: FillTheKanjiSetId) =>
  `${assetsPaths.FILL_THE_KANJI_SET}${setId}.json`;

/**
 * Versioned URL (`?v=<content hash>`). The PWA caches set files with no age
 * limit (vite.config.ts), so a changed set needs a new URL to be fetched again.
 */
export const fillTheKanjiSetUrl = (setId: FillTheKanjiSetId) =>
  `${fillTheKanjiSetPath(setId)}?v=${SET_VERSIONS[setId] ?? "0"}`;

/** localStorage flag set once a challenge set has been downloaded. */
export const FILL_THE_KANJI_PRELOAD_KEY_PREFIX =
  "fill-the-kanji-preload-complete-";

/** Includes the set's version, so a changed set no longer counts as downloaded. */
export const fillTheKanjiPreloadKey = (setId: FillTheKanjiSetId) =>
  `${FILL_THE_KANJI_PRELOAD_KEY_PREFIX}${setId}@${SET_VERSIONS[setId] ?? "0"}`;

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
  const preload = runPool([fillTheKanjiSetUrl(setId)], onProgress);
  return {
    ...preload,
    promise: preload.promise.then(() =>
      removeStaleFillTheKanjiPreloadKeys(setId)
    ),
  };
}

/**
 * Removes every cached version of one set (`ignoreSearch` matches any `?v=`),
 * leaving the other sets in the shared cache.
 */
export async function clearFillTheKanjiSetCache(setId: FillTheKanjiSetId) {
  removeStaleFillTheKanjiPreloadKeys(setId);
  if (!("caches" in window)) return;
  const cache = await caches.open(FILL_THE_KANJI_CACHE_NAME);
  await cache.delete(
    new URL(fillTheKanjiSetPath(setId), window.location.href),
    { ignoreSearch: true }
  );
}

export async function clearKanjiSvgCache() {
  if ("caches" in window) await caches.delete(KANJI_SVG_CACHE_NAME);
}

export async function clearKatakanaCache() {
  if ("caches" in window) await caches.delete(KATAKANA_CACHE_NAME);
}
