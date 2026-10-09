# sound-parts

Each kanji's **sound part** (the lime-bordered chip in a kanji breakdown) and
the **reading** on its badge.

**Rule:** files in `external/` are copied from outside sources and never
edited. Anything we decide ourselves lives in `ours.json`.

## Inputs

| File                                                  | What we use it for                                                               | Source                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `../kanji-heatmap-data/kanji_extended.json` (field 8) | The release's sound part per kanji                                               | Kanji Heatmap Data release                                              |
| `../kanji-heatmap-data/phonetic.json`                 | The release's readings per sound part                                            | Kanji Heatmap Data release                                              |
| `external/anki-phonetic-components.tsv`               | Sound families: part, on reading, example kanji                                  | [Anki shared deck 470563167](https://ankiweb.net/shared/info/470563167) |
| `ours.json`                                           | Our choices: codepoint fixes, families to skip, sound part and reading overrides | This repo                                                               |

## What a sound part means

A **learner hint**, not a claim about a kanji's history. The chip means
**kanji that contain this part tend to be read this way** (decided with the
user, October 2026). It is about the part's family, not the kanji page it
sits on: 門 is もん, but its chip says かん for 間 関 簡 閑. The popover
lists the family: "🔊 Sound hint: 語 吾 悟 伍 梧", with the readings below. A part qualifies
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
   Anki row that lists it, unless the family is in `dropFamilies`, and only
   if the kanji is **read with the family sound** (its on readings, voicing
   ignored). Then each family head that is a kanji gets itself (加 → 加), as
   the release does for its heads (旨 → 旨), even when the head isn't read
   that way: its chip says kanji with it are often read so (門 もん, family
   かん). Members go first, so a kanji in one family and at the head of
   another keeps the hint for its own reading (少 → 小 しょう, not 少 さ).
3. `soundPart` in `ours.json` sets a kanji's sound part, whatever the
   sources say.
4. Readings: `readings` in `ours.json`, else the release's, else Anki's
   (converted to hiragana).

How the Anki file is read (the file itself is untouched):

- Rows R01–R20 are rhyme groups, not sound families, and are skipped.
- Kangxi and radical-supplement codepoints are read as the ordinary
  character, using `codepointFixes` in `ours.json`: ⼰ ⽦ ⽄ → 己 疋 斤, and
  ⺹ → 耂 (the glyph every parts list uses, so a breakdown never shows the
  same shape twice).
- Example kanji outside our kanji set (駕, 蝙, …) are ignored.

`docs/data/sound-parts.json` is regenerated on every build and lists what
Anki added, what `soundPart` overrode, where Anki offered another part
(the kanji kept the one it had), and which Anki kanji failed the reading
test.

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
  part of the shape is in the kanji), 糸 (see 係 below), 士 (支 is 十 + 又; 枝 and 肢 get 支
  instead, below).
- **浅 銭 践 → 㦮:** the shared shape, the old 戔 (セン). The release gives
  浅, which is not in 銭 or 践.
- **係 → 系 けい** (and 系 → 系, as a head), and 糸 dropped: 系 is what's in
  係 and carries けい (hlorenzi, kanjium, Wiktionary); 糸 is し and appears in
  hundreds of kanji as "thread", so a 糸 けい chip would mislead.
- **枝 肢 → 支 し** (and 支 → 支, as a head): 枝 = 木 + 支 and 肢 = 肉 + 支,
  with 支 as the sound part (Wiktionary). Anki files them under 士, which
  is not in them; the release has no part for them.
- **洪 → 港 こう is kept: 洪 IS VISIBLE IN 港** (氵 + 共-shaped top of 巷).
  Wiktionary gives 巷 as 港's historical sound part, but the hint only
  needs the shape to be visible and the reading to match. Settled with the
  user twice; don't flag it again.
- **斉 さい:** Anki says ザイ (from 剤), but 斎, 済 and 斉 itself are さい.
- **才 さい:** Anki says ザイ (from 材, 財), but 才 itself is さい; 材 ざい is
  the voiced form, and 財 is also さい.
