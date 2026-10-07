# sound-parts

Each kanji's **sound part** (the lime-bordered chip in a kanji breakdown) and
the **reading** on its badge.

**Rule:** files in `external/` are copied from outside sources and never
edited. Anything we decide ourselves lives in `ours.json`.

## Inputs

| File                                                  | What we use it for                                              | Source                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `../kanji-heatmap-data/kanji_extended.json` (field 8) | The release's sound part per kanji                              | Kanji Heatmap Data release                                              |
| `../kanji-heatmap-data/phonetic.json`                 | The release's readings per sound part                           | Kanji Heatmap Data release                                              |
| `external/anki-phonetic-components.tsv`               | Sound families: part, on reading, example kanji                 | [Anki shared deck 470563167](https://ankiweb.net/shared/info/470563167) |
| `ours.json`                                           | Our choices: families to skip, sound part and reading overrides | This repo                                                               |

## What a sound part means

A **learner hint**, not a claim about a kanji's history. A part qualifies
for a kanji if:

1. it is **visible** in the kanji, and
2. the kanji is **read with the family sound** (voicing is fine: 賀 が in
   加's か family).

The part's own reading doesn't have to match: the release already shows
央 えい (映, 英) though 央 alone is おう.

## How the build merges them

`scripts/sound-parts.mjs` (`buildSoundParts`), called from
`scripts/generate-v2-json.mjs`. Precedence: **ours.json > release > Anki**.

1. Start from the release's sound parts and readings.
2. **Anki only fills gaps:** a kanji with no sound part gets the part of an
   Anki row that lists it, unless the family is in `dropFamilies`. A family
   head is not given itself as its sound part.
3. `soundPart` in `ours.json` sets a kanji's sound part, whatever the
   sources say.
4. Readings: `readings` in `ours.json`, else the release's, else Anki's
   (converted to hiragana).

How the Anki file is read (the file itself is untouched):

- Rows R01–R20 are rhyme groups, not sound families, and are skipped.
- Kangxi and radical-supplement codepoints are read as the ordinary
  character: ⼰ ⽦ ⽄ → 己 疋 斤, and ⺹ → 耂 (the glyph every parts list
  uses, so a breakdown never shows the same shape twice).
- Example kanji outside our kanji set (駕, 蝙, …) are ignored.

`docs/data/sound-parts.json` is regenerated on every build and lists what
Anki added, what `soundPart` overrode, and where Anki disagreed with the
release (the release won).

The build fails if a `dropFamilies` key is not an Anki family, a `soundPart`
or `readings` entry repeats what the sources already give or matches
nothing, or a sound part ends up with no reading.

## `ours.json`

```jsonc
{
  // Anki families that fail the hint test. Each value is the reason.
  "dropFamilies": { "券": "拳 and 圏 share only 龹 with 券; no 刀" },
  // kanji → sound part, wins over the release and Anki.
  "soundPart": { "銭": "㦮" },
  // sound part → readings, wins over the release and Anki.
  "readings": { "斉": ["さい"] },
}
```

Decided with the user in October 2026, after checking every Anki family
against the hint test (and against Wiktionary's "Glyph origin" for
background):

- **Dropped:** 祭 (a サツ badge would show on 祭 and 際), 券 and 疋 (only
  part of the shape is in the kanji), 士 (支 is 十 + 又).
- **浅 銭 践 → 㦮:** the shared shape, the old 戔 (セン). The release gives
  浅, which is not in 銭 or 践.
- **斉 さい:** Anki says ザイ (from 剤), but 斎, 済 and 斉 itself are さい.
