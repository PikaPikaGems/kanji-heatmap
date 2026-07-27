import assetsPaths from "@/lib/assets-paths";

/** KanjiVG-style 5-digit hex filename stem used by dmak (`0xxxx.svg`). */
export function kanjiSvgCode(kanji: string): string {
  const char = [...kanji][0] ?? kanji;
  return `00000${char.charCodeAt(0).toString(16)}`.slice(-5);
}

/**
 * The ~2426 kanji in `raw-data/filtered_kanji.json` ship as committed SVGs
 * under `public/json/svg/`, so those don't need the CDN at all. Everything
 * outside that set (e.g. 唸) still lazy-loads from the CDN below.
 */
export const LOCAL_KANJI_SVG_BASE_URI = "/json/svg/";

export function localKanjiSvgUrl(kanji: string): string {
  return `${LOCAL_KANJI_SVG_BASE_URI}${kanjiSvgCode(kanji)}.svg`;
}

export function kanjiSvgBaseUri(): string {
  return import.meta.env.MODE === "development" ||
    window.location.protocol === "http:"
    ? assetsPaths.dev.KANJI_SVGS
    : assetsPaths.KANJI_SVGS;
}

/** Absolute URL for a character's stroke-order SVG on the KanjiVG CDN. */
export function kanjiSvgUrl(kanji: string): string {
  return `${kanjiSvgBaseUri()}${kanjiSvgCode(kanji)}.svg`;
}

async function isValidKanjiSvgResponse(
  res: Response,
  code: string
): Promise<boolean> {
  if (!res.ok) return false;
  const body = await res.text();
  // KanjiVG roots look like id="kvg:05c71" — reject empty / wrong payloads.
  return body.includes(`kvg:${code}`);
}

/**
 * Tries the committed local SVG first, then falls back to the CDN. Returns
 * the base uri that worked (for dmak's `uri` option) or null if neither did.
 */
export async function resolveKanjiSvgBaseUri(
  kanji: string,
  signal: AbortSignal
): Promise<string | null> {
  const code = kanjiSvgCode(kanji);

  for (const baseUri of [LOCAL_KANJI_SVG_BASE_URI, kanjiSvgBaseUri()]) {
    const res = await fetch(`${baseUri}${code}.svg`, { signal });
    if (await isValidKanjiSvgResponse(res, code)) return baseUri;
  }

  return null;
}
