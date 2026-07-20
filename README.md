# Kanji Heatmap (previously Kanji Companion)

![main page](./docs/images/preview.png)

| ![kanji details](./docs/images/kanji-details.png) | ![mobile screen](./docs/images/kanji-expanded.png) |
| :-----------------------------------------------: | :------------------------------------------------: |

![sort and filter dialog](./docs/images/sort-dialog.png)

## Development

```bash
nvm use 22
pnpm install
pnpm run dev
```

> **Note:** When using `pnpm run dev`, features that require Cloudflare Functions — such as Jisho, Jotoba, and the Google Handwriting API — will not work. All other features work normally.

### Running locally with Cloudflare Functions

API proxy requests through a [Cloudflare Pages Function](./functions/api/) to work around CORS restrictions. To run them locally you need [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
# Terminal 1
pnpm run dev

# Terminal 2
pnpm run dev:cf
```

Then open `http://localhost:5173` (Wrangler's port, not Vite's).

> **Note:** If you ever see a port bump to 5175, a stale Vite process is still holding 5174. Clear it with `lsof -ti:5174,5173 | xargs kill` and restart both.

## Testing

### Unit / component tests

```bash
pnpm test
```

### End-to-end tests (Playwright)

`pnpm install` installs the Playwright npm package, but **not** the browser binaries. Download Chromium once (and again after Playwright upgrades):

```bash
pnpm exec playwright install chromium
pnpm test:e2e

# Watching the test
pnpm exec playwright test --headed
pnpm exec playwright test --debug
pnpm exec playwright test --ui
```

If e2e fails with `browserType.launch: Executable doesn't exist` (often pointing at `~/Library/Caches/ms-playwright/chromium_headless_shell-…`), re-run `pnpm exec playwright install chromium`. That usually means Playwright was updated and the matching browser build is missing locally.

## Build analysis

Analyze the build with:

```bash
ANALYZE=true ANALYZE_TEMPLATE=flamegraph pnpm run build
# ANALYZE_TEMPLATE can be sunburst, treemap, network, raw-data, list, or flamegraph
```

Configure the visualizer settings in `vite.config.ts` if you want.

## Updating kanji data

If you have both [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) and this repository in the same parent directory, you can copy its output files directly:

```bash
cp ../kanji-heatmap-data/output/*.json ./public/json
```

Or get the latest `tar.gz` from the [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) repository:

```bash
curl -OL https://github.com/PikaPikaGems/kanji-heatmap-data/releases/latest/download/kanji-heatmap-data.tar.gz
```

Uncompress and store the JSON files in `./public/json`:

```bash
tar -xzf ./kanji-heatmap-data.tar.gz -C ./public/json/
```

You should have the following files updated (among others from the release):

```bash
ls -la public/json
```

```text
component_keyword.json
cum_use.json
extra_kanji_keyword.json
filtered_kanji.json
kanji_extended.json
kanji_main.json
kanji_representative_words.json
phonetic.json
similar-kanjis.json
vocab_furigana.json
vocab_meaning.json
```

Delete the `tar.gz` file since it is no longer needed:

```bash
rm kanji-heatmap-data.tar.gz
```

### Regenerating derived JSON

`pnpm run build` regenerates derived JSON before compiling and bundling:

```bash
node scripts/generate-speed-katakana.mjs && tsc -b && vite build
```

The `/speed-katakana` game loads word lists from `public/json/katakana/challenge-set-<N>.json`, generated from `raw-data/katakana-kore.txt` (48 words per set, ordered by frequency).

#### Other required data

These files in `public/` should exist (see also `./src/lib/assets-paths.ts`):

- `/json/kanji-structure-hlorenzi.json`
- `/json/kanji-readings-details.json`
- `/json/kanji-structure-kanjium.json`
- `/json/kanji-structure-scott.json`
- `/json/kanji-structure-yagays.json`
- `/kanji-textbook-words-min/<KANJI>.json`
- `/kanji-words/v4/<KANJI>.json`

## Talk to us

- [Discord](https://discord.gg/Ash8ZrGb4s)
- [X/Twitter](https://x.com/pikapikagemsjp)
- [Instagram](https://www.instagram.com/pikapikagems)
