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

## Ours

| File                              | What it is                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `bushu-literal-en.json`           | Our English translations of the Japanese radical names (さんずい → "three water")                                              |
| `aliases.json`                    | `aliases`: glyphs we treat as the same radical. `sylhareSkipAlts` / `sylhareExtraAliases`: fixes to the CSV's alternate forms  |
| `sylhare-component-keywords.json` | **Generated**, not hand-edited. Written by `scripts/generate-sylhare-component-keywords.mjs` (run by `pnpm run generate-json`) |
