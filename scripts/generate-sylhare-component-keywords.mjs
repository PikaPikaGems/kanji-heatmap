/**
 * Builds raw-data/sylhare-component-keywords.json from
 * sylhare/kanji-radicals.csv + bushu-literal-en.json.
 *
 * Run via `pnpm run generate-json` (called first).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "raw-data");
const OUT = path.join(RAW, "sylhare-component-keywords.json");

const isPua = (ch) => {
  const code = ch.codePointAt(0);
  return code >= 0xe000 && code <= 0xf8ff;
};

const parseCsv = (text) => {
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
    )
      i += 1;
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

const literals = JSON.parse(
  fs.readFileSync(path.join(RAW, "bushu-literal-en.json"), "utf8")
);
const radicalsMeta = JSON.parse(
  fs.readFileSync(path.join(RAW, "radicals.json"), "utf8")
);
const skipAsAlternate = new Set([
  ...Object.keys(radicalsMeta.aliases ?? {}),
  ...(radicalsMeta.sylhareSkipAlts ?? []),
]);

const csvText = fs
  .readFileSync(path.join(RAW, "sylhare", "kanji-radicals.csv"), "utf8")
  .replace(/^\uFEFF/, "");
const table = parseCsv(csvText);
const header = table[0];
const idx = Object.fromEntries(header.map((name, n) => [name, n]));

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

const glyphsOf = (radical, alternate) => {
  const out = [];
  const push = (ch) => {
    if (!ch || ch.trim().length === 0) return;
    if ([...ch].length !== 1) return;
    if (isPua(ch)) return;
    out.push(ch);
  };
  push(radical);
  for (const ch of alternate ?? "") push(ch);
  return out;
};

const out = {};
const missingLiterals = new Set();
const radicalSeen = new Set();

for (const row of table.slice(1)) {
  const radical = row[idx["Radical"]];
  if (radical && [...radical].length === 1 && !isPua(radical)) {
    radicalSeen.add(radical);
  }
}

const literalFor = (glyph, readingJ) => {
  const fromGlyph = glyph ? literals[glyph] : undefined;
  const fromReading = literals[readingJ];
  return (fromGlyph ?? fromReading ?? "").toString().trim();
};

for (const row of table.slice(1)) {
  const readingJ = (row[idx["Reading-J"]] ?? "").trim();
  if (!readingJ || readingJ === "n/a") continue;
  const radical = row[idx["Radical"]];
  const literal = literalFor(radical, readingJ);
  if (!literal) {
    missingLiterals.add(readingJ);
    continue;
  }
  const desc = composeDesc(
    readingJ,
    literal,
    row[idx["Position-J"]],
    row[idx["Meaning"]]
  );
  const entry = { k: literal, desc };
  for (const ch of glyphsOf(radical, "")) {
    out[ch] = entry;
  }
}

for (const row of table.slice(1)) {
  const readingJ = (row[idx["Reading-J"]] ?? "").trim();
  if (!readingJ || readingJ === "n/a") continue;
  const radical = row[idx["Radical"]];
  const literal = literalFor(radical, readingJ);
  if (!literal) continue;
  const desc = composeDesc(
    readingJ,
    literal,
    row[idx["Position-J"]],
    row[idx["Meaning"]]
  );
  const entry = { k: literal, desc };
  for (const ch of glyphsOf("", row[idx["Alternate"]])) {
    if (radicalSeen.has(ch) || out[ch] != null) continue;
    if (skipAsAlternate.has(ch)) continue;
    out[ch] = entry;
  }
}

const extras = [
  ["𠂉", "のいち", "", ""],
  ["マ", "ま", "", "Katakana Ma"],
  ["ユ", "ゆ", "", "Katakana Yu"],
  ["丷", "はちがしら", "", "eight"],
  ["｜", "たてぼう", "", "line, stick"],
  ["ノ", "の", "", "bend, stroke"],
  ["ヨ", "けいがしら", "", "pig's head"],
  ["⺩", "おうへん", "へん", "jewelry, jeweled king"],
];

for (const [ch, readingJ, positionJ, meaning] of extras) {
  const literal = literalFor(ch, readingJ);
  if (!literal) {
    missingLiterals.add(readingJ);
    continue;
  }
  out[ch] = {
    k: literal,
    desc: composeDesc(readingJ, literal, positionJ, meaning),
  };
}

if (missingLiterals.size > 0) {
  console.error(
    "generate-sylhare-component-keywords: missing literals for",
    [...missingLiterals].join(", ")
  );
  process.exit(1);
}

fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
console.log(
  `Wrote ${path.relative(ROOT, OUT)} (${Object.keys(out).length} glyphs)`
);
