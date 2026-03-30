/**
 * Converts kanjidict.txt to kanji-structure-v2-plus-more.json
 *
 * Output: public/json/kanji-structure-v2-plus-more.json
 * Format: { [kanji]: { ...all 24 columns as named fields } }
 *
 * Usage: node scripts/kanjidict-to-json.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const raw = readFileSync(resolve(root, "docs/data/kanjidict.txt"), "utf-8");

const main = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji_main.json"), "utf-8")
);

const mainKanjiKeys = new Set(Object.keys(main));

const rows = raw
  .trim()
  .split("\n")
  .map((line) => line.split("\t"));

function orNull(val) {
  return val?.trim() || null;
}

function orNullInt(val) {
  const trimmed = val?.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return isNaN(n) ? null : n;
}

const result = {};
const resultMin = {};
const radicalSet = new Set();
const radicalVariantSet = new Set();
const phoneticComponentSet = new Set();
const idsStructureSet = new Set();
const structureTypeSet = new Set();
for (const r of rows) {
  const kanji = r[0];
  if (!kanji) continue;

  const radical = orNull(r[1]);
  const radicalVariant = orNull(r[2]);
  const phoneticComponent = orNull(r[3]);
  const idsStructure = orNull(r[4]);
  const structureType = orNull(r[5]);

  if (main[kanji]) {
    // radical, radicalVariant, phoneticComponent, idsStructure, structureType
    resultMin[kanji] = [
      radical,
      radicalVariant,
      phoneticComponent,
      idsStructure,
      structureType,
    ];

    radicalSet.add(radical);
    radicalVariantSet.add(radicalVariant);
    phoneticComponentSet.add(phoneticComponent);
    idsStructureSet.add(idsStructure);
    structureTypeSet.add(structureType);
  }

  result[kanji] = {
    radical,
    radicalVariant,
    phoneticComponent,
    idsStructure,
    structureType,
    onyomiCommon: orNull(r[6]),
    kunyomiCommon: orNull(r[7]),
    onyomiDetailed: orNull(r[8]),
    kunyomiDetailed: orNull(r[9]),
    nanori: orNull(r[10]),
    strokeCount: orNullInt(r[11]),
    grade: orNull(r[12]),
    jlpt: orNull(r[13]),
    kanken: orNull(r[14]),
    frequencyRank: orNullInt(r[15]),
    meaningsFull: orNull(r[16]),
    meaningsShort: orNull(r[17]),
    dictRef1: orNullInt(r[18]),
    dictRef2: orNullInt(r[19]),
    dictRef3: orNullInt(r[20]),
    dictRef4: orNullInt(r[21]),
    dictRef5: orNullInt(r[22]),
    dictRef6: orNullInt(r[23]),
  };
}

// Generate public/json/yagays-components.json from yagays/kanji2composition/kanji2radical.json
function generateYagaysComponents() {
  const raw = JSON.parse(
    readFileSync(resolve(root, "docs/data/yagays/kanji2composition/kanji2radical.json"), "utf-8")
  );

  const result = {};
  for (const [kanji, parts] of Object.entries(raw)) {
    if (mainKanjiKeys.has(kanji)) {
      result[kanji] = parts;
    }
  }

  writeFileSync(
    resolve(root, "public/json/yagays-components.json"),
    JSON.stringify(result),
    "utf-8"
  );

  const allParts = new Set(Object.values(result).flat());
  console.log("=".repeat(60));
  console.log("YAGAYS COMPONENTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Input entries:  ${Object.keys(raw).length}`);
  console.log(`Filtered kanji: ${Object.keys(result).length} (in mainKanjiKeys)`);
  console.log(`Unique parts:   ${allParts.size}`);
  const partCounts = {};
  for (const parts of Object.values(result)) {
    for (const p of parts) {
      partCounts[p] = (partCounts[p] || 0) + 1;
    }
  }
  const topParts = Object.entries(partCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`\nTop 10 most common parts:`);
  for (const [part, count] of topParts) {
    console.log(`  ${part}: ${count}`);
  }
  console.log(`\nOutput: public/json/yagays-components.json`);
  console.log("=".repeat(60));
}

generateYagaysComponents();

// Generate public/json/scott-components.json from ScottOglesby-kanji-composition-map.txt
function generateScottComponents() {
  const raw = readFileSync(
    resolve(root, "docs/data/ScottOglesby-kanji-composition-map.txt"),
    "utf-8"
  );

  const result = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const kanji = trimmed.slice(0, colonIdx).trim();
    if (!kanji) continue;

    // Remove inline comments, then split by whitespace
    const rest = trimmed.slice(colonIdx + 1).replace(/#.*$/, "").trim();
    const parts = rest.split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;

    if (mainKanjiKeys.has(kanji)) {
      result[kanji] = parts;
    }
  }

  writeFileSync(
    resolve(root, "public/json/scott-components.json"),
    JSON.stringify(result),
    "utf-8"
  );

  const allParts = new Set(Object.values(result).flat());
  console.log("=".repeat(60));
  console.log("SCOTT COMPONENTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`Filtered kanji: ${Object.keys(result).length} (in mainKanjiKeys)`);
  console.log(`Unique parts:   ${allParts.size}`);
  const partCounts = {};
  for (const parts of Object.values(result)) {
    for (const p of parts) {
      partCounts[p] = (partCounts[p] || 0) + 1;
    }
  }
  const topParts = Object.entries(partCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`\nTop 10 most common parts:`);
  for (const [part, count] of topParts) {
    console.log(`  ${part}: ${count}`);
  }
  console.log(`\nOutput: public/json/scott-components.json`);
  console.log("=".repeat(60));
}

generateScottComponents();

const outPath = resolve(root, "public/json/kanji-structure-v2-plus-more.json");
writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

// mifunetoshiro-kanjium
const outPath2 = resolve(root, "public/json/kanji-structure-kanjium.json");
writeFileSync(outPath2, JSON.stringify(resultMin), "utf-8");

console.log("=".repeat(60));
console.log("KANJIDICT TO JSON SUMMARY");
console.log("=".repeat(60));
console.log(`Total unique radicals: ${radicalSet.size}`);
console.log(`Total unique radical variants: ${radicalVariantSet.size}`);
console.log(`Total unique phonetic components: ${phoneticComponentSet.size}`);
console.log(`Total unique IDS structures: ${idsStructureSet.size}`);
console.log(`Total unique structure types: ${structureTypeSet.size}`);

console.log(`\nradicals: ${[...radicalSet].join(", ")}`);
console.log(`\nradical variants: ${[...radicalVariantSet].join(", ")}`);
console.log(`\nphonetic components: ${[...phoneticComponentSet].join(", ")}`);
console.log(`\nIDS structures: ${[...idsStructureSet].join(", ")}`);
console.log(`\nstructure types: ${[...structureTypeSet].join(", ")}`);
console.log("=".repeat(60));

console.log("=".repeat(60));
console.log("KANJIDICT TO JSON CONVERSION");
console.log("=".repeat(60));
console.log(`\nInput:  docs/data/kanjidict.txt (${rows.length} rows)`);
console.log(`Output: public/json/kanji-structure-v2-plus-more.json`);
console.log(`Total kanji entries: ${Object.keys(result).length}`);

// Quick validation
let withStructure = 0;
let withPhonetic = 0;
let withRadicalVariant = 0;
let withNanori = 0;
let withKanken = 0;

for (const v of Object.values(result)) {
  if (v.structureType) withStructure++;
  if (v.phoneticComponent) withPhonetic++;
  if (v.radicalVariant) withRadicalVariant++;
  if (v.nanori) withNanori++;
  if (v.kanken) withKanken++;
}

console.log(`\n--- Field Coverage ---`);
console.log(`  structureType:     ${withStructure}`);
console.log(`  phoneticComponent: ${withPhonetic}`);
console.log(`  radicalVariant:    ${withRadicalVariant}`);
console.log(`  nanori:            ${withNanori}`);
console.log(`  kanken:            ${withKanken}`);

// Sample output
const samples = ["握", "悪", "安", "一", "雪"];
console.log(`\n--- Sample Entries ---`);
for (const s of samples) {
  if (result[s]) {
    console.log(`\n  ${s}:`);
    const entry = result[s];
    for (const [k, v] of Object.entries(entry)) {
      if (v !== null) {
        console.log(`    ${k}: ${v}`);
      }
    }
  }
}

console.log(
  `\nDone. JSON written to public/json/kanji-structure-v2-plus-more.json`
);
