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
with `external/` on every `pnpm run generate-json`.

| Key                   | What it is                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `literalEn`           | Our English translations of the Japanese radical names (さんずい → "three water")                                                        |
| `aliases`             | Glyphs we treat as the same radical (龺 → 𠦝)                                                                                            |
| `sylhareSkipAlts`     | Alternate forms in the sylhare CSV that are wrong and must not become aliases (e.g. **⺈** is listed under 刀 but is the ク-crown in 魚) |
| `sylhareExtraAliases` | Aliases the sylhare CSV is missing (⺍ → ⺌, ⾡ → ⻌, 𧾷 → 足)                                                                           |
| `extras`              | Radical forms the sylhare CSV doesn't list (⺩, 丷, ヨ, …)                                                                               |
