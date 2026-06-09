# Kanji Heatmap (previously Kanji Companion)

![main page](./docs/images/preview.png)

| ![kanji details](./docs/images/kanji-details.png) | ![mobile screen](./docs/images/kanji-expanded.png) |
| ------------------------------------------------- | -------------------------------------------------- |
|                                                   |                                                    |

![sort and filter dialog](./docs/images/sort-dialog.png)

## Development

```
$ nvm use 22
$ pnpm install
$ pnpm run dev
```

> **Note:** When using `pnpm run dev`, clicking the book icon (Jisho lookup) in the vocabulary table will not load data — it requires a Cloudflare Worker running locally. All other features work normally.

### Full functionality (with Jisho lookup)

The Jisho lookup feature proxies requests through a [Cloudflare Pages Function](./functions/api/jisho.ts) to work around CORS restrictions. To run it locally you need [wrangler](https://developers.cloudflare.com/workers/wrangler/):

```
# Terminal 1
$ pnpm run dev

# Terminal 2
$ pnpm run dev:cf
```

Then open `http://localhost:5173` (wrangler's port, not Vite's).

## Updating Data

If you have both [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) and this repository in the same directory, you can directly copy its output files

```
cp ../kanji-heatmap-data/output/*.json ./public/json
```

## Build Analysis

Analyze the build with

```
ANALYZE=true ANALYZE_TEMPLATE=flamegraph pnpm run build
# ANALYZE_TEMPLATE can be sunburst, treemap, network, raw-data, list, or flamegraph
```

Configure the visualizer settings in vite.config.ts if you want

## Preview

```
$ pnpm run peek
  ➜  Local:   http://localhost:4173/
  ➜  Network: http://192.168.254.107:4173/
  ➜  press h + enter to show help
```

## Updating the Data (Production)

Get the latest `tar.gz` from the [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) repository

```
curl -OL https://github.com/PikaPikaGems/kanji-heatmap-data/releases/latest/download/kanji-heatmap-data.tar.gz
```

Uncompress and store the json files in `./public/json`

```
tar -xzf ./kanji-heatmap-data.tar.gz -C ./public/json/
```

You should have the following files updated

```
ls -la public/json

    1759 component_keyword.json
    2118 cum_use.json
  369264 kanji_extended.json
  284376 kanji_main.json
    2187 phonetic.json
  200687 vocab_furigana.json
  191712 vocab_meaning.json
```

Delete the `tar.gz` file since it's not needed anymore

```
rm kanji-heatmap-data.tar.gz
```

## Talk to Us

- [Discord](https://discord.gg/Ash8ZrGb4s)
- [X/Twitter](https://x.com/pikapikagemsjp)
- [Instagram](https://www.instagram.com/pikapikagems)
