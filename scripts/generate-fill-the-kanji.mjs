/**
 * Generates the sentence lists used by the /fill-the-kanji game.
 *
 * Source → Outputs:
 *   raw-data/fill-the-kanji/<set>-<count>.tsv
 *     → public/json/fill-the-kanji/<set>/<chunk>.json   (chunk = 0, 1, …)
 *
 * Each set is split into chunk files of `roundsPerChunk` rounds of
 * `roundSize` rows (src/lib/fill-the-kanji/chunking.json, shared with the
 * app), so playing a round downloads one chunk, not the whole set. The last
 * chunk also takes the leftover rows, matching the last round. The trailing
 * "-<count>" in the source
 * file name is dropped, so the set id stays stable when rows are added. The
 * app cuts each set into rounds of 20 in file order, so reordering or
 * inserting rows in the middle of a TSV shifts which sentences belong to which
 * round (and therefore which heatmap cell). Appending rows at the end is safe.
 *
 * Two source layouts are supported, told apart by the header row:
 *   jpSentence, enTranslation, tags, notes   (sentence sets)
 *   Emoji, Expression, Meaning, Notes        (emoji set)
 *
 * Each output file has the shape:
 *   { data: [jp, en, tags, notes][] }          (sentence sets)
 *   { data: [jp, en, tags, notes, emoji][] }   (emoji set, tags is "")
 * where jp uses the Anki furigana format, e.g. "電車[でんしゃ]で 行[い]く".
 *
 * Rows with no kanji or with unbalanced brackets are skipped with a warning,
 * since there would be nothing (or nothing reliable) to fill in.
 *
 * It also writes src/lib/fill-the-kanji/set-sizes.json ({ <set>: rowCount }),
 * which is committed: the dashboard and start screen need each set's round
 * count without downloading the set itself. And it writes
 * src/lib/fill-the-kanji/set-chunks.json
 *   ({ <set>: { version, chunks: [contentHash, …] } }):
 * the app loads each chunk as <set>/<chunk>.json?v=<hash>, so the PWA can
 * cache chunks forever and still fetch one again as soon as it changes.
 * `version` (a hash of the chunk hashes) marks a set as downloaded.
 *
 * The TSVs are not committed (gitignored); the generated JSON is. A developer
 * who has the TSVs drops them into raw-data/fill-the-kanji/ and runs this, then
 * commits the regenerated output. It is not part of `pnpm build`.
 *
 * Usage: pnpm run generate-fill-the-kanji
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  readdirSync,
} from "fs";
import { createHash } from "crypto";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const srcDir = resolve(root, "raw-data/fill-the-kanji");
const outDir = resolve(root, "public/json/fill-the-kanji");
const sizesFile = resolve(root, "src/lib/fill-the-kanji/set-sizes.json");
const chunksFile = resolve(root, "src/lib/fill-the-kanji/set-chunks.json");
const { roundSize, roundsPerChunk } = JSON.parse(
  readFileSync(resolve(root, "src/lib/fill-the-kanji/chunking.json"), "utf-8")
);

const hashOf = (text) =>
  createHash("sha256").update(text).digest("hex").slice(0, 8);

/** Splits rows into chunks of whole rounds; the last chunk keeps leftovers. */
const toChunks = (rows) => {
  const rounds = Math.max(1, Math.floor(rows.length / roundSize));
  const chunkCount = Math.ceil(rounds / roundsPerChunk);
  const rowsPerChunk = roundsPerChunk * roundSize;
  return Array.from({ length: chunkCount }, (_, c) =>
    rows.slice(
      c * rowsPerChunk,
      c === chunkCount - 1 ? rows.length : (c + 1) * rowsPerChunk
    )
  );
};

const SENTENCE_HEADER = ["jpSentence", "enTranslation", "tags", "notes"];
const EMOJI_HEADER = ["Emoji", "Expression", "Meaning", "Notes"];

// Kanji in the base text only — readings inside [...] are kana anyway.
const KANJI = /[㐀-䶿一-鿿]/;
const stripReadings = (jp) => jp.replace(/\[[^\]]*\]/g, "");
const hasBalancedBrackets = (jp) => /^[^[\]]*(\[[^[\]]*\][^[\]]*)*$/.test(jp);

const sameHeader = (a, b) =>
  a.length >= b.length && b.every((col, i) => a[i].trim() === col);

const files = existsSync(srcDir)
  ? readdirSync(srcDir)
      .filter((f) => f.endsWith(".tsv"))
      .sort()
  : [];

// Check before deleting anything: without the TSVs, wiping outDir would
// throw away the committed JSON.
if (files.length === 0) {
  console.error(
    "fill-the-kanji: no .tsv files in raw-data/fill-the-kanji/. They aren't " +
      "committed; get them from the maintainer (see README). The committed " +
      "public/json/fill-the-kanji/ files were left unchanged."
  );
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const sizes = {};
const setChunks = {};

for (const file of files) {
  const setId = file.replace(/(-\d+)?\.tsv$/, "");
  const lines = readFileSync(resolve(srcDir, file), "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  const header = lines[0].split("\t");
  const isEmoji = sameHeader(header, EMOJI_HEADER);
  if (!isEmoji && !sameHeader(header, SENTENCE_HEADER)) {
    throw new Error(`${file}: unexpected header ${JSON.stringify(header)}`);
  }

  const data = [];
  const skipped = [];
  lines.slice(1).forEach((line, i) => {
    const cols = line.split("\t").map((c) => (c ?? "").trim());
    const row = isEmoji
      ? [cols[1] ?? "", cols[2] ?? "", "", cols[3] ?? "", cols[0] ?? ""]
      : [cols[0] ?? "", cols[1] ?? "", cols[2] ?? "", cols[3] ?? ""];
    const jp = row[0];
    // +2: one for the header row, one for 1-based line numbers.
    const lineNo = i + 2;
    if (!hasBalancedBrackets(jp)) {
      skipped.push(`  line ${lineNo}: unbalanced brackets: ${jp}`);
    } else if (!KANJI.test(stripReadings(jp))) {
      skipped.push(`  line ${lineNo}: no kanji: ${jp}`);
    } else {
      data.push(row);
    }
  });

  const setDir = resolve(outDir, setId);
  mkdirSync(setDir, { recursive: true });
  const hashes = toChunks(data).map((rows, c) => {
    const json = JSON.stringify({ data: rows });
    writeFileSync(resolve(setDir, `${c}.json`), json, "utf-8");
    return hashOf(json);
  });

  sizes[setId] = data.length;
  setChunks[setId] = { version: hashOf(hashes.join(",")), chunks: hashes };
  console.log(
    `fill-the-kanji: ${file} → ${setId}/ (${data.length} rows, ${hashes.length} chunks)`
  );
  if (skipped.length > 0) {
    console.warn(`  skipped ${skipped.length} row(s):\n${skipped.join("\n")}`);
  }
}

writeFileSync(sizesFile, JSON.stringify(sizes, null, 2) + "\n", "utf-8");
writeFileSync(chunksFile, JSON.stringify(setChunks, null, 2) + "\n", "utf-8");
