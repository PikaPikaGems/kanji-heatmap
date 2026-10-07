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
- **Similar-kanji docstring.** `src/build_similar_kanji.py` says unshipped
  kanji from the phonetic tier (70 kanji across 64 pivots, e.g. 伽 → 珈/迦/駕)
  are fine because "the app has a separate keyword fallback for unshipped
  kanji". There is none: none of the 70 have a keyword here. This repo now
  shows them anyway, after the shipped kanji and without a keyword
  (`src/kanji-worker/kanji-worker.ts` `handleKanjiSimilar`,
  `src/kanji-worker/kanji-search.ts` `filterKanji`). Fix the docstring to
  say that.
- **Improve similar-kanji lookalikes for all shipped kanji.** The current
  algorithm in `src/build_similar_kanji.py` misses basic lookalikes. Against
  Yencken's `flashcards.csv` (527 human-judged confusion pairs), only 293 are
  in our lists. Of the 234 misses:

  - 143 are not in dkanjistat's top ~20 neighbors at all (人入, 中申, 休伏,
    一二, 七十). dkanjistat rewards kanji that contain similar parts (人 →
    今介以令企), not kanji whose whole shape is confusable, and it is weakest
    on very simple kanji. It also only stores ~20 neighbors per kanji.
  - 53 are cut by the distance gate (> 0.15): 五互, 今会, 水木, 火炎.
  - 25 are cut by the stroke-gap gate (> 4) or the cap of 10: 古吉, 味妹, 思恩.
  - 13 have a neighbor that is not shipped (百頁, 耳茸).

  The ~292 kanji that dkanjistat doesn't cover use a weaker fallback
  (same sound part, else same radical and shape, ordered by stroke count),
  which is not a visual similarity at all.

  Options, roughly in order of effort:

  1. Merge `flashcards.csv` pairs in as top-priority neighbors (human data,
     already in `raw/similarity/`).
  2. Bring back Yencken's `jyouyou__strokeEditDistance.csv`, keeping only
     high-score pairs; it catches simple pairs like 人入 and 一二.
  3. Compute whole-glyph similarity ourselves: render all 2426 kanji in one
     font and compare the images (~2.9M pairs, cheap). This also covers the
     ~292 fallback kanji with a real visual measure.
  4. Rerun Kanjistat (the R package) and keep more than ~20 neighbors.

  Start with 1 + 2, and measure recall against `poolexp_judgements.yaml`
  (held out, since the flashcards become an input). Then consider 3 so
  every shipped kanji gets a visual-similarity list.

- **Consider shipping more kanji.** We ship 2426 kanji: all 2136 jōyō
  (with the common form 剥 standing in for the official 剝; see
  `JOUYOU_FORMS` in `scripts/generate-v2-json.mjs`) plus 290 non-jōyō.
  Consider adding:

  - Common non-jōyō kanji such as 唸, which already open a drawer here
    (via multi-kanji search) but with "No entry". Pick them by frequency
    (e.g. the jiten / JPDB frequency lists the release already uses).
  - Possibly the official variants 剝 and 𠮟 alongside 剥 and 叱.

  Anything added outside jōyō also needs similar kanji. dkanjistat covers
  only the jōyō list (and uses 剝 and 𠮟, so even our 剥 and 叱 miss it), so
  new kanji would fall back to the weaker sound-part / radical method unless
  the lookalike work above (option 3) lands first.
