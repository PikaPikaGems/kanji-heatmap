/**
 * The radical popover's own text, from raw-data/radicals/ours-popover-text.json.
 *
 *   ours-popover-text.json ─┐
 *   radical info, sound parts├─▶ buildRadicalPopoverText → { text, info }
 *
 * Every line is our own wording, checked against the linked references
 * (`refs`, `jaRefs`). The rules are in docs/notes/radicals-pending.md
 * ("Radical popover text"). This file only checks what the build can check:
 * shapes, that each example kanji contains the radical, and that each sound
 * example really uses the radical as its sound part.
 */

import fs from "node:fs";
import path from "node:path";

export const readRadicalPopoverText = (rawDir) =>
  JSON.parse(
    fs.readFileSync(
      path.join(rawDir, "radicals", "ours-popover-text.json"),
      "utf8"
    )
  );

const ENTRY_FIELDS = new Set([
  "ja",
  "jaRefs",
  "addEn",
  "cn",
  "cnNote",
  "refs",
  "semantic",
  "sound",
]);
const SEMANTIC_FIELDS = ["kanji", "concepts", "why", "refs"];
const SOUND_FIELDS = ["kanji", "word", "reading", "gloss", "refs"];

const isText = (value) =>
  typeof value === "string" && value.trim() === value && value.length > 0;
const isRefs = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((ref) => typeof ref === "string" && ref.startsWith("https://"));
const isKana = (value) => /^[ぁ-ゖー]+$/.test(value);

const splitWords = (text) =>
  (text ?? "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

/**
 * - `text`: glyph → { ja?, jaRefs?, cn?, refs?, semantic?, sound? }, written to
 *   radical_popover_text.json. `addEn` is not in it: it is merged into `info`.
 * - `info`: the radical info with `addEn` appended to its English words
 *   (sylhare's first, then ours, no duplicates). A new object; the input is
 *   not changed.
 *
 * `containsRadical(kanji, glyph)` says whether a kanji is built with the
 * radical; `soundPartOf` and `readings` are the sound-parts data.
 *
 * Families (radicals.json) link the forms of a radical (水 ⺡ 氺). Each form
 * has its own text, except the origin: a form shows its family head's `cn`
 * unless it has its own, plus its `cnNote` (⺡ "Squeezed to fit the left
 * side."). `headOf(glyph)` gives a form's family head (null for a head or a
 * glyph in no family), and `formIn(kanji)` the form a kanji is written with
 * (雪 → ⻗), when known, so an example sits under the form it really uses.
 *
 * Throws on anything malformed, so a bad entry fails the build.
 */
export const buildRadicalPopoverText = ({
  entries,
  info,
  isRadical,
  isKanji,
  containsRadical,
  soundPartOf,
  readings,
  headOf = () => null,
  formIn = () => null,
}) => {
  const problems = [];
  const text = {};
  const mergedInfo = { ...info };

  for (const [glyph, entry] of Object.entries(entries)) {
    const where = `ours-popover-text.json ${glyph}`;
    if (!isRadical(glyph)) {
      problems.push(`${where}: not a radical in the drawer or radical info`);
      continue;
    }
    for (const field of Object.keys(entry)) {
      if (!ENTRY_FIELDS.has(field))
        problems.push(`${where}: unknown field "${field}"`);
    }

    if (entry.ja != null && !isText(entry.ja))
      problems.push(`${where}: ja must be text`);
    if (entry.jaRefs != null) {
      if (entry.ja == null) problems.push(`${where}: jaRefs without ja`);
      if (!isRefs(entry.jaRefs))
        problems.push(`${where}: jaRefs must be https links`);
    }
    if (entry.cn != null) {
      if (!isText(entry.cn)) problems.push(`${where}: cn must be text`);
      if (!isRefs(entry.refs))
        problems.push(`${where}: cn needs refs (https links)`);
    } else if (entry.refs != null && entry.cnNote == null) {
      problems.push(`${where}: refs without cn or cnNote`);
    }
    if (entry.cnNote != null) {
      const head = headOf(glyph);
      if (!isText(entry.cnNote)) problems.push(`${where}: cnNote must be text`);
      if (head == null)
        problems.push(`${where}: cnNote on a glyph that is not a form`);
      else if (entry.cn == null && entries[head]?.cn == null)
        problems.push(`${where}: cnNote, but neither it nor ${head} has cn`);
      if (!isRefs(entry.refs))
        problems.push(`${where}: cnNote needs refs (https links)`);
    }

    if (entry.addEn != null) {
      if (!isText(entry.addEn)) problems.push(`${where}: addEn must be text`);
      const base = info[glyph];
      if (base == null) {
        problems.push(`${where}: addEn, but the glyph has no radical info`);
      } else {
        const words = splitWords(base.cn);
        const seen = new Set(words.map((word) => word.toLowerCase()));
        for (const word of splitWords(entry.addEn)) {
          if (seen.has(word.toLowerCase())) {
            problems.push(
              `${where}: addEn "${word}" is already in "${base.cn}"`
            );
            continue;
          }
          seen.add(word.toLowerCase());
          words.push(word);
        }
        mergedInfo[glyph] = { ...base, cn: words.join(", ") };
      }
    }

    // One example shows no pattern, so it doesn't help a learner: a section
    // has two or more examples, or none.
    for (const field of ["semantic", "sound"]) {
      if (entry[field]?.length === 1)
        problems.push(
          `${where}: ${field} has one example; add one or remove it`
        );
    }

    for (const example of entry.semantic ?? []) {
      const label = `${where} semantic ${example.kanji}`;
      for (const field of SEMANTIC_FIELDS) {
        const ok =
          field === "refs" ? isRefs(example[field]) : isText(example[field]);
        if (!ok) problems.push(`${label}: bad or missing ${field}`);
      }
      if (!isKanji(example.kanji))
        problems.push(`${label}: not one of our kanji`);
      else if (!containsRadical(example.kanji, glyph)) {
        problems.push(`${label}: kanji doesn't contain ${glyph}`);
      } else {
        const form = formIn(example.kanji);
        const family = (g) => headOf(g) ?? g;
        if (form != null && form !== glyph && family(form) === family(glyph)) {
          problems.push(`${label}: written with ${form}, not ${glyph}`);
        }
      }
    }

    for (const example of entry.sound ?? []) {
      const label = `${where} sound ${example.kanji}`;
      for (const field of SOUND_FIELDS) {
        const ok =
          field === "refs" ? isRefs(example[field]) : isText(example[field]);
        if (!ok) problems.push(`${label}: bad or missing ${field}`);
      }
      // A radical is never its own sound example (family heads point to
      // themselves in the sound-parts data).
      if (example.kanji === glyph)
        problems.push(`${label}: the radical itself`);
      if (soundPartOf[example.kanji] !== glyph) {
        problems.push(
          `${label}: its sound part is ${soundPartOf[example.kanji] || "none"}, not ${glyph}`
        );
      }
      if (!example.word?.includes(example.kanji)) {
        problems.push(
          `${label}: word ${example.word} doesn't contain the kanji`
        );
      }
      if (!isKana(example.reading ?? ""))
        problems.push(`${label}: reading must be hiragana`);
      const sounds = readings[glyph] ?? [];
      if (!sounds.some((sound) => example.reading?.includes(sound))) {
        problems.push(
          `${label}: ${example.reading} doesn't use the sound ${sounds.join("/") || "(none)"}`
        );
      }
    }

    const shown = Object.fromEntries(
      Object.entries(entry).filter(([field]) => field !== "addEn")
    );
    if (Object.keys(shown).length > 0) text[glyph] = shown;
  }

  if (problems.length > 0) {
    throw new Error(`radical popover text:\n  - ${problems.join("\n  - ")}`);
  }
  return { text, info: mergedInfo };
};
