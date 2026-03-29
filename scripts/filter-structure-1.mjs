import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function intersection(arr1, arr2) {
  return arr1.filter((item) => arr2.includes(item));
}

function difference(arr1, arr2) {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

// ── Load kanji-structure.json ──
const structure = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji-structure.json"), "utf-8")
);

const structureKanjiKeys = Object.keys(structure);

const main = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji_main.json"), "utf-8")
);

const mainKanjiKeys = Object.keys(main);

const result = intersection(structureKanjiKeys, mainKanjiKeys);

console.log("main length:", mainKanjiKeys.length);
console.log("structure length", structureKanjiKeys.length);
console.log("intersection length", result.length);

const onlyMain = difference(mainKanjiKeys, structureKanjiKeys);
console.log("only main length", onlyMain.length);
const onlyStructure = difference(structureKanjiKeys, mainKanjiKeys);
console.log("only structure length", onlyStructure.length);

console.log("main only", onlyMain.join(" , "));
console.log("structure only", onlyStructure.join(" , "));

const filteredStructure = {};

mainKanjiKeys.forEach((key) => {
  const value = structure[key];
  if (value == null) {
    return;
  }

  filteredStructure[key] = value;
});

mainKanjiKeys.forEach((key) => {
  const value = structure[key];
  if (value == null) {
    return;
  }

  filteredStructure[key] = value;
});

const outPath = resolve(
  root,
  "public/json/kanji-structure-filtered-hlorenzi.json"
);
writeFileSync(outPath, JSON.stringify(filteredStructure), "utf-8");

const readings = JSON.parse(
  readFileSync(
    resolve(root, "public/json/kanji-readings-details.json"),
    "utf-8"
  )
);

const filteredReadings = {};

mainKanjiKeys.forEach((key) => {
  const value = readings[key];
  if (value == null) {
    return;
  }

  filteredReadings[key] = value;
});

mainKanjiKeys.forEach((key) => {
  const values = readings[key];
  if (values == null) {
    return;
  }

  console.log(values);

  filteredReadings[key] = values.map((value) => {
    return {
      r: value.reading,
      t: value.type,
      f: value.frequency,
      w: value.example_word,
    };
  });
});

const outPath2 = resolve(
  root,
  "public/json/kanji-readings-details-filtered.json"
);
writeFileSync(outPath2, JSON.stringify(filteredReadings), "utf-8");
