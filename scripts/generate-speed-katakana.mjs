/**
 * Generates the katakana word lists used by the /speed-katakana typing game.
 *
 * Source → Outputs:
 *   raw-data/katakana-kore.txt → public/json/katakana/challenge-set-<N>.json
 *
 * The source is tab-separated (katakana, english gloss, frequency rank) and is
 * already sorted by frequency. It is split into challenge sets of WORDS_PER_SET
 * words each (set 1 = most common words ... higher sets = rarer words). Each
 * output file has the shape: { data: [katakana, englishGloss][] }.
 *
 * Usage: node scripts/generate-speed-katakana.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const WORDS_PER_SET = 48;

const raw = readFileSync(resolve(root, "raw-data/katakana-kore.txt"), "utf-8");

const words = [];
for (const line of raw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [katakana, english] = trimmed.split("\t");
  if (!katakana || !english) continue;
  words.push([katakana.trim(), english.trim()]);
}

const outDir = resolve(root, "public/json/katakana");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Only emit full sets so every challenge set has exactly WORDS_PER_SET words.
const numSets = Math.floor(words.length / WORDS_PER_SET);
for (let i = 0; i < numSets; i++) {
  const data = words.slice(i * WORDS_PER_SET, (i + 1) * WORDS_PER_SET);
  writeFileSync(
    resolve(outDir, `challenge-set-${i + 1}.json`),
    JSON.stringify({ data }),
    "utf-8"
  );
}

console.log(
  `katakana: ${words.length} words → ${numSets} challenge sets of ${WORDS_PER_SET}`
);
