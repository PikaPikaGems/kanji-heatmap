# radicals

Everything the radical drawer, radical search and radical popover are built
from.

**Rule:** files in `external/` are copied from outside sources and never
edited. Anything we decide ourselves lives next to this README.

## external/ — from outside sources

| File                         | What we use it for                                                                             | Source                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `sylhare-radicals.csv`       | Japanese radical name (おうへん), position (へん), meaning, alternate forms. One-time import   | [sylhare/kanji](https://github.com/sylhare/kanji) (`resources/kanji-radicals.csv`) |
| `rewhowe-drawer.json`        | The radicals shown in the radical drawer, grouped by stroke count                              | [rewhowe/kanji](https://github.com/rewhowe/kanji)                                  |
| `rewhowe-decomposition.json` | Radical search index: kanji → the drawer radicals it contains                                  | [rewhowe/kanji](https://github.com/rewhowe/kanji) (very likely; added April 2025)  |
| `anki-semantic-radicals.tsv` | Short meaning per radical. Not used yet                                                        | [Anki shared deck 1589855678](https://ankiweb.net/shared/info/1589855678)          |
| `sphmn-components-ck.csv`    | Component → every jōyō kanji that contains it. Component search, see "sph-mn components" below | [sph-mn/nihongo](https://github.com/sph-mn/nihongo)                                |

## Ours — `ours.json`

Our own choices, all in one file. `scripts/radicals.mjs` reads it together
with `external/` on every `pnpm run generate-json`. To change how a radical
is named or matched, edit this file, never `external/`.

### How a glyph gets its name and popover info

`scripts/radicals.mjs` (`buildRadicalData`) turns the CSV and this file into
three things: **aliases**, **names** (`literalEn`) and **popover info**
(Japanese name, position, meaning). Each fact is stored once:

- A glyph shows **its own** name and info if it has them; otherwise the app
  follows its **alias** (衤 → 衣). ⺤ has both: its own name "claw crown", and
  an alias to 爪 so radical search uses the drawer's 爪 button.
- A **kanji** always shows its kanji keyword, also when reached through an
  alias (衤 → 衣 shows "garment"). So a kanji never has a `literalEn` entry;
  its popover info (Japanese name, position, meaning) is always kept, since
  a kanji radical (夕) opens the radical popover too.
- Names and info are shared **only through aliases**. Two glyphs with the
  same Japanese name don't share anything unless one aliases to the other.
  Families (below) link the forms of a radical but share nothing.

The build fails on a `literalEn` entry for a kanji, an unused entry, or a
named glyph (a CSV row, an `extras` entry, or an alternate form without an
alias) that has neither a name nor an alias.

### `literalEn` — English translation of each radical's Japanese name

```jsonc
"literalEn": {
  "⺡": "three water", // さんずい
  "⺩": "king left", // おうへん
}
```

- Keyed by **glyph**, never by reading. Readings collide (日 and 火 are both
  ひ), which once made 火 "sun".
- A literal translation of the name, not its meaning. The meaning comes from
  the sylhare CSV. (How radicals are named is being revisited; see the radical
  popover overhaul in `docs/notes/radicals-pending.md`.)
- Only for radicals that aren't kanji: 115 entries. The radical drawer's own
  glyphs hold the name when the classic glyph aliases to them (｜ "vertical
  stick", ノ "katakana no", ヨ "pig head", ⺲ "net head").

### `aliases` — glyphs we treat as the same radical

```jsonc
"aliases": { "龺": "𠦝", "艸": "艹", "⿊": "黒" }
```

The left glyph reads the right glyph's name and info (unless it has its own)
and, in radical search, searches for it. Alternate forms from the sylhare CSV
are added automatically on top of these. Only add an alias when both glyphs
really are the same radical: a different codepoint for the same character
(⿊ → 黒), or a squeezed positional form (衤 → 衣).

### `sylhareSkipAlts` — sylhare glyphs to ignore

```jsonc
"sylhareSkipAlts": ["⺈", "阝", "⺍", "甩", "玊", "⾡"]
```

Glyphs the CSV gets wrong: they never become aliases, alternate forms or
radicals of their own.

- **⺈** is listed under 刀 but is the ク-shaped top of 魚.
- **阝** is used for both ⻖ (left, hill) and ⻏ (right, village); it is a plain
  component named "hill or village" (in `raw-data/components/ours.json`).
- **玊** is listed under 王 ("king"), and has its own row, but it is not a
  radical: it is a rare variant of 玉 (jade). Aliasing it to 王 would be
  wrong, so it is a plain part with no name (shows "...").
- **⺍** and **⾡** get the right alias from `sylhareExtraAliases` instead.
- **甩** (reason not recorded) is a different character ("to fling") that the
  CSV lists under 用.

### `sylhareExtraAliases` — aliases the CSV is missing

```jsonc
"sylhareExtraAliases": { "⺍": "⺌", "⾡": "⻌", "𧾷": "足" }
```

### `sylhareCodepointFixes` — ordinary characters for radical code points

```jsonc
"sylhareCodepointFixes": { "⼊": "入", "⺟": "母", "⻫": "斉" }
```

The CSV writes a few radicals with a Kangxi or radical-supplement code point
where the drawer and every kanji list use the ordinary character. The build
swaps them in the Radical and Alternate columns before anything else:

- 入 gets radical 11's row (いる).
- 母 becomes a form of 毋 (Japanese Wikipedia 毋部: the radical covers 毋,
  毌 and 母).
- 斉 becomes a form of 齊, radical 210 (Japanese Wikipedia 斉部). The CSV
  writes it ⻫, Unicode's "J-simplified" 齊.

母 has its own name in `extras`
(はは), so it doesn't take 毋's なかれ. The build fails on a code point the CSV
doesn't use.

### `sylhareRowGlyphs` — real glyphs for private-use rows

```jsonc
"sylhareRowGlyphs": { "うしへん": "牜", "いとへん": "糹" }
```

The CSV draws some positional forms in its own private-use font (うしへん
is U+E748). When Unicode has the glyph, map the row's Japanese name to it:
the row then names that glyph, which becomes a form of its own (牛 → 牛,
牜) with a `literalEn` entry ("cow left"). The build fails on a name with
no private-use row.

### `extras` — radical forms the CSV doesn't list

```jsonc
"extras": {
  "⺩": { "nameJa": "おうへん", "position": "へん", "meaning": "jewelry, jeweled king" }
}
```

Same fields as a CSV row: Japanese name, position (へん, つくり, …) and
meaning. Each one needs a `literalEn` entry or an alias.

### Glyphs the app never shows are dropped

A glyph that appears in no drawer, kanji list, decomposition or structure
data (⿊, 靣, ⺝) is dropped from the radical data: it gets no alias, no
keyword and no popover info. An alias stays if a shown glyph's alias chain
passes through it. A dropped glyph that has a CSV row keeps only its name,
as a row in its family's forms (つきへん under 月). The build fails on a
`literalEn` entry for a dropped glyph.

### Families — the forms of one radical

The build writes `families` to radicals.json: head → [head, ...forms], from
the CSV's Alternate column (水 → 水, ⺡, 氺). A form is a glyph with radical
info or a drawer glyph, or a name-only row `{ ja, pos? }` for a CSV row with
no glyph the app can show: a private-use codepoint (きへん under 木) or a
dropped glyph. Alternates without a name of their own (氵, a second code for
⺡) and repeated names are left out. A family only links its forms; each
form keeps its own name, position and popover text.

```jsonc
"familySkips": { "𠆢": "Listed under both 人 and 入; …" },
"familyHeads": { "丿": "ノ", "彐": "ヨ", "罒": "⺲" }
```

- `familySkips`: keeps a glyph out of every family but its own, with the
  reason. The build fails when a glyph lands in two families.
- `familyHeads`: the head when it isn't the CSV's Radical column, normally
  the drawer glyph that holds the popover text.

## Ours — `ours-popover-text.json`

Our own text for the radical popover, keyed by glyph.
`scripts/radical-popover-text.mjs` reads it on every `pnpm run generate-json`
and writes `public/json/v2/radical_popover_text.json`, which the popover
loads when it opens. The rules for what goes in it (one linked reference per
claim, our own wording, which kanji may be examples) are in
`docs/notes/radicals-pending.md`, "Radical popover text".

```jsonc
"隹": {
  "ja": "…",          // 🇯🇵 why the Japanese name is what it is
  "jaRefs": ["…"],    // only for history reasons, not shape reasons
  "addEn": "…",       // English words added after sylhare's (comma string)
  "cn": "…",          // 🇨🇳 Chinese origin of the glyph
  "refs": ["…"],      // reference for cn
  "semantic": [{ "kanji": "雄", "concepts": "…", "why": "…", "refs": ["…"] }],
  "sound": [{ "kanji": "推", "word": "…", "reading": "…", "gloss": "…", "refs": ["…"] }]
}
```

Every field is optional. `addEn` is merged into the radical info in
`radicals.json` (sylhare's words first, no duplicates). The build fails on an
unknown field, a claim without refs, an example kanji that doesn't contain
the radical, a sound example whose sound part isn't the radical (or is the
radical itself), or a sound word not read with the radical's sound.

## sph-mn components — `external/sphmn-components-ck.csv`

Component search and "Kanji that contain 寺" on the kanji page.
`scripts/sphmn-components.mjs` reads the CSV on every
`pnpm run generate-json` and writes `public/json/v2/sphmn_components.json`:
`[[component, kanji], ...]`, where `kanji` is every shipped kanji that
contains the component at any depth, in the CSV's order. The app flips it
for the kanji → parts direction.

sph-mn builds the CSV from ScottOglesby's kanji-bakuhatsu composition map
(the same data as our `(ScottOglesby)` row, `kanji-structure/external/scott.json`),
expanded to every depth by
[`src/kanji-to-components.coffee`](https://github.com/sph-mn/nihongo/blob/HEAD/src/kanji-to-components.coffee).

- Rows whose component isn't one character are dropped (`中一`, and one
  with an empty component).
- `sphmnCodepointFixes` in `ours.json` merges glyphs that Scott typed two
  ways for one shape; see "Component merges vs radical aliases" below.
- Kanji are written in the forms we ship, with `jouyouForms` from
  `raw-data/misc/ours.json` (剝 → 剥). Kanji we don't ship are dropped, then
  components with no kanji left. Components with only one search result are
  also dropped; a result includes the component itself when it is a kanji.
- The file is in drawer order: most matches first. A match is a kanji that
  contains the component, plus the component itself when it's a kanji we
  ship (search returns it too). Ties go to fewer strokes (the kanji's own
  count, else the radical drawer's), then no stroke count, then code point.
- sph-mn writes parts its own way (氵 八 ⺮ 灬 where the radical drawer has
  ⺡ ハ 竹 ⺣). The data is shown as is and isn't linked to the radical
  drawer.

### Component merges vs radical aliases

Two separate mechanisms, decided with the user (October 2026). They behave
differently on purpose, and neither changes the other.

**Component merges** (`sphmnCodepointFixes`, component search only). Scott's
map was typed by hand and sometimes writes one shape with two characters
(点 has 灬, 勲 has ⺣). The build reads the first as the second and joins
the two rows, so the drawer has one button and the search finds both sets:

| Merged             | Into | Why that glyph                             | Kanji after       |
| ------------------ | ---- | ------------------------------------------ | ----------------- |
| ⺣ (radical fire)  | 灬   | ordinary character                         | 34 (gains 勲 薫)  |
| ⺡ (radical water) | 氵   | ordinary character                         | 121 (gains 滴 濃) |
| ⻊ (radical foot)  | 𧾷   | ordinary character                         | 8                 |
| ｜ (fullwidth bar) | 丨   | ｜ is punctuation, not a kanji part        | 56                |
| 𥫗 (bamboo top)    | ⺮   | 𥫗 is missing from some of the app's fonts | 23                |

Only pairs that look the same in the app's kanji font. Not merged:
⻌/辶 (one dot vs two), ⺤/爫, 䖝/虫 (䖝 has an extra stroke; it is the
inside of 風), ⻖/⻏ (same shape, different parts: 阜 "mound" on the left,
邑 "village" on the right). The build fails if either glyph of a pair is
not a component.

**Radical aliases** (`aliases` in `ours.json` and the sylhare CSV, radical
search and radical popovers only). They say "this glyph is that radical":
氵 → ⺡, 灬 → ⺣, 辶 → ⻌, 爫 → ⺤, 丨 → ｜. Radical search and the radical
popover follow them, so a chip written 氵 opens ⺡'s popover and searches
⺡. They don't touch component search, and component merges don't touch
them. The direction is often the opposite (radicals point to the drawer's
radical form, components to the ordinary character): each side uses the
glyph its own data and drawer show.
