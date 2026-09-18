/**
 * Counts Character Structure parts that are neither radicals nor kanji.
 *
 * Reads public/json/v2 (the same files the details tab uses). Positional
 * bushu forms such as 訁 are treated as their kanji/radical (言) via
 * sylhare alternates and radicals.json aliases, so they are dropped.
 *
 * Writes docs/data/non-radical-component-count.json.
 *
 *   node scripts/count-non-radical-components.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mergeSylhareBushuAliases } from "./sylhare-bushu-aliases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const V2 = path.join(ROOT, "public", "json", "v2");
const OUT = path.join(ROOT, "docs", "data", "non-radical-component-count.json");

const readJson = (...segments) =>
  JSON.parse(fs.readFileSync(path.join(...segments), "utf8"));

const main = readJson(V2, "kanji_main.json");
const hover = readJson(V2, "kanji_extended_hover.json");
const structures = readJson(V2, "kanji_structures.json");
const radicals = readJson(V2, "radicals.json");
const rawRadicals = readJson(ROOT, "raw-data", "radicals.json");
const components = readJson(V2, "components.json");

const kanjiList = Object.keys(main);
const isKanji = (ch) => main[ch] != null;

const drawerRadicals = new Set(
  Object.values(radicals.groupedByStrokeCount).flat()
);
const aliases = { ...(radicals.aliases ?? {}) };
mergeSylhareBushuAliases({
  csvText: fs.readFileSync(
    path.join(ROOT, "raw-data", "sylhare", "kanji-radicals.csv"),
    "utf8"
  ),
  drawerRadicals,
  aliases,
  isKanji,
  skipAlts: rawRadicals.sylhareSkipAlts,
  extraAliases: rawRadicals.sylhareExtraAliases,
});

const radicalOrKanji = new Set(drawerRadicals);
for (const [from, to] of Object.entries(aliases)) {
  radicalOrKanji.add(from);
  radicalOrKanji.add(to);
}

const isIdsOperator = (char) => {
  const code = char.codePointAt(0);
  return code >= 0x2ff0 && code <= 0x2fff;
};

const isPartGlyph = (value) =>
  typeof value === "string" && [...value].length === 1 && !isIdsOperator(value);

const isNotRadicalNotKanji = (ch) => !isKanji(ch) && !radicalOrKanji.has(ch);

const addPart = (used, value) => {
  if (isPartGlyph(value)) used.add(value);
};

const partsFor = (kanji) => {
  const used = new Set();
  const row = structures[kanji];

  const ka = row?.ka;
  if (Array.isArray(ka)) {
    addPart(used, ka[0]);
    addPart(used, ka[1]);
    addPart(used, ka[2]);
  }

  const hl = row?.hl;
  if (hl != null) {
    addPart(used, hl.semantic);
    addPart(used, hl.phonetic);
  }

  for (const part of row?.ya ?? []) addPart(used, part);
  for (const part of row?.sc ?? []) addPart(used, part);

  const [topoParts = [], topoPhonetic = ""] = hover[kanji] ?? [[], ""];
  for (const part of topoParts) addPart(used, part);
  addPart(used, topoPhonetic);

  used.delete(kanji);
  return used;
};

const counts = new Map();

for (const kanji of kanjiList) {
  for (const part of partsFor(kanji)) {
    if (!isNotRadicalNotKanji(part)) continue;
    const entry = counts.get(part) ?? { count: 0, exampleKanji: [] };
    entry.count += 1;
    entry.exampleKanji.push(kanji);
    counts.set(part, entry);
  }
}

const componentRows = [...counts.entries()]
  .map(([char, entry]) => ({
    char,
    count: entry.count,
    keyword: components[char]?.k ?? "",
    exampleKanji: entry.exampleKanji,
  }))
  .sort((a, b) => b.count - a.count || a.char.localeCompare(b.char));

const bucketMap = new Map();
for (const row of componentRows) {
  bucketMap.set(row.count, (bucketMap.get(row.count) ?? 0) + 1);
}
const byCount = [...bucketMap.entries()]
  .sort((a, b) => b[0] - a[0])
  .map(([count, components]) => ({ count, components }));

const withKeyword = componentRows.filter((row) => row.keyword).length;
const componentsWithKeyword = componentRows
  .filter((row) => row.keyword)
  .map((row) => ({ cmp: row.char, cnt: row.count, kw: row.keyword }));

const report = {
  summary: {
    selectedKanji: kanjiList.length,
    selection: "all",
    kind: "not-radical-not-kanji",
    components: componentRows.length,
    withKeyword,
    withoutKeyword: componentRows.length - withKeyword,
    componentsWithKeyword,
    sources: ["ka", "hl", "ya", "sc", "topo"],
    byCount,
  },
  components: componentRows,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");

console.log(
  `Wrote ${OUT}: ${componentRows.length} components across ${kanjiList.length} kanji`
);
