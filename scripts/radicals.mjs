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

const firstPos = (raw) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return trimmed.split(",")[0].trim();
};

const composeDesc = (readingJ, literal, positionJ, meaning) => {
  const inner = [literal, firstPos(positionJ)].filter(
    (part) => part.length > 0
  );
  const head = `${readingJ} (${inner.join(", ")})`;
  const kx = (meaning ?? "").trim();
  return kx.length > 0 ? `${head} · ${kx}` : head;
};

/**
 * Bushu name entries ({ k, desc }) per glyph, from the sylhare CSV plus our
 * translations and missing forms. Throws if a name has no translation.
 */
export const buildBushuEntries = ({ sylhareRows, ours }) => {
  const literals = ours.literalEn;
  const skipAsAlternate = new Set([
    ...Object.keys(ours.aliases ?? {}),
    ...(ours.sylhareSkipAlts ?? []),
  ]);

  const literalFor = (glyph, readingJ) => {
    const fromGlyph = glyph ? literals[glyph] : undefined;
    const fromReading = literals[readingJ];
    return (fromGlyph ?? fromReading ?? "").toString().trim();
  };

  const named = sylhareRows
    .map((row) => {
      const readingJ = (row["Reading-J"] ?? "").trim();
      if (!readingJ || readingJ === "n/a") return null;
      const literal = literalFor(row.Radical, readingJ);
      return { row, readingJ, literal };
    })
    .filter(Boolean);

  const missingLiterals = new Set(
    named.filter((n) => !n.literal).map((n) => n.readingJ)
  );
  const radicalSeen = new Set(
    sylhareRows
      .map((row) => row.Radical)
      .filter((radical) => radical && [...radical].length === 1)
      .filter((radical) => !isPua(radical))
  );

  const out = {};
  const entryOf = ({ row, readingJ, literal }) => ({
    k: literal,
    desc: composeDesc(readingJ, literal, row["Position-J"], row.Meaning),
  });

  // Main glyphs first, so an alternate never shadows a real radical.
  for (const n of named) {
    if (!n.literal || !isGlyph(n.row.Radical)) continue;
    out[n.row.Radical] = entryOf(n);
  }
  for (const n of named) {
    if (!n.literal) continue;
    for (const ch of [...(n.row.Alternate ?? "")].filter(isGlyph)) {
      if (radicalSeen.has(ch) || out[ch] != null) continue;
      if (skipAsAlternate.has(ch)) continue;
      out[ch] = entryOf(n);
    }
  }

  for (const [ch, extra] of Object.entries(ours.extras ?? {})) {
    const literal = literalFor(ch, extra.nameJa);
    if (!literal) {
      missingLiterals.add(extra.nameJa);
      continue;
    }
    out[ch] = {
      k: literal,
      desc: composeDesc(extra.nameJa, literal, extra.position, extra.meaning),
    };
  }

  if (missingLiterals.size > 0) {
    throw new Error(
      `radicals: missing literalEn for ${[...missingLiterals].join(", ")}`
    );
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
