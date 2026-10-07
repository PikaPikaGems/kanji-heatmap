# Kanji Heatmap Data: pending fixes

Fixes that belong upstream in [Kanji Heatmap Data](https://github.com/PikaPikaGems/kanji-heatmap-data), not in this repo. All parked for
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
- **Sound parts.** This repo merges the release's `phonetic.json` and
  per-kanji `phonetic` field with
  `raw-data/sound-parts/external/anki-phonetic-components.tsv` in its own
  build (`scripts/sound-parts.mjs`, rules in `raw-data/sound-parts/README.md`).
  The merged result (`docs/data/sound-parts.json` lists what Anki added) and
  our choices in `raw-data/sound-parts/ours.json` should move into Kanji
  Heatmap Data later, in particular:
  - 浅 銭 践 → 㦮 (the release gives 浅, which is not in 銭 or 践).
  - Possible gaps where the release has the right part but doesn't use it:
    省 ← 生, 定 ← 正 (Wiktionary).
