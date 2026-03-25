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

for (const r of rows) {
  const kanji = r[0];
  if (!kanji) continue;

  result[kanji] = {
    radical: orNull(r[1]),
    radicalVariant: orNull(r[2]),
    phoneticComponent: orNull(r[3]),
    idsStructure: orNull(r[4]),
    structureType: orNull(r[5]),
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

const outPath = resolve(root, "public/json/kanji-structure-v2-plus-more.json");
writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

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

console.log(`\nDone. JSON written to public/json/kanji-structure-v2-plus-more.json`);
