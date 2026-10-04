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

## Pending

Fixes that belong upstream in Kanji Heatmap Data, not here. All parked for
now; the user will handle them later.

- **Grade bug.** The release tags 279 name kanji (伊, 彦, 智, …) as grade 9.
  This repo works around it in `scripts/generate-v2-json.mjs` using
  `raw-data/misc/jouyou_kanji.txt`; remove the workaround once the release is
  fixed.
- **Component keyword fixes.** Corrections made in
  `raw-data/components/ours.json` (乂 "mow", 昏 "twilight", …) could go back
  into the release's `overrides/component_keyword.json`.
- **金 keyword.** The user may rename 金 "gold" to "gold metal". 釒 follows it
  automatically once the new release is copied in.
- **Sound parts.** This repo will merge the release's `phonetic.json` and
  per-kanji `phonetic` field with
  `raw-data/radicals/external/anki-phonetic-components.tsv` in its own build.
  The merged data should move into Kanji Heatmap Data later.
