/**
 * Builds everything the app fetches at runtime.
 *
 *   raw-data/  ──▶  scripts/generate-v2-json.mjs  ──▶  public/json/v2/
 *
 * Inputs are never served and outputs are never hand-edited; see
 * raw-data/README.md. Every invariant this pipeline depends on is asserted
 * here, so a bad data drop fails the build instead of reaching the browser.
 *
 * Run with: pnpm run generate-json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeFurigana, encodeFurigana } from "../src/lib/furigana.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "raw-data");
const OUT_DIR = path.join(ROOT, "public", "json", "v2");
const REPORT_PATH = path.join(ROOT, "docs", "data", "component-coverage.json");

const readRaw = (name) =>
  JSON.parse(fs.readFileSync(path.join(RAW_DIR, name), "utf8"));

const readRawText = (name) => fs.readFileSync(path.join(RAW_DIR, name), "utf8");

const problems = [];
const fail = (message) => problems.push(message);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const main = readRaw("kanji_main.json");
const extended = readRaw("kanji_extended.json");
const repWords = readRaw("kanji_representative_words.json");
const componentKeywords = readRaw("component_keyword.json");
const phonetic = readRaw("phonetic.json");
const vocabFurigana = readRaw("vocab_furigana.json");
const vocabMeaning = readRaw("vocab_meaning.json");
const decomposition = readRaw("kanji_decomposition.json");
const similarKanjis = readRaw("similar-kanjis.json");
const readingDetails = readRaw("kanji-readings-details.json");
const cumUse = readRaw("cum_use.json");
const radicals = readRaw("radicals.json");
const radicalAliases = readRaw("radical_aliases.json");
const formKeywords = readRaw("radical_form_keywords.json");
const aiRadicals = readRaw("AI_radicals.json");
const manualOverrides = readRaw("components_manual_overrides.json");

const structureSources = {
  hl: readRaw("kanji-structure-hlorenzi.json"),
  ka: readRaw("kanji-structure-kanjium.json"),
  sc: readRaw("kanji-structure-scott.json"),
  ya: readRaw("kanji-structure-yagays.json"),
};

const kanjiList = Object.keys(main);
const isKanji = (char) => main[char] != null;

// TopoKanji Twitter: one character per line, 1-based index. Radicals that
// are not in kanji_main are skipped for storage but do not compact later
// indexes, so a kanji's number matches the published list.
const topoTwitterIndex = new Map();
{
  const lines = readRawText("topokanji_index_twitter.txt")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const chars = [...lines[i]];
    if (chars.length !== 1) {
      fail(
        `topokanji_index_twitter: line ${i + 1} is not a single character: ${JSON.stringify(lines[i])}`
      );
      continue;
    }
    const char = chars[0];
    if (topoTwitterIndex.has(char)) {
      fail(
        `topokanji_index_twitter: duplicate ${char} at lines ${topoTwitterIndex.get(char)} and ${i + 1}`
      );
      continue;
    }
    topoTwitterIndex.set(char, i + 1);
  }
}

// v1 tuple layouts, named once so the field mapping below reads clearly.
// kanji_main:     [keyword, on, kun, jlptRaw, freq]
// kanji_extended: [parts, strokes, _rtkOld, wk, jouyouGrade, meanings,
//                  allOn, allKun, phonetic, mainVocab, kklcIndex, rtk]
const EXT = {
  parts: 0,
  strokes: 1,
  wk: 3,
  jouyouGrade: 4,
  meanings: 5,
  allOn: 6,
  allKun: 7,
  phonetic: 8,
  mainVocab: 9,
  kklcIndex: 10,
  rtk: 11,
};

// ---------------------------------------------------------------------------
// kanji_main.json — the one eagerly loaded file
//
// Absorbs the five fields that sort/filter needs (they used to force the whole
// extended file to load at first paint) and the representative word/reading
// that expanded tiles render synchronously. Merging the representative word in
// also stops 2,426 kanji keys from being written to a second file.
// ---------------------------------------------------------------------------

const numberAt = (kanji, field) => {
  const value = extended[kanji]?.[EXT[field]];
  if (typeof value !== "number") {
    fail(`kanji_main: ${kanji} has non-numeric ${field}: ${String(value)}`);
    return -1;
  }
  return value;
};

const outMain = {};
for (const kanji of kanjiList) {
  const [keyword, on, kun, jlptRaw, freq] = main[kanji];
  const rep = repWords[kanji];

  if (extended[kanji] == null) {
    fail(`kanji_main: ${kanji} is missing from kanji_extended.json`);
    continue;
  }

  outMain[kanji] = [
    keyword,
    on,
    kun,
    jlptRaw,
    freq,
    numberAt(kanji, "strokes"),
    numberAt(kanji, "jouyouGrade"),
    numberAt(kanji, "wk"),
    numberAt(kanji, "kklcIndex"),
    numberAt(kanji, "rtk"),
    topoTwitterIndex.get(kanji) ?? -1,
    rep ? rep[0] : null,
    rep ? rep[1] : null,
  ];
}

// ---------------------------------------------------------------------------
// Extended split: "general" feeds the details section and text search,
// "hover" feeds the hover card. Splitting means a user who only hovers never
// downloads the meanings/readings blob, and vice versa.
// ---------------------------------------------------------------------------

const outGeneral = {};
const outHover = {};
for (const kanji of kanjiList) {
  const entry = extended[kanji];
  outGeneral[kanji] = [
    entry[EXT.meanings] ?? [],
    entry[EXT.allOn] ?? [],
    entry[EXT.allKun] ?? [],
  ];
  // The source uses "" for most kanji without a phonetic component but an
  // empty array for some; normalise so the field is always a string.
  const phoneticRef = entry[EXT.phonetic];
  outHover[kanji] = [
    entry[EXT.parts] ?? [],
    typeof phoneticRef === "string" ? phoneticRef : "",
    entry[EXT.mainVocab] ?? [],
  ];
}

// ---------------------------------------------------------------------------
// rep_word_details.json — gloss and emoji tag, used only by the hover card,
// the details page and practice decks, so they stay out of the eager file.
// ---------------------------------------------------------------------------

const outRepDetails = {};
for (const [kanji, entry] of Object.entries(repWords)) {
  if (entry == null) continue;
  const [, , gloss, emojiTag] = entry;
  outRepDetails[kanji] = [gloss ?? "", emojiTag ?? ""];
}

// ---------------------------------------------------------------------------
// vocab.json — furigana + meaning in one file, furigana as a single string.
// ---------------------------------------------------------------------------

const outVocab = {};
for (const [word, parts] of Object.entries(vocabFurigana)) {
  const encoded = encodeFurigana(parts);

  // The encoding must be reversible for every word, or furigana silently
  // changes in the UI.
  const expected = JSON.stringify(
    parts.map((part) => (part[1] != null ? [part[0], part[1]] : [part[0]]))
  );
  if (JSON.stringify(decodeFurigana(encoded)) !== expected) {
    fail(`vocab: furigana for ${word} does not round-trip (${encoded})`);
  }

  outVocab[word] = [encoded, vocabMeaning[word] ?? ""];
}

/**
 * Build public/json/v2/components.json and the coverage report.
 *
 * Keyword sources, in order (later steps only run after earlier ones):
 *
 *   1. component_keyword.json      data tarball — fill
 *   2. radicals.json keywords      moreRadicalKeywords + nonRadicalVariantKeywords — fill
 *   3. radical_form_keywords.json  Kangxi form/position variants — FILL GAPS ONLY
 *   4. AI_radicals.json            collisions, phonetics, parallel nicknames — MAY OVERWRITE
 *   5. radical_aliases.json        encoding twins copy the target's k
 *                                  Chains stop at the first hop that already has a
 *                                  keyword (⺕ → 彐 "pig snout", not ヨ "katakana yo").
 *                                  彐 → ヨ stays for search; it is not a keyword twin.
 *   6. drop k when the char is in kanji_main — that keyword lives only there
 *   7. components_manual_overrides.json  human last; do not machine-edit this file
 *
 * After merge this function:
 *   - fails the build if the same keyword is used by two chars that are not
 *     alias-connected, or if a component keyword collides with kanji_main
 *   - reports missing keywords (not fatal) via docs/data/component-coverage.json
 */
function buildComponentsRegistry({
  main,
  extended,
  componentKeywords,
  phonetic,
  radicals,
  radicalAliases,
  formKeywords,
  aiRadicals,
  manualOverrides,
  structureSources,
  kanjiList,
  isKanji,
  fail,
  EXT,
  decomposition,
}) {
  const components = {};
  const keywordOrigin = {};

  const keywordOf = (entry) => {
    if (typeof entry === "string") return entry;
    if (entry != null && typeof entry.k === "string") return entry.k;
    return null;
  };

  const setKeyword = (char, keyword, source, { overwrite = false } = {}) => {
    if (keyword == null || keyword.trim().length === 0) return;
    const trimmed = keyword.trim();
    const existing = components[char]?.k;

    if (existing != null) {
      if (!overwrite) {
        if (existing.toLowerCase() !== trimmed.toLowerCase()) {
          fail(
            `components: conflicting keywords for ${char} — ` +
              `"${existing}" (${keywordOrigin[char]}) vs "${trimmed}" (${source})`
          );
        }
        return;
      }
    }

    components[char] = { ...components[char], k: trimmed };
    keywordOrigin[char] = source;
  };

  for (const [char, keyword] of Object.entries(componentKeywords)) {
    setKeyword(char, keyword, "component_keyword.json");
  }
  for (const [char, keyword] of Object.entries(radicals.moreRadicalKeywords)) {
    setKeyword(char, keyword, "radicals.moreRadicalKeywords");
  }
  for (const [char, keyword] of Object.entries(
    radicals.nonRadicalVariantKeywords
  )) {
    setKeyword(char, keyword, "radicals.nonRadicalVariantKeywords");
  }

  // Form variants: never clobber a name another source already chose.
  for (const [char, entry] of Object.entries(formKeywords)) {
    if (components[char]?.k != null) continue;
    setKeyword(char, keywordOf(entry), "radical_form_keywords.json");
  }

  // AI layer may replace a bad or colliding name.
  for (const [char, entry] of Object.entries(aiRadicals)) {
    const keyword = keywordOf(entry);
    if (keyword == null) continue;
    setKeyword(char, keyword, "AI_radicals.json", { overwrite: true });
  }

  for (const [char, sounds] of Object.entries(phonetic)) {
    if (!Array.isArray(sounds) || sounds.length === 0) continue;
    components[char] = { ...components[char], s: sounds };
  }

  for (const [strokes, list] of Object.entries(
    radicals.radicalsGroupedByStrokeCount
  )) {
    for (const char of list) {
      components[char] = { ...components[char], n: Number(strokes) };
    }
  }

  const resolveAlias = (start) => {
    const seen = [start];
    let current = radicalAliases[start];

    while (current != null) {
      if (seen.includes(current)) {
        fail(`components: alias cycle ${[...seen, current].join(" -> ")}`);
        return null;
      }
      seen.push(current);

      if (components[current]?.k != null || isKanji(current)) return current;
      current = radicalAliases[current];
    }

    return seen[seen.length - 1] === start ? null : seen[seen.length - 1];
  };

  for (const [char, alias] of Object.entries(radicalAliases)) {
    if (alias !== alias.trim() || alias.length === 0) {
      fail(`components: alias for ${char} is not a clean value ("${alias}")`);
      continue;
    }
    if (char === alias) {
      fail(`components: ${char} aliases itself`);
      continue;
    }
    if (components[char]?.k != null) continue;

    const target = resolveAlias(char);
    if (target == null) continue;

    if (components[target]?.k != null) {
      setKeyword(char, components[target].k, `alias of ${target}`);
    } else if (!isKanji(target)) {
      fail(
        `components: ${char} resolves to ${target}, which has no keyword and is not a kanji`
      );
    }
  }

  let droppedKanjiKeywords = 0;
  for (const char of Object.keys(components)) {
    if (!isKanji(char) || components[char].k == null) continue;
    delete components[char].k;
    droppedKanjiKeywords += 1;
    if (Object.keys(components[char]).length === 0) delete components[char];
  }

  for (const [char, entry] of Object.entries(manualOverrides)) {
    components[char] = { ...components[char], ...entry };
    if (entry.k != null) {
      keywordOrigin[char] = "components_manual_overrides.json";
    }
  }

  // A shared keyword is allowed only inside one alias group (encoding twins).
  // ヨ can sit in 彐's search chain with a different keyword.
  const parent = new Map();
  const find = (x) => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x);
    if (p !== x) {
      const root = find(p);
      parent.set(x, root);
      return root;
    }
    return x;
  };
  for (const [from, to] of Object.entries(radicalAliases)) {
    parent.set(find(from), find(to));
  }

  const byKeyword = new Map();
  for (const [char, entry] of Object.entries(components)) {
    if (entry.k == null) continue;
    const key = entry.k.toLowerCase();
    if (!byKeyword.has(key)) byKeyword.set(key, []);
    byKeyword.get(key).push(char);
  }

  for (const [, chars] of byKeyword) {
    if (chars.length < 2) continue;
    const roots = new Set(chars.map(find));
    if (roots.size > 1) {
      fail(
        `components: keyword "${components[chars[0]].k}" is used by ` +
          `unrelated characters ${chars.join(", ")}`
      );
    }
  }

  for (const [kanji, entry] of Object.entries(main)) {
    const kanjiKeyword = String(entry[0]).toLowerCase();
    const users = byKeyword.get(kanjiKeyword);
    if (users == null) continue;
    fail(
      `components: keyword "${entry[0]}" collides with kanji ${kanji} ` +
        `(${users.join(", ")})`
    );
  }

  const isIdsOperator = (char) => {
    const code = char.codePointAt(0);
    return code >= 0x2ff0 && code <= 0x2fff;
  };

  const references = new Map();
  const noteReference = (char, source) => {
    if (typeof char !== "string" || [...char].length !== 1) return;
    if (isKanji(char) || isIdsOperator(char)) return;
    const ref = references.get(char) ?? { refs: 0, sources: new Set() };
    ref.refs += 1;
    ref.sources.add(source);
    references.set(char, ref);
  };

  for (const kanji of kanjiList) {
    for (const part of extended[kanji][EXT.parts] ?? []) {
      noteReference(part, "parts");
    }
    noteReference(extended[kanji][EXT.phonetic], "phonetic-ref");
  }
  for (const chars of Object.values(decomposition)) {
    for (const char of chars) noteReference(char, "decomposition");
  }
  for (const value of Object.values(structureSources.sc)) {
    for (const char of value ?? []) noteReference(char, "sc");
  }
  for (const value of Object.values(structureSources.ya)) {
    for (const char of value ?? []) noteReference(char, "ya");
  }
  for (const value of Object.values(structureSources.ka)) {
    for (const char of (value ?? []).slice(0, 3)) noteReference(char, "ka");
  }
  for (const value of Object.values(structureSources.hl)) {
    noteReference(value?.semantic, "hl");
    noteReference(value?.phonetic, "hl");
  }
  for (const list of Object.values(radicals.radicalsGroupedByStrokeCount)) {
    for (const char of list) noteReference(char, "radical-drawer");
  }

  const missing = [...references.entries()]
    .filter(([char]) => components[char]?.k == null)
    .map(([char, entry]) => ({
      char,
      refs: entry.refs,
      sources: [...entry.sources].sort(),
    }))
    .sort((a, b) => b.refs - a.refs || a.char.localeCompare(b.char));

  const coverageReport = {
    summary: {
      referenced: references.size,
      withKeyword: references.size - missing.length,
      missing: missing.length,
    },
    missing,
  };

  return { components, droppedKanjiKeywords, coverageReport };
}

// ---------------------------------------------------------------------------
// components.json
// ---------------------------------------------------------------------------

const { components, droppedKanjiKeywords, coverageReport } =
  buildComponentsRegistry({
    main,
    extended,
    componentKeywords,
    phonetic,
    radicals,
    radicalAliases,
    formKeywords,
    aiRadicals,
    manualOverrides,
    structureSources,
    kanjiList,
    isKanji,
    fail,
    EXT,
    decomposition,
  });

// ---------------------------------------------------------------------------
// kanji_structures.json — the four interpretations in one file. Sources are
// heterogeneous (object / 5-tuple / two component lists) and each covers a
// different subset of kanji, so absent sources are omitted rather than nulled.
// ---------------------------------------------------------------------------

const outStructures = {};
const structureKanji = new Set(
  Object.values(structureSources).flatMap((source) => Object.keys(source))
);
for (const kanji of structureKanji) {
  const entry = {};
  for (const [key, source] of Object.entries(structureSources)) {
    if (source[kanji] != null) entry[key] = source[kanji];
  }
  if (Object.keys(entry).length > 0) outStructures[kanji] = entry;
}

// ---------------------------------------------------------------------------
// Invariants that must hold before anything is written
// ---------------------------------------------------------------------------

const expectSameSize = (label, value, reference) => {
  const size = Object.keys(value).length;
  if (size !== reference) {
    fail(`${label}: expected ${reference} entries, got ${size}`);
  }
};

expectSameSize("kanji_main", outMain, kanjiList.length);
expectSameSize("kanji_extended_general", outGeneral, kanjiList.length);
expectSameSize("kanji_extended_hover", outHover, kanjiList.length);
expectSameSize("vocab", outVocab, Object.keys(vocabFurigana).length);

for (const [kanji, entry] of Object.entries(outMain)) {
  if (entry.length !== 13) {
    fail(`kanji_main: ${kanji} has ${entry.length} slots, expected 13`);
    break;
  }
}

// Every sort and filter option must be answerable from kanji_main alone,
// otherwise the eagerly loaded file is incomplete and sorting would need a
// lazy dataset at first paint.
const MAIN_SLOT = {
  strokes: 5,
  jouyouGrade: 6,
  wk: 7,
  kklcIndex: 8,
  rtk: 9,
  topoTwitterIndex: 10,
};
for (const [field, slot] of Object.entries(MAIN_SLOT)) {
  const missingField = kanjiList.find(
    (kanji) => typeof outMain[kanji]?.[slot] !== "number"
  );
  if (missingField) {
    fail(`kanji_main: ${missingField} has no numeric ${field} at slot ${slot}`);
  }
}

if (problems.length > 0) {
  console.error(
    `\ngenerate-v2-json failed with ${problems.length} problem(s):`
  );
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  if (problems.length > 40) {
    console.error(`  ... and ${problems.length - 40} more`);
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

const written = [];
const write = (name, value) => {
  const json = JSON.stringify(value);
  fs.writeFileSync(path.join(OUT_DIR, name), json);
  // Byte length, not string length: these files are mostly Japanese, where one
  // UTF-16 code unit is three UTF-8 bytes, so `json.length` understates the
  // file by ~25%. The whole eager/lazy split was argued from these numbers.
  written.push([name, Buffer.byteLength(json), Object.keys(value).length]);
};

write("kanji_main.json", outMain);
write("kanji_extended_general.json", outGeneral);
write("kanji_extended_hover.json", outHover);
write("rep_word_details.json", outRepDetails);
write("vocab.json", outVocab);
write("components.json", components);
write("kanji_structures.json", outStructures);
// Pass-throughs: reshaping nothing, only normalising the file names.
write("kanji_decomposition.json", decomposition);
write("similar_kanjis.json", similarKanjis);
write("kanji_reading_details.json", readingDetails);
write("cum_use.json", cumUse);

fs.writeFileSync(REPORT_PATH, JSON.stringify(coverageReport, null, 2) + "\n");

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
console.log("Wrote public/json/v2:");
for (const [name, bytes, entries] of written) {
  console.log(
    `  ${name.padEnd(30)} ${kb(bytes).padStart(8)}  ${entries} entries`
  );
}
console.log(
  `\nComponent coverage: ${coverageReport.summary.withKeyword}/${coverageReport.summary.referenced} ` +
    `have a keyword, ${coverageReport.summary.missing} missing ` +
    `(see docs/data/component-coverage.json)`
);
if (coverageReport.summary.missing === 0) {
  console.log("Component keywords: unique, none missing");
} else {
  console.log(
    `Component keywords: unique among named entries; ${coverageReport.summary.missing} still missing`
  );
}
console.log(
  `Dropped ${droppedKanjiKeywords} component keywords that kanji_main already answers`
);
