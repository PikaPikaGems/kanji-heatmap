/**
 * Downloads stroke-order SVGs for the ~2426 kanji in
 * raw-data/filtered_kanji.json and writes them to public/svg/, so the
 * app can serve them same-origin instead of hitting assets.pikapikagems.com
 * for every kanji drawer view. Kanji outside this set (e.g. 唸) still
 * lazy-load from the CDN at runtime — see src/lib/kanji-svg-url.ts.
 *
 * This has to be run from a machine with network access to the chosen
 * source; it isn't run as part of `pnpm run build`.
 *
 * Usage:
 *   node scripts/download-kanji-svgs.mjs [--source=tagaini|pikapikagems] [--force]
 *
 *   --source   Which CDN to pull from (default: tagaini, the canonical
 *              KanjiVG source — see src/lib/assets-paths.ts).
 *   --force    Re-download files that already exist locally.
 */

import { existsSync, mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SOURCES = {
  tagaini: "https://kanjivg.tagaini.net/kanjivg/kanji/",
  pikapikagems: "", // add your cloudfare bucket url here,
};

const args = process.argv.slice(2);
const sourceArg = args
  .find((a) => a.startsWith("--source="))
  ?.slice("--source=".length);
const force = args.includes("--force");

if (sourceArg && !(sourceArg in SOURCES)) {
  console.error(
    `Unknown --source "${sourceArg}". Valid: ${Object.keys(SOURCES).join(", ")}`
  );
  process.exit(1);
}
const baseUrl = SOURCES[sourceArg ?? "tagaini"];

const CONCURRENCY = 8;
const MAX_RETRIES = 3;

/** Same convention as src/lib/kanji-svg-url.ts's kanjiSvgCode. */
function kanjiSvgCode(kanji) {
  const char = [...kanji][0] ?? kanji;
  return `00000${char.charCodeAt(0).toString(16)}`.slice(-5);
}

const kanjiList = JSON.parse(
  readFileSync(resolve(root, "raw-data/filtered_kanji.json"), "utf-8")
);

const outDir = resolve(root, "public/svg");
mkdirSync(outDir, { recursive: true });

async function downloadOne(kanji) {
  const code = kanjiSvgCode(kanji);
  const dest = resolve(outDir, `${code}.svg`);

  if (!force && existsSync(dest)) return { kanji, code, status: "skipped" };

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${code}.svg`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      // KanjiVG roots look like id="kvg:05c71" — reject empty / wrong payloads.
      if (!body.includes(`kvg:${code}`)) {
        throw new Error("response body missing expected kvg: root");
      }
      await writeFile(dest, body, "utf-8");
      return { kanji, code, status: "ok" };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  return { kanji, code, status: "failed", error: String(lastError) };
}

async function runPool(items, worker) {
  const results = [];
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
      if (results.filter(Boolean).length % 200 === 0) {
        console.log(`  ${results.filter(Boolean).length}/${items.length}...`);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, run)
  );
  return results;
}

console.log(
  `Downloading ${kanjiList.length} kanji SVGs from ${baseUrl} into ${outDir}${force ? " (--force)" : ""}...`
);

const results = await runPool(kanjiList, downloadOne);

const ok = results.filter((r) => r.status === "ok").length;
const skipped = results.filter((r) => r.status === "skipped").length;
const failed = results.filter((r) => r.status === "failed");

console.log(
  `\nDone: ${ok} downloaded, ${skipped} already present, ${failed.length} failed.`
);

if (failed.length > 0) {
  console.log("\nFailed:");
  for (const f of failed) {
    console.log(`  ${f.kanji} (${f.code}.svg): ${f.error}`);
  }
  console.log(
    "\nRe-run this script to retry — already-downloaded files are skipped."
  );
  process.exitCode = 1;
}
