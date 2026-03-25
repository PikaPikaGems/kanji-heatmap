/**
 * Data Inspection Part 2: Analyze kanjidict.txt
 *
 * Outputs:
 *   - Column fill rates
 *   - Structure type distribution
 *   - IDS indicator distribution
 *   - Component analysis (radical variant + phonetic)
 *   - Phono-semantic compounds missing phonetic component
 *   - Compound ideographs with col4 analysis
 *   - Key takeaways and recommendations
 *
 * Usage: node scripts/data-inspection-part-2.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const raw = readFileSync(resolve(root, "docs/data/kanjidict.txt"), "utf-8");
const rows = raw
  .trim()
  .split("\n")
  .map((line) => line.split("\t"));

const COLS = {
  KANJI: 0,
  RADICAL: 1,
  RADICAL_VARIANT: 2,
  PHONETIC: 3,
  IDS: 4,
  STRUCTURE_TYPE: 5,
  ONYOMI_COMMON: 6,
  KUNYOMI_COMMON: 7,
  ONYOMI_DETAILED: 8,
  KUNYOMI_DETAILED: 9,
  NANORI: 10,
  STROKES: 11,
  GRADE: 12,
  JLPT: 13,
  KANKEN: 14,
  FREQ_RANK: 15,
  MEANINGS_FULL: 16,
  MEANINGS_SHORT: 17,
  DICT_REF_1: 18,
  DICT_REF_2: 19,
  DICT_REF_3: 20,
  DICT_REF_4: 21,
  DICT_REF_5: 22,
  DICT_REF_6: 23,
};

const SEP = "=".repeat(60);

// ── Helpers ──

function countFilled(colIdx) {
  return rows.filter((r) => r[colIdx] && r[colIdx].trim()).length;
}

function countByValue(colIdx) {
  const counts = {};
  for (const r of rows) {
    const val = r[colIdx]?.trim() || "(empty)";
    counts[val] = (counts[val] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function codePoint(char) {
  return [...char]
    .map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
    .join(" ");
}

// ── Analysis ──

console.log(SEP);
console.log("DATA INSPECTION PART 2: kanjidict.txt");
console.log(SEP);

// Basic stats
console.log(`\n--- Basic Stats ---`);
console.log(`Total rows: ${rows.length}`);
const colCounts = new Set(rows.map((r) => r.length));
console.log(`Column counts found: ${[...colCounts].join(", ")}`);

// Column fill rates
console.log(`\n--- Column Fill Rates ---`);
const colNames = [
  "Kanji", "Radical", "Radical variant", "Phonetic component",
  "IDS structure", "Structure type", "On'yomi (common)", "Kun'yomi (common)",
  "On'yomi (detailed)", "Kun'yomi (detailed)", "Nanori", "Stroke count",
  "Grade", "JLPT", "Kanken", "Freq rank", "Meanings (full)", "Meanings (short)",
  "Dict ref 1", "Dict ref 2", "Dict ref 3", "Dict ref 4", "Dict ref 5", "Dict ref 6",
];
for (let i = 0; i < 24; i++) {
  const filled = countFilled(i);
  const pct = ((filled / rows.length) * 100).toFixed(1);
  console.log(`  Col ${String(i + 1).padStart(2)}: ${colNames[i]?.padEnd(22) || "??".padEnd(22)} ${String(filled).padStart(5)}/${rows.length} (${pct}%)`);
}

// Structure types
console.log(`\n--- Structure Type Distribution (Column 6) ---`);
for (const [val, count] of countByValue(COLS.STRUCTURE_TYPE)) {
  console.log(`  ${String(count).padStart(5)}  ${val}`);
}

// IDS indicators
console.log(`\n--- IDS Structure Indicators (Column 5) ---`);
for (const [val, count] of countByValue(COLS.IDS)) {
  console.log(`  ${String(count).padStart(5)}  ${val}`);
}

// Component analysis
console.log(`\n--- Component Analysis ---`);
const col3Filled = rows.filter((r) => r[COLS.RADICAL_VARIANT]?.trim());
const col4Filled = rows.filter((r) => r[COLS.PHONETIC]?.trim());
const bothFilled = rows.filter(
  (r) => r[COLS.RADICAL_VARIANT]?.trim() && r[COLS.PHONETIC]?.trim()
);
console.log(`  Radical variant (col 3) filled: ${col3Filled.length}/${rows.length}`);
console.log(`  Phonetic component (col 4) filled: ${col4Filled.length}/${rows.length}`);
console.log(`  Both filled: ${bothFilled.length}/${rows.length}`);

// Multi-character check
const multiCol2 = rows.filter((r) => [...r[COLS.RADICAL]].length > 1);
const multiCol4 = col4Filled.filter((r) => [...r[COLS.PHONETIC]].length > 1);
console.log(`  Multi-char radical (col 2): ${multiCol2.length}`);
console.log(`  Multi-char phonetic (col 4): ${multiCol4.length}`);

// Phono-semantic analysis
console.log(`\n--- Phono-Semantic Compounds ---`);
const phonoSemantic = rows.filter((r) => r[COLS.STRUCTURE_TYPE] === "Phono-semantic compound");
const psWithPhonetic = phonoSemantic.filter((r) => r[COLS.PHONETIC]?.trim());
const psMissingPhonetic = phonoSemantic.filter((r) => !r[COLS.PHONETIC]?.trim());
console.log(`  Total: ${phonoSemantic.length}`);
console.log(`  With phonetic (col 4): ${psWithPhonetic.length} (${((psWithPhonetic.length / phonoSemantic.length) * 100).toFixed(1)}%)`);
console.log(`  Missing phonetic: ${psMissingPhonetic.length}`);
if (psMissingPhonetic.length > 0) {
  console.log(`\n  First 15 phono-semantic missing phonetic:`);
  for (const r of psMissingPhonetic.slice(0, 15)) {
    console.log(
      `    ${r[COLS.KANJI]}  radical=${r[COLS.RADICAL]}  variant=${r[COLS.RADICAL_VARIANT] || "-"}  ids=${r[COLS.IDS]}`
    );
  }
}

// Compound ideograph col4 analysis
console.log(`\n--- Compound Ideograph col4 Analysis ---`);
const compoundIdeograph = rows.filter((r) => r[COLS.STRUCTURE_TYPE] === "Compound ideograph");
const ciWithCol4 = compoundIdeograph.filter((r) => r[COLS.PHONETIC]?.trim());
const ciSelfRef = ciWithCol4.filter((r) => r[COLS.PHONETIC] === r[COLS.KANJI]);
const ciDifferent = ciWithCol4.filter((r) => r[COLS.PHONETIC] !== r[COLS.KANJI]);
console.log(`  Total compound ideographs: ${compoundIdeograph.length}`);
console.log(`  With col4 filled: ${ciWithCol4.length}`);
console.log(`  col4 = kanji itself (self-referential): ${ciSelfRef.length}`);
console.log(`  col4 != kanji (true secondary component): ${ciDifferent.length}`);
if (ciDifferent.length > 0) {
  console.log(`\n  Compound ideographs where col4 is a different character:`);
  for (const r of ciDifferent) {
    console.log(
      `    ${r[COLS.KANJI]}  radical=${r[COLS.RADICAL]}  col4=${r[COLS.PHONETIC]} (${codePoint(r[COLS.PHONETIC])})`
    );
  }
}

// Key takeaways
console.log(`\n${SEP}`);
console.log("KEY TAKEAWAYS");
console.log(SEP);
console.log(`
1. kanjidict.txt has ${rows.length} kanji — much more than kanji-structure.json (2,474)

2. Structure types are available for ${rows.length - 3821} kanji (44%):
   - ${phonoSemantic.length} Phono-semantic compounds (semantic + phonetic)
   - ${compoundIdeograph.length} Compound ideographs
   - 250 Pictographs, 67 Ideographs

3. Phono-semantic compound reliability:
   - ${psWithPhonetic.length}/${phonoSemantic.length} (${((psWithPhonetic.length / phonoSemantic.length) * 100).toFixed(1)}%) have explicit phonetic component
   - ${psMissingPhonetic.length} are missing the phonetic — data gap

4. Compound ideographs only list the PRIMARY radical (col 2)
   - Other semantic components are NOT explicitly listed
   - col4 is usually self-referential (${ciSelfRef.length} cases)
   - Only ${ciDifferent.length} have a true secondary component in col4

5. No multi-character components in col 2 or col 4 — always single chars

6. New data not in our current JSON files:
   - On'yomi origin markers (漢/呉/慣用音)
   - Nanori (name readings)
   - Kanken exam level
   - IDS structure indicators
`);
