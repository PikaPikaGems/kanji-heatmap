/**
 * Finds sentences that appear more than once across the Fill the Kanji sets,
 * so the dashboard can count "unique sentences read" without loading the sets.
 *
 * public/json/fill-the-kanji/<set>/<chunk>.json
 *   → src/lib/fill-the-kanji/duplicate-sentences.json
 *
 * Run it after `pnpm run generate-fill-the-kanji` (row numbers change when a
 * set's rows are reordered). Sentences match on their text without furigana
 * or spaces. Each group lists the "<setId>:<0-based row>" of every copy.
 *
 * Usage: pnpm run generate-fill-the-kanji-duplicates
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "public/json/fill-the-kanji");
const outFile = resolve(
  root,
  "src/lib/fill-the-kanji/duplicate-sentences.json"
);

const plainText = (jp) => jp.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, "");

const copies = new Map();
const setIds = readdirSync(dataDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const setId of setIds) {
  const chunkFiles = readdirSync(resolve(dataDir, setId))
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  let row = 0;
  for (const file of chunkFiles) {
    const { data } = JSON.parse(
      readFileSync(resolve(dataDir, setId, file), "utf-8")
    );
    for (const [jp] of data) {
      const key = plainText(jp);
      if (!copies.has(key)) copies.set(key, []);
      copies.get(key).push(`${setId}:${row++}`);
    }
  }
}

const groups = [...copies.values()].filter((g) => g.length > 1);
writeFileSync(outFile, JSON.stringify(groups) + "\n", "utf-8");
console.log(
  `fill-the-kanji: ${groups.length} duplicated sentences → ${outFile}`
);
