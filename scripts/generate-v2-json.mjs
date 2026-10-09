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
import { componentKeyword, followAlias } from "../src/lib/radicals.ts";
import { buildRadicalData, readRadicalSources } from "./radicals.mjs";
import { buildSoundParts, readSoundPartSources } from "./sound-parts.mjs";
import {
  buildRadicalPopoverText,
  readRadicalPopoverText,
} from "./radical-popover-text.mjs";
import {
  buildSphmnComponents,
  readSphmnComponents,
} from "./sphmn-components.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "raw-data");
const OUT_DIR = path.join(ROOT, "public", "json", "v2");
const REPORT_PATH = path.join(ROOT, "docs", "data", "component-coverage.json");
const SOUND_REPORT_PATH = path.join(ROOT, "docs", "data", "sound-parts.json");

const readRaw = (name) =>
  JSON.parse(fs.readFileSync(path.join(RAW_DIR, name), "utf8"));

const readRawText = (name) => fs.readFileSync(path.join(RAW_DIR, name), "utf8");

// Kanji Heatmap Data release files live in their own folder, untouched.
const readRelease = (name) => readRaw(path.join("kanji-heatmap-data", name));

const problems = [];
const fail = (message) => problems.push(message);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const main = readRelease("kanji_main.json");
const extended = readRelease("kanji_extended.json");
const repWords = readRelease("kanji_representative_words.json");
const phonetic = readRelease("phonetic.json");
const vocabFurigana = readRelease("vocab_furigana.json");
const vocabMeaning = readRelease("vocab_meaning.json");
const decomposition = readRaw("radicals/external/rewhowe-decomposition.json");
const similarKanjis = readRelease("similar-kanjis.json");
const readingDetails = readRaw("misc/external/kanji-readings-details.json");
const cumUse = readRelease("cum_use.json");
// Drawer grouping comes from rewhowe/kanji; everything else radical-related
// that we decided ourselves is in raw-data/radicals/ours.json.
const { drawer, ours, sylhareRows } = readRadicalSources(RAW_DIR);
const structureSources = {
  hl: readRaw("kanji-structure/external/hlorenzi.json"),
  ka: readRaw("kanji-structure/external/kanjium.json"),
  sc: readRaw("kanji-structure/external/scott.json"),
  ya: readRaw("kanji-structure/external/yagays.json"),
};

// Every glyph the app can show: drawer radicals, kanji, and the parts in the
// decomposition and structure data. Radical glyphs outside this set (⿊, 靣)
// are dropped from the radical data.
const shownGlyphs = new Set([
  ...Object.values(drawer).flat(),
  ...Object.keys(main),
]);
const addShown = (value) => {
  if (typeof value === "string") for (const ch of value) shownGlyphs.add(ch);
  else if (value != null && typeof value === "object")
    Object.values(value).forEach(addShown);
};
addShown(decomposition);
Object.values(structureSources).forEach(addShown);

const radicals = { radicalsGroupedByStrokeCount: drawer };
const {
  aliases: allAliases,
  keywords: radicalKeywords,
  info: radicalInfo,
  families: radicalFamilies,
} = buildRadicalData({
  sylhareRows,
  ours,
  drawer,
  isKanji: (char) => main[char] != null,
  isUsed: (char) => shownGlyphs.has(char),
});
const { components: manualOverrides, sharedKanjiKeywords } = readRaw(
  "components/ours.json"
);

const kanjiList = Object.keys(main);
const isKanji = (char) => main[char] != null;

// Official jōyō list, one kanji per line. kanji_extended tags ~280 name kanji
// (伊, 彦, 智, …) as grade 9, so the list decides who gets a grade at all.
// The list uses some official forms we store differently (剝 → 剥); the pairs
// are `jouyouForms` in misc/ours.json.
const { jouyouForms } = readRaw("misc/ours.json");
const jouyou = new Set(
  readRawText("misc/external/jouyou_kanji.txt")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((char) => jouyouForms[char] ?? char)
);
if (jouyou.size !== 2136) {
  fail(`jouyou_kanji.txt: expected 2136 kanji, got ${jouyou.size}`);
}
for (const char of jouyou) {
  if (!isKanji(char)) fail(`jouyou_kanji.txt: ${char} is not in kanji_main`);
}

// TopoKanji Twitter: one character per line, 1-based index. Radicals that
// are not in kanji_main are skipped for storage but do not compact later
// indexes, so a kanji's number matches the published list.
const topoTwitterIndex = new Map();
{
  const lines = readRawText("misc/external/topokanji_index_twitter.txt")
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

const JOUYOU_GRADES = new Set([1, 2, 3, 4, 5, 6, 9]);
const jouyouGradeOf = (kanji) => {
  const grade = numberAt(kanji, "jouyouGrade");
  if (!jouyou.has(kanji)) return -1;
  if (!JOUYOU_GRADES.has(grade)) {
    fail(`kanji_main: jōyō kanji ${kanji} has grade ${grade}`);
  }
  return grade;
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
    jouyouGradeOf(kanji),
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

// Sound parts: the release's, filled in from the Anki deck, with our own
// choices on top (scripts/sound-parts.mjs, raw-data/sound-parts/). The source
// uses "" for most kanji without a phonetic component but an empty array for
// some; both mean "none".
const releaseSoundPartOf = {};
for (const kanji of kanjiList) {
  const ref = extended[kanji][EXT.phonetic];
  if (typeof ref === "string" && ref.length > 0)
    releaseSoundPartOf[kanji] = ref;
}
const releaseReadings = {};
for (const [char, sounds] of Object.entries(phonetic)) {
  if (Array.isArray(sounds) && sounds.length > 0)
    releaseReadings[char] = sounds;
}
// Kanji that have a part as a direct, top-level piece in a Character
// Structure source (yagays and ScottOglesby list them; hlorenzi names the
// meaning and sound parts). Used to judge whether a sound hint holds.
const kanjiWithPartIndex = new Map();
for (const kanji of kanjiList) {
  const hl = structureSources.hl[kanji] ?? {};
  const parts = new Set([
    ...(structureSources.ya[kanji] ?? []),
    ...(structureSources.sc[kanji] ?? []),
    hl.semantic,
    hl.phonetic,
  ]);
  for (const part of parts) {
    if (typeof part !== "string" || part.length === 0) continue;
    kanjiWithPartIndex.set(part, [
      ...(kanjiWithPartIndex.get(part) ?? []),
      kanji,
    ]);
  }
}
let soundParts;
try {
  soundParts = buildSoundParts({
    releaseSoundPartOf,
    releaseReadings,
    ...readSoundPartSources(RAW_DIR),
    isKanji,
    onReadingsOf: (kanji) => extended[kanji][EXT.allOn] ?? [],
    kanjiWithPart: (part) => kanjiWithPartIndex.get(part) ?? [],
  });
} catch (error) {
  fail(error.message);
  soundParts = { soundPartOf: {}, readings: {}, report: {} };
}

const outGeneral = {};
const outHover = {};
for (const kanji of kanjiList) {
  const entry = extended[kanji];
  outGeneral[kanji] = [
    entry[EXT.meanings] ?? [],
    entry[EXT.allOn] ?? [],
    entry[EXT.allKun] ?? [],
  ];
  outHover[kanji] = [
    entry[EXT.parts] ?? [],
    soundParts.soundPartOf[kanji] ?? "",
    entry[EXT.mainVocab] ?? [],
  ];
}

// ---------------------------------------------------------------------------
// radical_popover_text.json — our own popover text per radical
// (scripts/radical-popover-text.mjs). Loaded only when a radical popover
// opens. Its `addEn` words are merged into the radical info instead.
// ---------------------------------------------------------------------------

const drawerGlyphs = new Set(
  Object.values(radicals.radicalsGroupedByStrokeCount).flat()
);
const familyHeadOf = new Map();
for (const [head, members] of Object.entries(radicalFamilies)) {
  for (const member of members) {
    if (typeof member === "string") familyHeadOf.set(member, head);
  }
}
let radicalPopover;
try {
  radicalPopover = buildRadicalPopoverText({
    entries: readRadicalPopoverText(RAW_DIR),
    info: radicalInfo,
    isRadical: (glyph) => drawerGlyphs.has(glyph) || glyph in radicalInfo,
    isKanji,
    // The radical-search index: the drawer radicals each kanji contains. A
    // form outside the drawer is searched as its alias (⻗ → 雨).
    containsRadical: (kanji, glyph) =>
      [...(decomposition[kanji] ?? "")].includes(
        followAlias(glyph, allAliases, (g) => drawerGlyphs.has(g)) ?? glyph
      ),
    headOf: (glyph) => {
      const head = familyHeadOf.get(glyph);
      return head == null || head === glyph ? null : head;
    },
    // kanjium names the radical form a kanji is written with: [radical,
    // variant, …] (雪: 雨, ⻗). Other codes for a form count as that form.
    // Its mistakes are fixed in radicals/ours.json (kanjiumFormFixes).
    formIn: (kanji) => {
      const [radical, variant] = structureSources.ka[kanji] ?? [];
      const glyph = ours.kanjiumFormFixes?.[kanji]?.form ?? variant ?? radical;
      if (glyph == null) return null;
      return (
        followAlias(glyph, allAliases, (g) => familyHeadOf.has(g)) ?? glyph
      );
    },
    otherNamesOf: (glyph) =>
      (radicalFamilies[glyph] ?? [])
        .filter((member) => typeof member !== "string")
        .map((member) => member.ja),
    soundPartOf: soundParts.soundPartOf,
    readings: soundParts.readings,
  });
} catch (error) {
  fail(error.message);
  radicalPopover = { text: {}, info: radicalInfo };
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

// ---------------------------------------------------------------------------
// components.json — keyword, sounds and stroke count per component.
//
// Keyword priority (first wins): raw-data/components/ours.json, then the
// radical name, then the alias target's keyword (followed in the app).
// The release's component_keyword.json is not read; the keywords we kept
// from it live in components/ours.json.
// ---------------------------------------------------------------------------

const components = {};

for (const [char, sounds] of Object.entries(soundParts.readings)) {
  components[char] = { ...components[char], s: sounds };
}

for (const [strokes, list] of Object.entries(
  radicals.radicalsGroupedByStrokeCount
)) {
  for (const char of list) {
    components[char] = { ...components[char], n: Number(strokes) };
  }
}

// Radical names (scripts/radicals.mjs). Never on a kanji: every call site
// reads kanji_main first, and an alias that reaches a kanji shows its kanji
// keyword (componentKeyword in src/lib/radicals.ts).
for (const [char, k] of Object.entries(radicalKeywords)) {
  components[char] = { ...components[char], k };
}

// Manual curation wins over everything the algorithm produced.
for (const [char, entry] of Object.entries(manualOverrides)) {
  components[char] = { ...components[char], ...entry };
}
for (const [char, entry] of Object.entries(components)) {
  if (isKanji(char) && entry.k != null) {
    fail(`components: ${char} is a kanji; it shows its kanji_main keyword`);
  }
}

// Aliases point at the glyph that holds the data (氵 → ⺡). Nothing is copied
// onto the alias: the app follows it (followAlias in src/lib/radicals.ts), so
// every fact is stored once. Here we only check each alias leads somewhere.
for (const [char, alias] of Object.entries(allAliases)) {
  if (alias !== alias.trim() || alias.length === 0) {
    fail(`components: alias for ${char} is not a clean value ("${alias}")`);
    continue;
  }
  if (char === alias) {
    fail(`components: ${char} aliases itself`);
    continue;
  }
  const target = followAlias(
    char,
    allAliases,
    (g) => components[g]?.k != null || isKanji(g)
  );
  if (target == null) {
    fail(`components: ${char} never reaches a keyword or a kanji`);
  }
}

// A keyword we typed must not clash with another component's keyword.
// Radical names may repeat on purpose (an alternate form shares its row).
const charsByKeyword = {};
for (const [char, entry] of Object.entries(components)) {
  if (entry.k == null) continue;
  (charsByKeyword[entry.k.trim().toLowerCase()] ??= []).push(char);
}
for (const [char, entry] of Object.entries(manualOverrides)) {
  if (entry.k == null) continue;
  const chars = charsByKeyword[entry.k.trim().toLowerCase()];
  if (chars.length > 1) {
    fail(`components: "${entry.k}" (${char}) is shared by ${chars.join(" ")}`);
  }
}

// A component keyword must not be a kanji keyword either, or two different
// characters look like the same thing (戈 and 槍 were both "spear"). The
// allowed pairs are `sharedKanjiKeywords` in components/ours.json: the same
// character at a Kangxi-radical codepoint, and 已, the glyph the radical
// drawer uses for 己 — the same radical, so the same keyword.
const kanjiByKeyword = {};
for (const kanji of kanjiList) {
  kanjiByKeyword[main[kanji][0].trim().toLowerCase()] ??= kanji;
}
for (const [char, entry] of Object.entries(components)) {
  if (entry.k == null || isKanji(char)) continue;
  const kanji = kanjiByKeyword[entry.k.trim().toLowerCase()];
  if (kanji == null || sharedKanjiKeywords[char] === kanji) continue;
  fail(`components: "${entry.k}" (${char}) is also the keyword of ${kanji}`);
}

// ---------------------------------------------------------------------------
// sphmn_components.json — component search (scripts/sphmn-components.mjs).
// Stroke counts only order ties: a kanji's own count, else the radical
// drawer's. 371 components have neither and sort after the rest.
// ---------------------------------------------------------------------------

const sphmn = buildSphmnComponents({
  rows: readSphmnComponents(RAW_DIR),
  codepointFixes: ours.sphmnCodepointFixes ?? {},
  jouyouForms,
  isKanji,
  strokesOf: (char) =>
    isKanji(char) ? Number(extended[char][EXT.strokes]) : components[char]?.n,
});
sphmn.problems.forEach(fail);

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
// Coverage report: every component referenced anywhere that still has no
// keyword, ordered by how often it is referenced. This is the worklist for
// raw-data/components/ours.json.
// ---------------------------------------------------------------------------

const references = new Map();

// Ideographic Description Characters (⿰ ⿱ ⿸ ...) describe how a kanji is laid
// out, not what it is made of. They are never components and must not show up
// as gaps to fill.
const isIdsOperator = (char) => {
  const code = char.codePointAt(0);
  return code >= 0x2ff0 && code <= 0x2fff;
};

const noteReference = (char, source) => {
  if (typeof char !== "string" || [...char].length !== 1) return;
  if (isKanji(char) || isIdsOperator(char)) return;
  const entry = references.get(char) ?? { refs: 0, sources: new Set() };
  entry.refs += 1;
  entry.sources.add(source);
  references.set(char, entry);
};

for (const kanji of kanjiList) {
  for (const part of extended[kanji][EXT.parts] ?? []) {
    noteReference(part, "parts");
  }
  noteReference(outHover[kanji][1], "phonetic-ref");
}
for (const chars of Object.values(decomposition)) {
  for (const char of chars) noteReference(char, "decomposition");
}
// scott and yagays are plain component lists; kanjium is
// [semantic, radicalVariant, phonetic, idsStructure, structureType] so only
// the first three slots name components; hlorenzi is an object.
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

// Same lookup as the app, so an alias that reaches a kanji counts (衤 → 衣).
const kanjiKeyword = (char) => main[char]?.[0];
const missing = [...references.entries()]
  .filter(
    ([char]) =>
      componentKeyword(char, components, allAliases, kanjiKeyword) == null
  )
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
write("radicals.json", {
  groupedByStrokeCount: radicals.radicalsGroupedByStrokeCount,
  aliases: allAliases,
  info: radicalPopover.info,
  families: radicalFamilies,
});
write("radical_popover_text.json", radicalPopover.text);
write("kanji_structures.json", outStructures);
write("sphmn_components.json", sphmn.list);
// Pass-throughs: reshaping nothing, only normalising the file names.
write("kanji_decomposition.json", decomposition);
write("similar_kanjis.json", similarKanjis);
write("kanji_reading_details.json", readingDetails);
write("cum_use.json", cumUse);

fs.writeFileSync(REPORT_PATH, JSON.stringify(coverageReport, null, 2) + "\n");
fs.writeFileSync(
  SOUND_REPORT_PATH,
  JSON.stringify(soundParts.report, null, 2) + "\n"
);

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
console.log("Wrote public/json/v2:");
for (const [name, bytes, entries] of written) {
  console.log(
    `  ${name.padEnd(30)} ${kb(bytes).padStart(8)}  ${entries} entries`
  );
}
console.log(
  `\nsph-mn components: ${sphmn.list.length} kept, dropped ` +
    JSON.stringify(sphmn.dropped)
);
console.log(
  `\nComponent coverage: ${coverageReport.summary.withKeyword}/${coverageReport.summary.referenced} ` +
    `have a keyword, ${coverageReport.summary.missing} missing ` +
    `(see docs/data/component-coverage.json)`
);
