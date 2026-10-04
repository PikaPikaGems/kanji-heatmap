# radicals

Everything the radical drawer, radical search and radical popover are built
from.

**Rule:** files in `external/` are copied from outside sources and never
edited. Anything we decide ourselves lives next to this README.

## external/ — from outside sources

| File                           | What we use it for                                                                           | Source                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `sylhare-radicals.csv`         | Japanese radical name (おうへん), position (へん), meaning, alternate forms. One-time import | [sylhare/kanji](https://github.com/sylhare/kanji) (`resources/kanji-radicals.csv`) |
| `rewhowe-drawer.json`          | The radicals shown in the radical drawer, grouped by stroke count                            | [rewhowe/kanji](https://github.com/rewhowe/kanji)                                  |
| `rewhowe-decomposition.json`   | Radical search index: kanji → the drawer radicals it contains                                | [rewhowe/kanji](https://github.com/rewhowe/kanji) (very likely; added April 2025)  |
| `anki-semantic-radicals.tsv`   | Short meaning per radical. Not used yet                                                      | [Anki shared deck 1589855678](https://ankiweb.net/shared/info/1589855678)          |
| `anki-phonetic-components.tsv` | Sound families: component, on reading, example kanji. Not used yet                           | [Anki shared deck 470563167](https://ankiweb.net/shared/info/470563167)            |
| `sphmn-components-ck.csv`      | Component → every jōyō kanji that contains it. For a future component search. Not used yet   | [sph-mn/nihongo](https://github.com/sph-mn/nihongo)                                |

## Ours — `ours.json`

Our own choices, all in one file. `scripts/radicals.mjs` reads it together
with `external/` on every `pnpm run generate-json`. To change how a radical
is named or matched, edit this file, never `external/`.

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
  the sylhare CSV.
- **One translation per Japanese name.** Glyphs with the same name are the
  same radical, so only one of them has an entry:
  - A classic radical (sylhare rows 1–214) holds its own: 黒 has "black",
    and ⿊ (also くろ) uses it.
  - A few names belong to two classic radicals (ひ: 日 sun and 火 fire,
    き: 木 tree and 黄 yellow). A glyph sharing such a name uses the one
    whose Alternate column lists it: ⿈ → 黄.
  - A name with no classic radical is held by its first glyph (⺤ for
    つめかんむり; 爫 uses it).
- 245 entries: the 214 classic radicals, 26 positional forms with their own
  name (⺅ にんべん, ⺡ さんずい, …) and 5 `extras`.
- A missing or unused entry fails the build.

### `aliases` — glyphs we treat as the same radical

```jsonc
"aliases": { "龺": "𠦝", "艸": "艹" }
```

The left glyph borrows the right glyph's name and, in radical search,
searches for it. Alternate forms from the sylhare CSV are added
automatically on top of these. Only add an alias when both glyphs really are
the same component.

### `sylhareSkipAlts` — sylhare alternate forms to ignore

```jsonc
"sylhareSkipAlts": ["⺈"]
```

Alternate forms in the CSV that are wrong and must not become aliases. For
example, **⺈** is listed under 刀 but is the ク-shaped top of 魚.

### `sylhareExtraAliases` — aliases the CSV is missing

```jsonc
"sylhareExtraAliases": { "⺍": "⺌", "⾡": "⻌", "𧾷": "足" }
```

### `extras` — radical forms the CSV doesn't list

```jsonc
"extras": {
  "⺩": { "nameJa": "おうへん", "position": "へん", "meaning": "jewelry, jeweled king" }
}
```

Same fields as a CSV row: Japanese name, position (へん, つくり, …) and
meaning. Each one needs a `literalEn` entry, unless it shares its name with
another radical (ヨ けいがしら uses 彐's).
