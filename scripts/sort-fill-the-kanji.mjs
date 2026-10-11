/**
 * Reorders the Fill the Kanji TSVs from easiest to hardest, rewriting each in
 * place. Rounds are cut in file order, so this decides which sentences come in
 * early rounds and which come later.
 *
 *   raw-data/fill-the-kanji/<set>-<count>.tsv (rewritten in place)
 *   raw-data/fill-the-kanji/ours.json         `keepFileOrder`: set ids left
 *                                             as they are (e.g. "beginner-1")
 *
 * Each row is ranked by the kanji in its sentence (or the emoji set's
 * expression), readings ignored, always by its hardest kanji:
 *   1. JLPT level: N5, N4, N3, N2, N1, then not in JLPT. A row with both an N5
 *      and an N1 kanji counts as N1, so it comes later.
 *   2. Jouyou grade: 1–6, then 9 (secondary school), then not in Jouyou.
 *   3. Number of distinct kanji, fewer first: the game blanks each one, so
 *      this is how many tiles the player has to place.
 *   4. Length (characters, without furigana or spaces), shorter first.
 *   5. Google frequency rank (higher rank number = rarer = later). Kanji with
 *      no Google rank count as rarest.
 *   6. Ties keep their current order (stable sort), so rerunning is a no-op.
 *
 * Reads JLPT, grade and Google rank from public/json/v2/kanji_main.json (see
 * MainKanjiInfoItemType in src/lib/kanji/kanji-worker-types.ts).
 *
 * Changing the order moves sentences between rounds, so players' stats for a
 * round no longer match the sentences in it. Run it before release, not after.
 *
 * Usage: pnpm run sort-fill-the-kanji && pnpm run generate-fill-the-kanji
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const srcDir = resolve(root, "raw-data/fill-the-kanji");
const oursFile = resolve(srcDir, "ours.json");
if (!existsSync(oursFile)) {
  console.error(
    "sort-fill-the-kanji: raw-data/fill-the-kanji/ours.json is missing. It " +
      "isn't committed; copy it from jp-misc-data (DATA/final-sentences/ours.json) " +
      "or get it from the maintainer (see README)."
  );
  process.exit(1);
}
const { keepFileOrder = [] } = JSON.parse(readFileSync(oursFile, "utf-8"));
const kanjiMain = JSON.parse(
  readFileSync(resolve(root, "public/json/v2/kanji_main.json"), "utf-8")
);

// MainKanjiInfoItemType: [keyword, on, kun, jlptRaw, freq, strokes,
// jouyouGrade, ...]. jlptRaw is 5 (N5) … 1 (N1), -1 when not in JLPT.
// jouyouGrade is 1–6 or 9 (secondary school), -1 when not Jouyou. freq[2] is
// rank_google, 0 or less when missing.
const JLPT_INDEX = 3;
const FREQ_INDEX = 4;
const GRADE_INDEX = 6;
const GOOGLE_INDEX = 2;

const LEVEL_NAMES = ["N5", "N4", "N3", "N2", "N1", "None"];
const NOT_IN_JLPT = LEVEL_NAMES.length - 1;
const NOT_JOUYOU = 10;

/** 0 = N5 (easiest) … 4 = N1, 5 = not in JLPT or unknown kanji. */
const levelOf = (kanji) => {
  const raw = kanjiMain[kanji]?.[JLPT_INDEX];
  return raw >= 1 && raw <= 5 ? 5 - raw : NOT_IN_JLPT;
};

/** 1–6, 9, then NOT_JOUYOU for -1 or unknown kanji. */
const gradeOf = (kanji) => {
  const grade = kanjiMain[kanji]?.[GRADE_INDEX];
  return grade > 0 ? grade : NOT_JOUYOU;
};

const googleRankOf = (kanji) => {
  const rank = kanjiMain[kanji]?.[FREQ_INDEX]?.[GOOGLE_INDEX];
  return rank > 0 ? rank : Infinity;
};

const KANJI = /[㐀-䶿一-鿿]/g;
const kanjiIn = (jp) => jp.replace(/\[[^\]]*\]/g, "").match(KANJI) ?? [];
const hardest = (kanji, keyOf) => Math.max(0, ...kanji.map(keyOf));
const visibleLength = (jp) =>
  jp.replace(/\[[^\]]*\]/g, "").replace(/\s/g, "").length;

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".tsv"))
  .sort();

for (const file of files) {
  const setId = file.replace(/(-\d+)?\.tsv$/, "");
  if (keepFileOrder.includes(setId)) {
    console.log(`sort: ${file}: kept in file order (ours.json)`);
    continue;
  }

  const path = resolve(srcDir, file);
  const [header, ...lines] = readFileSync(path, "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  // The emoji set keeps its sentence in the 2nd column (Emoji, Expression, …).
  const jpColumn = header.startsWith("Emoji\t") ? 1 : 0;

  const rows = lines.map((line, index) => {
    const jp = line.split("\t")[jpColumn] ?? "";
    const kanji = kanjiIn(jp);
    return {
      line,
      index,
      level: hardest(kanji, levelOf),
      grade: hardest(kanji, gradeOf),
      rank: hardest(kanji, googleRankOf),
      kanjiCount: new Set(kanji).size,
      length: visibleLength(jp),
    };
  });

  rows.sort(
    (a, b) =>
      a.level - b.level ||
      a.grade - b.grade ||
      a.kanjiCount - b.kanjiCount ||
      a.length - b.length ||
      a.rank - b.rank ||
      a.index - b.index
  );

  writeFileSync(path, [header, ...rows.map((r) => r.line)].join("\n") + "\n");

  const counts = LEVEL_NAMES.map(
    (name, level) => `${name} ${rows.filter((r) => r.level === level).length}`
  );
  const moved = rows.filter((r, i) => r.index !== i).length;
  console.log(
    `sort: ${file}: ${rows.length} rows (${counts.join(", ")}), ${moved} moved`
  );
}
