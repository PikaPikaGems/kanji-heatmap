/**
 * Everything radical-related that the build derives from raw-data/radicals/.
 *
 *   external/sylhare-radicals.csv  ─┐
 *   ours.json                       ├─▶ buildRadicalData → { aliases, keywords, info, families }
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

/** Popover facts { ja, pos?, cn? } — empty fields are left out. */
const infoOf = ({ ja, position, meaning }) => {
  const info = { ja };
  const pos = positionOf(position);
  const cn = (meaning ?? "").trim();
  if (pos) info.pos = pos;
  if (cn) info.cn = cn;
  return info;
};

/**
 * Every radical fact the app needs, from the sylhare CSV, the rewhowe drawer
 * and ours.json:
 *
 * - `aliases`: glyph → the glyph to read from, or to search with (氵 → ⺡).
 * - `keywords`: English name per glyph (`literalEn`).
 * - `info`: radical popover facts { ja, pos?, cn? } per glyph.
 *
 * A glyph shows its own name and info if it has them, and otherwise the app
 * follows its alias, so each fact is stored once:
 *
 * - A named glyph (a CSV row, an `extras` entry, or an alternate form with no
 *   alias of its own) needs a `literalEn` entry, unless it has an alias to
 *   read through. ⺤ "claw crown" has both: its own name, and an alias to 爪
 *   for radical search.
 * - A kanji shows its kanji keyword, so it never has a `literalEn` entry.
 *   Its info is always kept: kanji radicals open the radical popover too.
 *
 * Throws on a missing, misplaced or unused `literalEn` entry.
 */
export const buildRadicalData = ({
  sylhareRows,
  ours,
  drawer,
  isKanji,
  isUsed,
}) => {
  const drawerRadicals = new Set(Object.values(drawer).flat());
  const mergedAliases = { ...(ours.aliases ?? {}) };
  mergeSylhareAliases({
    sylhareRows,
    drawerRadicals,
    aliases: mergedAliases,
    isKanji,
    skipAlts: ours.sylhareSkipAlts,
    extraAliases: ours.sylhareExtraAliases,
  });
  // Glyphs the app never shows (⿊, 靣) are dropped: an alias stays only if
  // a shown glyph's alias chain passes through it.
  const aliases = pruneAliases(mergedAliases, isUsed);
  const skipAlts = new Set(ours.sylhareSkipAlts ?? []);

  // Rows without a usable glyph (private-use codepoints, 々's "n/a") are
  // skipped: nothing in the app can show them. Extras win over CSV rows.
  const named = new Map();
  const rows = sylhareRows
    .map((row) => ({
      glyph: row.Radical,
      ja: (row["Reading-J"] ?? "").trim(),
      position: row["Position-J"],
      meaning: row.Meaning,
      alternates: [...(row.Alternate ?? "")].filter(isGlyph),
    }))
    .filter((row) => isGlyph(row.glyph) && row.ja && row.ja !== "n/a")
    // A skipped glyph is not this radical at all, not even as its own row
    // (玊 is a variant of 玉 that the CSV files under 王).
    .filter((row) => !skipAlts.has(row.glyph));
  for (const row of rows) named.set(row.glyph, row);
  // An alternate form with no alias has nowhere else to read from, so it is
  // named in its own right, with its row's facts (ハ under 八 is the drawer's
  // own button). Rows come first, so an alternate never shadows a radical.
  for (const row of rows) {
    for (const alt of row.alternates) {
      if (named.has(alt) || skipAlts.has(alt) || aliases[alt] != null) continue;
      named.set(alt, { ...row, glyph: alt });
    }
  }
  for (const [glyph, extra] of Object.entries(ours.extras ?? {})) {
    named.set(glyph, {
      glyph,
      ja: extra.nameJa,
      position: extra.position,
      meaning: extra.meaning,
    });
  }

  const literals = ours.literalEn ?? {};
  const keywords = {};
  const info = {};
  const problems = [];
  for (const [glyph, entry] of named) {
    // A glyph the app never shows (⺝) keeps only its name, as a row in its
    // family's forms; see buildFamilies.
    if (!isUsed(glyph)) {
      if (literals[glyph] != null) {
        problems.push(`${glyph} is never shown; remove its literalEn`);
      }
      continue;
    }
    const literal = (literals[glyph] ?? "").toString().trim();
    if (isKanji(glyph)) {
      if (literal) problems.push(`${glyph} is a kanji; remove its literalEn`);
      // Every radical opens the radical popover, kanji too (夕), so a kanji
      // keeps its Japanese name, position and meaning.
      info[glyph] = infoOf(entry);
      continue;
    }
    if (!literal) {
      if (aliases[glyph] == null) {
        problems.push(`${glyph} (${entry.ja}) needs a literalEn or an alias`);
      }
      continue;
    }
    keywords[glyph] = literal;
    info[glyph] = infoOf(entry);
  }
  for (const glyph of Object.keys(literals)) {
    if (!named.has(glyph)) problems.push(`unused literalEn for ${glyph}`);
  }
  const families = buildFamilies({
    sylhareRows,
    ours,
    aliases,
    skipAlts,
    info,
    drawerRadicals,
    problems,
  });
  if (problems.length > 0) {
    throw new Error(`radicals:\n  - ${problems.join("\n  - ")}`);
  }
  return { aliases, keywords, info, families };
};

/** Keeps the aliases of shown glyphs, and every alias on their chains. */
const pruneAliases = (aliases, isUsed) => {
  const keep = new Set();
  for (const from of Object.keys(aliases)) {
    if (!isUsed(from)) continue;
    const seen = new Set();
    let current = from;
    while (aliases[current] != null && !seen.has(current)) {
      seen.add(current);
      keep.add(current);
      current = aliases[current];
    }
  }
  return Object.fromEntries(
    Object.entries(aliases).filter(([from]) => keep.has(from))
  );
};

/**
 * The forms of each radical, from the sylhare CSV's Alternate column:
 * head glyph → [head, ...forms]. A form is either
 *
 * - a glyph with its own radical info, or a drawer glyph (⺡ under 水), or
 * - a name-only row `{ ja, pos? }` for a form that has a CSV row but no
 *   glyph the app can show: a private-use codepoint (きへん under 木) or a
 *   glyph that appears in no kanji (つきへん, ⺝, under 月).
 *
 * Alternates without a name of their own (氵, a second codepoint for ⺡)
 * are the same shape as another form and are left out, as are repeats of a
 * name already in the family. Families are only linked forms: each form
 * keeps its own text. ours.json's `familySkips` keeps a glyph out of every
 * family but its own (𠆢 is listed under both 人 and 入), and `familyHeads`
 * picks the head when it isn't the CSV's Radical column.
 */
const buildFamilies = ({
  sylhareRows,
  ours,
  aliases,
  skipAlts,
  info,
  drawerRadicals,
  problems,
}) => {
  const familySkips = ours.familySkips ?? {};
  const familyHeads = ours.familyHeads ?? {};
  const rowOf = new Map();
  for (const row of sylhareRows) {
    const ja = (row["Reading-J"] ?? "").trim();
    if (ja && ja !== "n/a" && !rowOf.has(row.Radical))
      rowOf.set(row.Radical, row);
  }
  const isForm = (glyph) => glyph in info || drawerRadicals.has(glyph);
  const nameOf = (glyph) =>
    info[glyph]?.ja ?? (rowOf.get(glyph)?.["Reading-J"] ?? "").trim();

  const families = new Map();
  for (const row of sylhareRows) {
    const alternates = [...(row.Alternate ?? "")].filter(
      (ch) => ch.trim().length > 0
    );
    if (alternates.length === 0 || skipAlts.has(row.Radical)) continue;
    const head = familyHeads[row.Radical] ?? row.Radical;
    const members = families.get(head) ?? [head];
    for (const glyph of [row.Radical, ...alternates]) {
      if (glyph === head || skipAlts.has(glyph)) continue;
      if (glyph !== row.Radical && familySkips[glyph] != null) continue;
      if (isForm(glyph)) {
        members.push(glyph);
      } else if (rowOf.has(glyph)) {
        const pos = positionOf(rowOf.get(glyph)["Position-J"]);
        members.push({ ja: nameOf(glyph), ...(pos ? { pos } : {}) });
      } else if (isForm(aliases[glyph]) && aliases[glyph] !== head) {
        // A second code for another form (忄 for the drawer's ⺖).
        members.push(aliases[glyph]);
      }
    }
    families.set(head, members);
  }
  // A named glyph whose alias leads into a family is one of its forms too,
  // even when the CSV doesn't list it there (丷 はちがしら → ハ, under 八).
  const memberOf = new Map();
  for (const [head, members] of families) {
    for (const member of members) {
      if (typeof member === "string") memberOf.set(member, head);
    }
  }
  for (const glyph of Object.keys(info)) {
    if (memberOf.has(glyph) || familySkips[glyph] != null) continue;
    const seen = new Set();
    let current = aliases[glyph];
    while (current != null && !seen.has(current) && !memberOf.has(current)) {
      seen.add(current);
      current = aliases[current];
    }
    if (current != null && memberOf.has(current)) {
      families.get(memberOf.get(current)).push(glyph);
      memberOf.set(glyph, memberOf.get(current));
    }
  }

  const out = {};
  const familyOf = new Map();
  for (const [head, members] of families) {
    const keyOf = (member) =>
      typeof member === "string"
        ? `${nameOf(member)}|${info[member]?.pos ?? ""}`
        : `${member.ja}|${member.pos ?? ""}`;
    // A name-only row is dropped when a glyph form has the same name (⺤
    // つめかんむり), so check the glyphs first.
    const glyphKeys = new Set(
      members.filter((member) => typeof member === "string").map(keyOf)
    );
    const names = new Set();
    const kept = [];
    for (const member of members) {
      if (typeof member === "string") {
        if (!kept.includes(member)) kept.push(member);
        continue;
      }
      const key = keyOf(member);
      if (glyphKeys.has(key) || names.has(key)) continue;
      names.add(key);
      kept.push(member);
    }
    if (kept.length < 2) continue;
    for (const member of kept) {
      if (typeof member !== "string") continue;
      if (familyOf.has(member)) {
        problems.push(
          `${member} is in the families of both ${familyOf.get(member)} and ${head}; add it to familySkips`
        );
      }
      familyOf.set(member, head);
    }
    out[head] = kept;
  }
  for (const glyph of [
    ...Object.keys(familySkips),
    ...Object.keys(familyHeads),
  ]) {
    if (
      !rowOf.has(glyph) &&
      !sylhareRows.some((row) => row.Alternate?.includes(glyph))
    ) {
      problems.push(`familySkips/familyHeads: ${glyph} is not in the CSV`);
    }
  }
  return out;
};

/**
 * Merge Alternate → drawer-radical aliases from the sylhare CSV. Does not
 * overwrite existing aliases, drawer glyphs, or kanji (those already have
 * their own UI).
 */
const mergeSylhareAliases = ({
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
