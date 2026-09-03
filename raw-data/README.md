# raw-data

**Inputs only.** Nothing here is served to the browser.
`scripts/generate-v2-json.mjs` reads this directory and writes the files the
app actually fetches into `public/json/v2/`.

Never hand-edit anything in `public/json/v2/` — change a source here and
regenerate with `pnpm run generate-json`.

## What lives here

| Source                                                                                                                                                                                                                                                                                                                   | Where it comes from                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `kanji_main.json`, `kanji_extended.json`, `kanji_representative_words.json`, `component_keyword.json`, `phonetic.json`, `vocab_furigana.json`, `vocab_meaning.json`, `kanji_decomposition.json`, `similar-kanjis.json`, `kanji-readings-details.json`, `cum_use.json`, `extra_kanji_keyword.json`, `filtered_kanji.json` | The [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data) release tarball — see the README's "Updating kanji data" |
| `kanji-structure-*.json` (4 files)                                                                                                                                                                                                                                                                                       | Maintained in this repository                                                                                                         |
| `radicals.json`                                                                                                                                                                                                                                                                                                          | Radical groupings and keywords. Aliases live in `radical_aliases.json`.                                                               |
| `radical_aliases.json`                                                                                                                                                                                                                                                                                                   | Encoding twins (same component, different Unicode). Used for search hops and keyword copy.                                            |
| `radical_form_keywords.json`                                                                                                                                                                                                                                                                                             | Kangxi form/position variant nicknames. Fills gaps only; never overwrites.                                                            |
| `AI_radicals.json`                                                                                                                                                                                                                                                                                                       | AI-curated keywords. May overwrite an earlier name. Remaining coverage gaps go here.                                                  |
| `components_manual_overrides.json`                                                                                                                                                                                                                                                                                       | Hand-curated. Humans only — generators must not write this file. See below.                                                           |
| `katakana-kore.txt`                                                                                                                                                                                                                                                                                                      | Word list for the Speed Katakana game (`scripts/generate-speed-katakana.mjs`)                                                         |
| `topokanji_index_twitter.txt`                                                                                                                                                                                                                                                                                            | [TopoKanji](https://github.com/scriptin/topokanji) Twitter list (`lists/twitter.txt`) — one character per line, 1-based index         |

## components_manual_overrides.json

The component registry (`public/json/v2/components.json`) is built by merging
keyword sources in [`scripts/generate-v2-json.mjs`](../scripts/generate-v2-json.mjs)
(`buildComponentsRegistry`). This file is applied **last**, so an entry here
always wins. Fill gaps and fix names in `radical_form_keywords.json` or
`AI_radicals.json` unless you are deliberately overriding those as a human.

`docs/data/component-coverage.json` is regenerated alongside the registry and
lists every component still missing a keyword, ordered by how often it is
referenced.
