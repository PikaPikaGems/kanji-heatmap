# raw-data

**Inputs only.** Nothing here is served to the browser.
`scripts/generate-v2-json.mjs` reads this directory and writes the files the
app actually fetches into `public/json/v2/`.

Never hand-edit anything in `public/json/v2/` — change a source here and
regenerate with `pnpm run generate-json`.

## What lives here

| Folder / file                      | What it is                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kanji-heatmap-data/`              | The [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) release, copied in unchanged — see the README's "Updating kanji data"                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `radicals/`                        | Everything radical-related, with sources — see `radicals/README.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `kanji-structure/`                 | Character Structure breakdowns, converted to JSON. `hlorenzi.json`: [hlorenzi/jisho-open](https://github.com/hlorenzi/jisho-open/blob/main/backend/src/data/kanji_structural_category.ts). `kanjium.json`: [mifunetoshiro/kanjium](https://github.com/mifunetoshiro/kanjium/blob/master/data/source_files/kanjidict.txt). `scott.json`: [ScottOglesby/kanji-bakuhatsu](https://github.com/ScottOglesby/kanji-bakuhatsu/blob/master/raw/kanji-composition-map.txt). `yagays.json`: [yagays/kanjivg-radical](https://github.com/yagays/kanjivg-radical/blob/master/data/kanji2radical.json) |
| `misc/jouyou_kanji.txt`            | Official jōyō list (2,136), one kanji per line. Only these get a school grade; everything else is "Not in Jouyou"                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `misc/topokanji_index_twitter.txt` | [TopoKanji](https://github.com/scriptin/topokanji) Twitter list (`lists/twitter.txt`) — one character per line, 1-based index                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `misc/kanji-readings-details.json` | Reading frequency per kanji, from Dr. Patrick Kandrac's [Jōyō Kanji Readings ver. 1.1](https://www.researchgate.net/publication/357163811_Joyo_Kanji_Readings_ver_11), likely via [piyush8512/Kanji-Readings-Converter](https://github.com/piyush8512/Kanji-Readings-Converter)                                                                                                                                                                                                                                                                                                           |
| `misc/katakana-kore.txt`           | Word list for the Speed Katakana game (`scripts/generate-speed-katakana.mjs`). Source not recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `components_manual_overrides.json` | Ours, hand-curated component keywords. See below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

`sylhareSkipAlts` (in `radicals/aliases.json`) blocks CSV Alternate → drawer aliases that are wrong (e.g. **⺈** is listed under 刀 but is the ク-crown in 魚). `sylhareExtraAliases` fills gaps after CSV (⺍ → ⺌, ⾡ → ⻌, 𧾷 → 足). Neither field is served.

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
