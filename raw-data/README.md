# raw-data

**Inputs only.** Nothing here is served to the browser.
`scripts/generate-v2-json.mjs` reads this directory and writes the files the
app actually fetches into `public/json/v2/`.

Never hand-edit anything in `public/json/v2/` — change a source here and
regenerate with `pnpm run generate-json`.

## What lives here

| Source                                                    | Where it comes from                                                                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kanji-heatmap-data/`                                     | The [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) release, copied in unchanged — see the README's "Updating kanji data" |
| `kanji_decomposition.json`, `kanji-readings-details.json` | Source not recorded. Not produced by Kanji Heatmap Data                                                                                            |
| `kanji-structure-*.json` (4 files)                        | Maintained in this repository                                                                                                                      |
| `radicals.json`                                           | Drawer groupings, lookalike aliases, and Sylhare skip/extra maps. Only grouping + merged aliases go to `public/json/v2/radicals.json`.             |
| `components_manual_overrides.json`                        | Hand-curated. See below                                                                                                                            |
| `katakana-kore.txt`                                       | Word list for the Speed Katakana game (`scripts/generate-speed-katakana.mjs`)                                                                      |
| `topokanji_index_twitter.txt`                             | [TopoKanji](https://github.com/scriptin/topokanji) Twitter list (`lists/twitter.txt`) — one character per line, 1-based index                      |
| `jouyou_kanji.txt`                                        | Official jōyō list (2,136), one kanji per line. Only these get a school grade; everything else is "Not in Jouyou"                                  |

`sylhareSkipAlts` blocks CSV Alternate → drawer aliases that are wrong (e.g. **⺈** is listed under 刀 but is the ク-crown in 魚). `sylhareExtraAliases` fills gaps after CSV (⺍ → ⺌, ⾡ → ⻌, 𧾷 → 足). Neither field is served.

## components_manual_overrides.json

The component registry (`public/json/v2/components.json`) is built by merging
every algorithmic source above. This file is applied **last**, so an entry
here always wins — use it to fill a missing keyword or correct a wrong one.

```jsonc
{
  "尞": { "k": "torch" }, // fill a gap
  "夋": { "k": "swagger" },
  "⺣": { "k": "small fire" }, // override an algorithmic keyword
}
```

Fields (all optional, same shape as a generated entry):

- `k` — keyword
- `s` — phonetic sounds, e.g. `["ちょう", "かん"]`
- `n` — stroke count

`docs/data/component-coverage.json` is regenerated alongside the registry and
lists every component still missing a keyword, ordered by how often it is
referenced — that is the worklist for this file.
