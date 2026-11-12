// Draws the sample characters of each Japanese font in User Preferences as an
// SVG of the font's own outlines, into public/svg/font-tiles/<font>.svg.
// The font picker shows these instead of setting each tile's font-family, so
// opening Settings no longer downloads every font (about 20 MB).
//
// Fonts and their order come from src/JFonts.css (the @imports, the
// @font-face rules and the last :root block). Run it again after a font is
// added or changed there:
//   pnpm run build:font-tiles
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as fontkit from "fontkit";

const SAMPLE = "字体";
const CSS = "src/JFonts.css";
const OUT = "public/svg/font-tiles";
const require = createRequire(import.meta.url);

/** "BIZ UDGothic" → "biz-udgothic", the tile's file name. */
const fontTileSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** font-family → woff2 path for every @font-face in a stylesheet. */
const fontFaces = (cssPath) => {
  const css = fs.readFileSync(cssPath, "utf8");
  const faces = new Map();
  for (const [, body] of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const family = body.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1];
    const url = body.match(/url\(["']?([^"')]+\.woff2)["']?\)/)?.[1];
    if (!family || !url) continue;
    const file = url.startsWith("/")
      ? path.join("public", url)
      : path.join(path.dirname(cssPath), url);
    faces.set(family, file);
  }
  return faces;
};

const css = fs.readFileSync(CSS, "utf8");
const faces = fontFaces(CSS);
for (const [, spec] of css.matchAll(/@import\s+["']([^"']+)["']/g)) {
  for (const [family, file] of fontFaces(require.resolve(spec)))
    faces.set(family, file);
}

// The last :root block is the active one; its order is the tiles' order.
const roots = [...css.matchAll(/:root\s*{([^}]*)}/g)];
const names = [
  ...roots.at(-1)[1].matchAll(/--jap-font-\d+:\s*["']([^"']+)["']/g),
].map(([, name]) => name);

const round = (n) => Math.round(n);

// CJK glyphs sit in a 1em square whose bottom is about 0.12em below the
// baseline, so a 1em-tall box at that offset matches live text at that size.
const IDEOGRAPHIC_DESCENT = 0.12;

const tileSvg = (file) => {
  const font = fontkit.openSync(file);
  const em = font.unitsPerEm;
  const baseline = round(em * (1 - IDEOGRAPHIC_DESCENT));
  const run = font.layout(SAMPLE);
  let x = 0;
  const parts = run.glyphs.map((glyph, i) => {
    if (glyph.id === 0) throw new Error(`${file} has no glyph for ${SAMPLE}`);
    const d = glyph.path.toSVG();
    const part = `<path transform="translate(${round(x)} ${baseline}) scale(1 -1)" d="${d}"/>`;
    x += run.positions[i].xAdvance;
    return part;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(x)} ${em}">${parts.join("")}</svg>\n`;
};

fs.mkdirSync(OUT, { recursive: true });
for (const name of names) {
  const file = faces.get(name);
  if (!file) throw new Error(`No @font-face found for "${name}"`);
  const out = path.join(OUT, `${fontTileSlug(name)}.svg`);
  const svg = tileSvg(file);
  fs.writeFileSync(out, svg);
  console.log(`${out} (${(svg.length / 1024).toFixed(1)} KB)`);
}
