import assetsPaths from "@/lib/assets-paths";
import type { MainKanjiInfoResponseType } from "@/lib/kanji/kanji-worker-types";

const CONCURRENCY = 6;
const KATAKANA_CHALLENGE_SET_COUNT = 200;

export const KANJI_SVG_CACHE_NAME = "kanji-svg-cache";
export const KATAKANA_CACHE_NAME = "kanji-heatmap-katakana-cache";

type CancellablePreload = {
  promise: Promise<void>;
  cancel: () => void;
};

/** Same 5-digit hex convention as dmak-safe-loader.ts's loadSvg. */
const kanjiSvgUrl = (kanji: string) => {
  const code = `00000${kanji.charCodeAt(0).toString(16)}`.slice(-5);
  return `${assetsPaths.KANJI_SVGS}${code}.svg`;
};

const katakanaChallengeUrl = (setNumber: number) =>
  `${assetsPaths.SPEED_KATAKANA_CHALLENGE_SET}${setNumber}.json`;

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
      const urls = Object.keys(data).map(kanjiSvgUrl);
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

export async function clearKanjiSvgCache() {
  if ("caches" in window) await caches.delete(KANJI_SVG_CACHE_NAME);
}

export async function clearKatakanaCache() {
  if ("caches" in window) await caches.delete(KATAKANA_CACHE_NAME);
}
