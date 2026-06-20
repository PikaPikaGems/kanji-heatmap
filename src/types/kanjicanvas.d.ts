// asdfjkl/kanjicanvas is a pair of plain browser scripts (no npm package, no
// ESM exports). They attach a global `window.KanjiCanvas` and fill in its
// reference patterns. We import them only for their side effects and read the
// global afterwards, so the modules just need to be declared.
declare module "kanjicanvas/docs/resources/javascript/kanji-canvas.js";
declare module "kanjicanvas/docs/resources/javascript/ref-patterns.js";
