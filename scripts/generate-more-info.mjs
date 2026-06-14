/**
 * Generates the 5 JSON files used by the website, filtered to the kanji in
 * public/json/filtered_kanji.json.
 *
 * Sources → Outputs:
 *   raw-data/output/kanji-structure.json                  → public/json/kanji-structure-filtered-hlorenzi.json
 *   raw-data/piyush/kanji-readings-details.json           → public/json/kanji-readings-details-filtered.json
 *   raw-data/kanjidict.txt                                → public/json/kanji-structure-kanjium.json
 *   raw-data/ScottOglesby-kanji-composition-map.txt       → public/json/scott-components.json
 *   raw-data/yagays/kanji2composition/kanji2radical.json  → public/json/yagays-components.json
 *
 * Usage: node scripts/generate.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const allowedKanji = new Set(
  JSON.parse(readFileSync(resolve(root, "public/json/filtered_kanji.json"), "utf-8"))
);
console.log(`Allowed kanji: ${allowedKanji.size}`);

function generateHlorenzi() {
  const raw = JSON.parse(
    readFileSync(resolve(root, "raw-data/output/kanji-structure.json"), "utf-8")
  );
  const result = {};
  for (const [k, v] of Object.entries(raw)) {
    if (allowedKanji.has(k)) result[k] = v;
  }
  writeFileSync(
    resolve(root, "public/json/kanji-structure-filtered-hlorenzi.json"),
    JSON.stringify(result),
    "utf-8"
  );
  console.log(
    `kanji-structure-filtered-hlorenzi.json: ${Object.keys(raw).length} → ${Object.keys(result).length} keys`
  );
}

function generateReadings() {
  const raw = JSON.parse(
    readFileSync(resolve(root, "raw-data/piyush/kanji-readings-details.json"), "utf-8")
  );
  const result = {};
  for (const [k, values] of Object.entries(raw)) {
    if (!allowedKanji.has(k)) continue;
    result[k] = values.map((v) => ({
      r: v.reading,
      t: v.type,
      f: v.frequency,
      w: v.example_word,
    }));
  }
  writeFileSync(
    resolve(root, "public/json/kanji-readings-details-filtered.json"),
    JSON.stringify(result),
    "utf-8"
  );
  console.log(
    `kanji-readings-details-filtered.json: ${Object.keys(raw).length} → ${Object.keys(result).length} keys`
  );
}

function generateKanjium() {
  const raw = readFileSync(resolve(root, "raw-data/kanjidict.txt"), "utf-8");
  const rows = raw.trim().split("\n").map((line) => line.split("\t"));

  function orNull(val) {
    return val?.trim() || null;
  }

  const result = {};
  for (const r of rows) {
    const kanji = r[0];
    if (!kanji || !allowedKanji.has(kanji)) continue;
    result[kanji] = [
      orNull(r[1]), // radical
      orNull(r[2]), // radicalVariant
      orNull(r[3]), // phoneticComponent
      orNull(r[4]), // idsStructure
      orNull(r[5]), // structureType
    ];
  }
  writeFileSync(
    resolve(root, "public/json/kanji-structure-kanjium.json"),
    JSON.stringify(result),
    "utf-8"
  );
  console.log(
    `kanji-structure-kanjium.json: ${rows.length} rows → ${Object.keys(result).length} keys`
  );
}

function generateScott() {
  const raw = readFileSync(
    resolve(root, "raw-data/ScottOglesby-kanji-composition-map.txt"),
    "utf-8"
  );
  const result = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const kanji = trimmed.slice(0, colonIdx).trim();
    if (!kanji || !allowedKanji.has(kanji)) continue;
    const rest = trimmed.slice(colonIdx + 1).replace(/#.*$/, "").trim();
    const parts = rest.split(/\s+/).filter(Boolean);
    if (parts.length > 0) result[kanji] = parts;
  }
  writeFileSync(
    resolve(root, "public/json/scott-components.json"),
    JSON.stringify(result),
    "utf-8"
  );
  console.log(`scott-components.json: ${Object.keys(result).length} keys`);
}

function generateYagays() {
  const raw = JSON.parse(
    readFileSync(
      resolve(root, "raw-data/yagays/kanji2composition/kanji2radical.json"),
      "utf-8"
    )
  );
  const result = {};
  for (const [k, parts] of Object.entries(raw)) {
    if (allowedKanji.has(k)) result[k] = parts;
  }
  writeFileSync(
    resolve(root, "public/json/yagays-components.json"),
    JSON.stringify(result),
    "utf-8"
  );
  console.log(
    `yagays-components.json: ${Object.keys(raw).length} → ${Object.keys(result).length} keys`
  );
}

generateHlorenzi();
generateReadings();
generateKanjium();
generateScott();
generateYagays();

console.log("\nDone.");
