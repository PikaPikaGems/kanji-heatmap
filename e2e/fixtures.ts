import { test as base, expect } from "@playwright/test";

// Minimal KanjiVG-shaped SVG so dmak's stroke parser has something valid to
// draw. The hex code is templated in so the kvg: ids match the requested file.
const kanjiVgSvg = (hex: string) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:kvg="http://kanjivg.tagaini.net" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_${hex}" style="fill:none;stroke:#000000;stroke-width:3">
<g id="kvg:${hex}">
<path id="kvg:${hex}-s1" d="M30,25 C40,45 45,65 35,85"/>
<path id="kvg:${hex}-s2" d="M55,15 C55,40 55,70 55,95"/>
</g>
</g>
<g id="kvg:StrokeNumbers_${hex}" style="font-size:8;fill:#808080">
<text transform="matrix(1 0 0 1 24 28)">1</text>
<text transform="matrix(1 0 0 1 58 18)">2</text>
</g>
</svg>`;

const svgHexFromUrl = (url: string) => {
  const match = url.match(/([0-9a-f]{4,6})\.svg/i);
  return match ? match[1] : "05000";
};

/**
 * Base test with all external/unavailable network dependencies stubbed:
 * - kanji SVGs (kanjivg.tagaini.net in dev, assets.pikapikagems.com in prod)
 * - sample-vocab JSON (gitignored local dirs in dev, pikapikagems in prod)
 * - /api/* Cloudflare Pages Functions (not served by the plain dev server)
 * - heavyweight handwriting-recognition assets (ONNX model, ref-patterns)
 */
export const test = base.extend({
  // Named `provide` (not Playwright's conventional `use`) so eslint's
  // react-hooks rule doesn't mistake the fixture callback for a React hook.
  context: async ({ context }, provide) => {
    await context.route("https://assets.pikapikagems.com/**", (route) => {
      const url = route.request().url();
      if (url.endsWith(".svg")) {
        route.fulfill({
          contentType: "image/svg+xml",
          body: kanjiVgSvg(svgHexFromUrl(url)),
        });
        return;
      }
      route.fulfill({ contentType: "application/json", body: "[]" });
    });

    await context.route("https://kanjivg.tagaini.net/**", (route) => {
      route.fulfill({
        contentType: "image/svg+xml",
        body: kanjiVgSvg(svgHexFromUrl(route.request().url())),
      });
    });

    await context.route(/\/api\/(jisho|jotoba|handwriting)/, (route) => {
      route.fulfill({ contentType: "application/json", body: "{}" });
    });

    await context.route(
      /\/(kanji-words|kanji-textbook-words-min)\/.*/,
      (route) => {
        route.fulfill({ contentType: "application/json", body: "[]" });
      }
    );

    await context.route(/\/onnx\/.*/, (route) => route.abort());
    await context.route(/\/js\/ref-patterns\.js/, (route) => route.abort());

    await provide(context);
  },
});

export { expect };
