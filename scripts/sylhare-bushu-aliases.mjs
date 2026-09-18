/**
 * Positional bushu forms (訁, 衤, ⺼, …) listed as Alternate in
 * sylhare/kanji-radicals.csv, mapped onto a drawer radical.
 *
 * Skip / extra maps live on raw-data/radicals.json
 * (`sylhareSkipAlts`, `sylhareExtraAliases`). They are not copied into
 * public/json/v2/radicals.json.
 */

export const isPua = (ch) => {
  const code = ch.codePointAt(0);
  return code >= 0xe000 && code <= 0xf8ff;
};

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

const isGlyph = (ch) =>
  typeof ch === "string" &&
  [...ch].length === 1 &&
  ch.trim().length > 0 &&
  !isPua(ch);

/**
 * Merge Alternate → drawer-radical aliases. Does not overwrite existing
 * aliases, drawer glyphs, or kanji (those already have their own UI).
 */
export const mergeSylhareBushuAliases = ({
  csvText,
  drawerRadicals,
  aliases,
  isKanji,
  skipAlts = [],
  extraAliases = {},
}) => {
  const skip = new Set(skipAlts);
  const table = parseCsv(csvText.replace(/^\uFEFF/, ""));
  const idx = Object.fromEntries(table[0].map((name, n) => [name, n]));

  for (const row of table.slice(1)) {
    const radical = row[idx.Radical];
    const alts = [...(row[idx.Alternate] ?? "")].filter(isGlyph);
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
