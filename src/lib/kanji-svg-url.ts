import assetsPaths from "@/lib/assets-paths";

/** KanjiVG-style 5-digit hex filename stem used by dmak (`0xxxx.svg`). */
export function kanjiSvgCode(kanji: string): string {
  const char = [...kanji][0] ?? kanji;
  return `00000${char.charCodeAt(0).toString(16)}`.slice(-5);
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
