/**
 * Validates kanjidict.txt against kanji-structure.json
 *
 * Compares:
 *   1. Coverage: kanji in one but not the other
 *   2. Structure type agreement/disagreement
 *   3. Semantic component agreement (for keisei/phono-semantic)
 *   4. Phonetic component agreement (for keisei/phono-semantic)
 *
 * Usage: node scripts/validate-kanjidict-vs-structure.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Load kanjidict.txt ──

const raw = readFileSync(resolve(root, "docs/data/kanjidict.txt"), "utf-8");
const rows = raw
  .trim()
  .split("\n")
  .map((line) => line.split("\t"));

const kanjidict = {};
for (const r of rows) {
  const kanji = r[0];
  if (!kanji) continue;
  kanjidict[kanji] = {
    radical: r[1]?.trim() || null,
    radicalVariant: r[2]?.trim() || null,
    phonetic: r[3]?.trim() || null,
    ids: r[4]?.trim() || null,
    structureType: r[5]?.trim() || null,
  };
}

// ── Load kanji-structure.json ──

const structure = JSON.parse(
  readFileSync(resolve(root, "public/json/kanji-structure.json"), "utf-8")
);

// ── Type mapping ──

const typeMap = {
  "Phono-semantic compound": "keisei",
  "Compound ideograph": "kaii",
  Pictograph: "shoukei",
  Ideograph: "shiji",
};

const reverseTypeMap = {};
for (const [eng, jpn] of Object.entries(typeMap)) {
  reverseTypeMap[jpn] = eng;
}

const SEP = "=".repeat(60);

console.log(SEP);
console.log("VALIDATION: kanjidict.txt vs kanji-structure.json");
console.log(SEP);

// ── 1. Coverage ──

const kdKeys = new Set(Object.keys(kanjidict));
const ksKeys = new Set(Object.keys(structure));

const inBoth = [...kdKeys].filter((k) => ksKeys.has(k));
const onlyInKd = [...kdKeys].filter((k) => !ksKeys.has(k));
const onlyInKs = [...ksKeys].filter((k) => !kdKeys.has(k));

console.log(`\n--- Coverage ---`);
console.log(`  kanjidict.txt entries:        ${kdKeys.size}`);
console.log(`  kanji-structure.json entries:  ${ksKeys.size}`);
console.log(`  In both:                       ${inBoth.length}`);
console.log(`  Only in kanjidict.txt:         ${onlyInKd.length}`);
console.log(`  Only in kanji-structure.json:  ${onlyInKs.length}`);

if (onlyInKs.length > 0) {
  console.log(`\n  Kanji in structure.json but NOT in kanjidict.txt:`);
  console.log(`  ${onlyInKs.join(" ")}`);
}

// ── 2. Structure Type Comparison ──

console.log(`\n--- Structure Type Comparison ---`);

const typeStats = {
  agree: 0,
  disagree: 0,
  kdEmpty: 0,
  ksEmpty: 0,
  bothEmpty: 0,
  ksExtraTypes: 0,
};
const disagreements = [];

for (const kanji of inBoth) {
  const kdType = kanjidict[kanji].structureType;
  const ksType = structure[kanji].type;

  const kdMapped = kdType ? typeMap[kdType] || null : null;

  if (!kdMapped && !ksType) {
    typeStats.bothEmpty++;
  } else if (!kdMapped && ksType) {
    // kanjidict empty, structure has a type
    if (["shinjitai", "kokuji", "derivative", "rebus"].includes(ksType)) {
      typeStats.ksExtraTypes++;
    } else {
      typeStats.kdEmpty++;
    }
  } else if (kdMapped && !ksType) {
    typeStats.ksEmpty++;
  } else if (kdMapped === ksType) {
    typeStats.agree++;
  } else {
    typeStats.disagree++;
    disagreements.push({ kanji, kdType, kdMapped, ksType });
  }
}

console.log(`  Agree:                         ${typeStats.agree}`);
console.log(`  Disagree:                      ${typeStats.disagree}`);
console.log(`  kanjidict empty, structure has: ${typeStats.kdEmpty}`);
console.log(`  structure empty, kanjidict has: ${typeStats.ksEmpty}`);
console.log(`  Both empty:                    ${typeStats.bothEmpty}`);
console.log(`  structure has extra type:       ${typeStats.ksExtraTypes} (shinjitai/kokuji/derivative/rebus)`);

if (disagreements.length > 0) {
  console.log(`\n  Type Disagreements (first 30):`);
  console.log(
    `  ${"Kanji".padEnd(6)} ${"kanjidict.txt".padEnd(28)} ${"kanji-structure.json".padEnd(12)}`
  );
  console.log(`  ${"─".repeat(6)} ${"─".repeat(28)} ${"─".repeat(12)}`);
  for (const d of disagreements.slice(0, 30)) {
    console.log(
      `  ${d.kanji.padEnd(6)} ${(d.kdType + " → " + d.kdMapped).padEnd(28)} ${d.ksType.padEnd(12)}`
    );
  }
  if (disagreements.length > 30) {
    console.log(`  ... and ${disagreements.length - 30} more`);
  }
}

// ── 3. Semantic Component Comparison (keisei only) ──

console.log(`\n--- Semantic Component Comparison (keisei / Phono-semantic) ---`);

const semanticStats = { agree: 0, disagree: 0, kdMissing: 0, ksMissing: 0 };
const semanticDisagreements = [];

for (const kanji of inBoth) {
  const ksEntry = structure[kanji];
  const kdEntry = kanjidict[kanji];

  // Only compare for entries that are keisei in structure.json
  if (ksEntry.type !== "keisei") continue;
  if (!ksEntry.semantic) continue;

  const ksSemantic = ksEntry.semantic;
  // kanjidict semantic = radical (col2) or radicalVariant (col3)
  const kdRadical = kdEntry.radical;
  const kdVariant = kdEntry.radicalVariant;

  if (!kdRadical) {
    semanticStats.kdMissing++;
    continue;
  }

  // Match if structure.json semantic equals either the radical or its variant
  if (ksSemantic === kdRadical || ksSemantic === kdVariant) {
    semanticStats.agree++;
  } else {
    semanticStats.disagree++;
    semanticDisagreements.push({
      kanji,
      ksSemantic,
      kdRadical,
      kdVariant: kdVariant || "-",
    });
  }
}

console.log(`  Agree:       ${semanticStats.agree}`);
console.log(`  Disagree:    ${semanticStats.disagree}`);
console.log(`  kd missing:  ${semanticStats.kdMissing}`);

if (semanticDisagreements.length > 0) {
  console.log(`\n  Semantic Disagreements (first 30):`);
  console.log(
    `  ${"Kanji".padEnd(6)} ${"structure.json".padEnd(16)} ${"kanjidict radical".padEnd(18)} ${"kanjidict variant"}`
  );
  console.log(
    `  ${"─".repeat(6)} ${"─".repeat(16)} ${"─".repeat(18)} ${"─".repeat(16)}`
  );
  for (const d of semanticDisagreements.slice(0, 30)) {
    console.log(
      `  ${d.kanji.padEnd(6)} ${d.ksSemantic.padEnd(16)} ${d.kdRadical.padEnd(18)} ${d.kdVariant}`
    );
  }
  if (semanticDisagreements.length > 30) {
    console.log(`  ... and ${semanticDisagreements.length - 30} more`);
  }
}

// ── 4. Phonetic Component Comparison (keisei only) ──

console.log(`\n--- Phonetic Component Comparison (keisei / Phono-semantic) ---`);

const phoneticStats = { agree: 0, disagree: 0, kdMissing: 0, ksMissing: 0 };
const phoneticDisagreements = [];

for (const kanji of inBoth) {
  const ksEntry = structure[kanji];
  const kdEntry = kanjidict[kanji];

  if (ksEntry.type !== "keisei") continue;
  if (!ksEntry.phonetic) continue;

  const ksPhonetic = ksEntry.phonetic;
  const kdPhonetic = kdEntry.phonetic;

  if (!kdPhonetic) {
    phoneticStats.kdMissing++;
    continue;
  }

  if (ksPhonetic === kdPhonetic) {
    phoneticStats.agree++;
  } else {
    phoneticStats.disagree++;
    phoneticDisagreements.push({ kanji, ksPhonetic, kdPhonetic });
  }
}

console.log(`  Agree:       ${phoneticStats.agree}`);
console.log(`  Disagree:    ${phoneticStats.disagree}`);
console.log(`  kd missing:  ${phoneticStats.kdMissing}`);
console.log(`  ks missing:  ${phoneticStats.ksMissing}`);

if (phoneticDisagreements.length > 0) {
  console.log(`\n  Phonetic Disagreements (first 30):`);
  console.log(
    `  ${"Kanji".padEnd(6)} ${"structure.json".padEnd(16)} ${"kanjidict.txt"}`
  );
  console.log(`  ${"─".repeat(6)} ${"─".repeat(16)} ${"─".repeat(16)}`);
  for (const d of phoneticDisagreements.slice(0, 30)) {
    console.log(
      `  ${d.kanji.padEnd(6)} ${d.ksPhonetic.padEnd(16)} ${d.kdPhonetic}`
    );
  }
  if (phoneticDisagreements.length > 30) {
    console.log(`  ... and ${phoneticDisagreements.length - 30} more`);
  }
}

// ── 5. Entries where kanjidict has data that structure.json lacks ──

console.log(`\n--- Entries kanjidict.txt can fill in for kanji-structure.json ---`);

let canFillType = 0;
let canFillSemantic = 0;
let canFillPhonetic = 0;

for (const kanji of inBoth) {
  const ksEntry = structure[kanji];
  const kdEntry = kanjidict[kanji];

  if (
    (ksEntry.type === "unknown" || !ksEntry.type) &&
    kdEntry.structureType
  ) {
    canFillType++;
  }

  if (
    ksEntry.type === "keisei" &&
    !ksEntry.semantic &&
    kdEntry.radical
  ) {
    canFillSemantic++;
  }

  if (
    ksEntry.type === "keisei" &&
    !ksEntry.phonetic &&
    kdEntry.phonetic
  ) {
    canFillPhonetic++;
  }
}

console.log(`  Can fill structure type (unknown → typed): ${canFillType}`);
console.log(`  Can fill semantic component:               ${canFillSemantic}`);
console.log(`  Can fill phonetic component:               ${canFillPhonetic}`);

// ── Key Takeaways ──

console.log(`\n${SEP}`);
console.log("KEY TAKEAWAYS");
console.log(SEP);
console.log(`
1. Coverage: ${inBoth.length} kanji in both sources, ${onlyInKd.length} only in kanjidict, ${onlyInKs.length} only in structure.json

2. Type agreement: ${typeStats.agree} agree, ${typeStats.disagree} disagree out of ${inBoth.length} shared kanji
   - ${typeStats.kdEmpty} kanji have type in structure.json but not in kanjidict
   - ${typeStats.ksEmpty} kanji have type in kanjidict but not in structure.json (could fill gaps!)

3. Semantic component: ${semanticStats.agree} agree, ${semanticStats.disagree} disagree
   - Disagreements are often radical vs variant form (e.g. 手 vs 扌)

4. Phonetic component: ${phoneticStats.agree} agree, ${phoneticStats.disagree} disagree
   - ${phoneticStats.kdMissing} keisei entries in structure.json have no phonetic in kanjidict

5. kanjidict.txt can potentially fill:
   - ${canFillType} unknown structure types
   - ${canFillSemantic} missing semantic components
   - ${canFillPhonetic} missing phonetic components
`);
