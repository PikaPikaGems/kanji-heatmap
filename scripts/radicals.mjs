/**
 * Everything radical-related that the build derives from raw-data/radicals/.
 *
 *   external/sylhare-radicals.csv  ─┐
 *   ours.json                       ├─▶ buildBushuEntries, mergeSylhareBushuAliases
 *   external/rewhowe-drawer.json   ─┘
 *
 * Files in external/ are read, never written. Our own choices (English
 * translations, aliases, sylhare fixes, missing forms) live in ours.json.
 */

import fs from "node:fs";
import path from "node:path";

export const isPua = (ch) => {
  const code = ch.codePointAt(0);
  return code >= 0xe000 && code <= 0xf8ff;
};

const isGlyph = (ch) =>
  typeof ch === "string" &&
  [...ch].length === 1 &&
  ch.trim().length > 0 &&
  !isPua(ch);

export const parseCsv = (text) => {
  const rows = [];
  let i = 0;
  const field = () => {
    if (text[i] === '"') {
      i += 1;
      let out = "";
      while (i < text.length) {
        if (text[i] === '"' && text[i + 1] === '"') {
          out += '"';
          i += 2;
          continue;
        }
        if (text[i] === '"') {
          i += 1;
          break;
        }
        out += text[i];
        i += 1;
      }
      return out;
    }
    const start = i;
    while (
      i < text.length &&
      text[i] !== "," &&
      text[i] !== "\n" &&
      text[i] !== "\r"
    ) {
      i += 1;
    }
    return text.slice(start, i);
  };

  while (i < text.length) {
    const row = [];
    while (i < text.length && text[i] !== "\n" && text[i] !== "\r") {
      row.push(field());
      if (text[i] === ",") i += 1;
    }
    if (text[i] === "\r") i += 1;
    if (text[i] === "\n") i += 1;
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
};

/** Reads raw-data/radicals/. Returns the sylhare CSV as objects keyed by header. */
export const readRadicalSources = (rawDir) => {
  const dir = path.join(rawDir, "radicals");
  const read = (name) => fs.readFileSync(path.join(dir, name), "utf8");
  const table = parseCsv(
    read("external/sylhare-radicals.csv").replace(/^﻿/, "")
  );
  const header = table[0];
  const sylhareRows = table
    .slice(1)
    .map((row) => Object.fromEntries(header.map((name, n) => [name, row[n]])));

  return {
    drawer: JSON.parse(read("external/rewhowe-drawer.json")),
    ours: JSON.parse(read("ours.json")),
    sylhareRows,
  };
};

// The seven bushu positions. The CSV sometimes lists a full name after a comma
// ("かまえ, もんがまえ") or junk ("罒"); keep only the first part, if known.
const POSITIONS = new Set([
  "へん",
  "つくり",
  "かんむり",
  "あし",
  "たれ",
  "にょう",
  "かまえ",
]);
const positionOf = (raw) => {
  const first = (raw ?? "").split(",")[0].trim();
  return POSITIONS.has(first) ? first : "";
};

/** { k, ja, pos?, cn? } — empty fields are left out. */
const entryOf = (literal, nameJa, positionJ, meaning) => {
  const entry = { k: literal, ja: nameJa };
  const pos = positionOf(positionJ);
  const cn = (meaning ?? "").trim();
  if (pos) entry.pos = pos;
  if (cn) entry.cn = cn;
  return entry;
};

/**
 * Bushu entries ({ k, ja, pos, cn }) per glyph, from the sylhare CSV plus our
 * translations and missing forms. Translations are keyed by glyph only —
 * never by reading, since readings collide (日 and 火 are both ひ).
 * Throws if a radical has no translation or a translation is unused.
 */
export const buildBushuEntries = ({ sylhareRows, ours }) => {
  const literals = ours.literalEn;
  const skipAsAlternate = new Set([
    ...Object.keys(ours.aliases ?? {}),
    ...(ours.sylhareSkipAlts ?? []),
  ]);

  const usedLiterals = new Set();
  const literalFor = (glyph) => {
    usedLiterals.add(glyph);
    return (literals[glyph] ?? "").toString().trim();
  };

  // Rows without a usable glyph (private-use codepoints, 々's "n/a") are
  // skipped: nothing in the app can show them.
  const named = sylhareRows
    .map((row) => {
      const readingJ = (row["Reading-J"] ?? "").trim();
      if (!readingJ || readingJ === "n/a") return null;
      if (!isGlyph(row.Radical)) return null;
      return { row, readingJ, literal: literalFor(row.Radical) };
    })
    .filter(Boolean);

  const missingLiterals = new Set(
    named.filter((n) => !n.literal).map((n) => n.row.Radical)
  );
  const radicalSeen = new Set(
    sylhareRows
      .map((row) => row.Radical)
      .filter((radical) => radical && [...radical].length === 1)
      .filter((radical) => !isPua(radical))
  );

  const out = {};
  const rowEntry = ({ row, readingJ, literal }) =>
    entryOf(literal, readingJ, row["Position-J"], row.Meaning);

  // Main glyphs first, so an alternate never shadows a real radical.
  for (const n of named) {
    if (!n.literal) continue;
    out[n.row.Radical] = rowEntry(n);
  }
  for (const n of named) {
    if (!n.literal) continue;
    for (const ch of [...(n.row.Alternate ?? "")].filter(isGlyph)) {
      if (radicalSeen.has(ch) || out[ch] != null) continue;
      if (skipAsAlternate.has(ch)) continue;
      out[ch] = rowEntry(n);
    }
  }

  for (const [ch, extra] of Object.entries(ours.extras ?? {})) {
    const literal = literalFor(ch);
    if (!literal) {
      missingLiterals.add(ch);
      continue;
    }
    out[ch] = entryOf(literal, extra.nameJa, extra.position, extra.meaning);
  }

  if (missingLiterals.size > 0) {
    throw new Error(
      `radicals: missing literalEn for ${[...missingLiterals].join(", ")}`
    );
  }
  const unused = Object.keys(literals).filter((g) => !usedLiterals.has(g));
  if (unused.length > 0) {
    throw new Error(`radicals: unused literalEn for ${unused.join(", ")}`);
  }
  return out;
};

/**
 * Merge Alternate → drawer-radical aliases from the sylhare CSV. Does not
 * overwrite existing aliases, drawer glyphs, or kanji (those already have
 * their own UI).
 */
export const mergeSylhareBushuAliases = ({
  sylhareRows,
  drawerRadicals,
  aliases,
  isKanji,
  skipAlts = [],
  extraAliases = {},
}) => {
  const skip = new Set(skipAlts);

  for (const row of sylhareRows) {
    const radical = row.Radical;
    const alts = [...(row.Alternate ?? "")].filter(isGlyph);
    const target = drawerRadicals.has(radical)
      ? radical
      : alts.find((ch) => drawerRadicals.has(ch));
    if (target == null) continue;

    for (const alt of alts) {
      if (alt === target) continue;
      if (skip.has(alt)) continue;
      if (drawerRadicals.has(alt)) continue;
      if (isKanji(alt)) continue;
      if (aliases[alt] != null) continue;
      aliases[alt] = target;
    }
  }

  for (const [from, to] of Object.entries(extraAliases)) {
    if (aliases[from] != null) continue;
    if (drawerRadicals.has(from) || isKanji(from)) continue;
    aliases[from] = to;
  }

  return aliases;
};
