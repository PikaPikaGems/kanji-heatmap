# kanji-heatmap-data

Output of the [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data)
release, copied here unchanged. Don't edit these files — fix the data upstream
and copy the new release in (see "Updating kanji data" in the root README).

## Which files are used

| File                              | Used by                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `kanji_main.json`                 | `scripts/generate-v2-json.mjs`                                                                                            |
| `kanji_extended.json`             | `scripts/generate-v2-json.mjs`                                                                                            |
| `kanji_representative_words.json` | `scripts/generate-v2-json.mjs`                                                                                            |
| `phonetic.json`                   | `scripts/generate-v2-json.mjs` (component sounds)                                                                         |
| `vocab_furigana.json`             | `scripts/generate-v2-json.mjs`                                                                                            |
| `vocab_meaning.json`              | `scripts/generate-v2-json.mjs`                                                                                            |
| `similar-kanjis.json`             | `scripts/generate-v2-json.mjs`                                                                                            |
| `cum_use.json`                    | `scripts/generate-v2-json.mjs`                                                                                            |
| `filtered_kanji.json`             | `scripts/download-kanji-svgs.mjs`                                                                                         |
| `component_keyword.json`          | **Not used.** The keywords we kept from it were copied into `raw-data/components/ours.json`, which is the only source now |
| `extra_kanji_keyword.json`        | **Not used**                                                                                                              |

The unused files are still copied in with the release so the folder matches
it exactly. If a new release adds component keywords you want, copy them into
`raw-data/components/ours.json` by hand.
