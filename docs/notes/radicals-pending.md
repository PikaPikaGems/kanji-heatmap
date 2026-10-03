# Radicals & components: pending work

Handoff notes from the radical/component cleanup (October 2026). Read this
first if you're picking up any of the items below. The raw-data READMEs
(`raw-data/README.md`, `raw-data/radicals/README.md`,
`raw-data/components/README.md`, `raw-data/kanji-heatmap-data/README.md`)
describe every input file and where it came from.

## How things work now

**Data layout.** `raw-data/` has one folder per source:

| Folder                          | What                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `raw-data/kanji-heatmap-data/`  | Kanji Heatmap Data release, copied in unchanged                                  |
| `raw-data/radicals/external/`   | Outside radical sources (sylhare, rewhowe, two Anki decks, sph-mn). Never edited |
| `raw-data/radicals/ours.json`   | Our radical choices: `literalEn`, `aliases`, sylhare skip/extra lists, `extras`  |
| `raw-data/components/ours.json` | Our component keywords — the only source of non-radical keywords                 |
| `raw-data/kanji-structure/`     | The four Character Structure sources                                             |
| `raw-data/misc/`                | jōyō list, TopoKanji, reading frequencies, katakana words                        |

**Build.** `pnpm run generate-json` runs `scripts/generate-v2-json.mjs` (which
uses `scripts/radicals.mjs`) and then `scripts/count-non-radical-components.mjs`.

**Generated files the app reads:**

- `public/json/v2/components.json` — per component: `k` keyword, `s` sounds, `n` strokes.
- `public/json/v2/radicals.json` — `groupedByStrokeCount` (drawer), `aliases`,
  `info` (`{ ja, pos, cn }` per radical: Japanese name, position, meaning).
  The radical's English name is its component keyword.

**Each fact is stored once.** Aliases (氵 → ⺡) are pointers. Nothing is copied
onto alias glyphs; the app follows them with `followAlias` in
`src/lib/radicals.ts` (`componentKeyword`, `radicalInfo`,
`resolveRadicalForSearch` all use it).

**Card keyword priority** (first wins):

1. `raw-data/components/ours.json`
2. Radical name (sylhare CSV + `literalEn` in `raw-data/radicals/ours.json`)
3. Alias target's keyword

A kanji always uses its `kanji_main` keyword. A glyph counts as a radical only
if it leads to a drawer radical (`isKnownRadical`).

## Decisions already made (don't reopen)

- Files in any `external/` folder or the release folder are never edited. Fixes
  go in an `ours.json`.
- Radical popover and component popover stay **separate**.
- Radicals that are also kanji (王, 火, 車) keep their kanji link.
- Only alias glyphs that are truly the same shape (𤣩 → ⺩). 䖝 (inside 風)
  stays unaliased and shows "...". The 358 unnamed parts are not aliased.
- 𠘨 stays aliased to 風 (popover says かぜ, wind).
- Positions in the sylhare CSV are fine as they are; the popover shows only
  the first value (かまえ for "かまえ, はこがまえ").
- The `improve-radicals` branch is abandoned. Ignore it.
- `extra_kanji_keyword.json` (release) is unused; leave it alone.

## Pending

### 1. Sound info feature

Show sound families with **real words**, not bare kanji:

```
🔊 エイ
  泳ぐ  およぐ  to swim
  詠む  よむ    to compose (a poem)
```

- **Merge, don't pick:** sounds come from the release `phonetic.json`
  (122 components) and `raw-data/radicals/external/anki-phonetic-components.tsv`
  (130 families). 79 overlap (78 agree), the Anki file adds 51 → about 173.
- **祭 conflict:** release さい, Anki サツ (the sound in 察/擦). Both are right
  in their own way; decide whether to keep both.
- **Example kanji** per family come from the Anki file. For the word, reading
  and meaning, use each kanji's existing sample word (the representative word
  in `kanji_main` / `rep_word_details.json`, e.g. 泳 → 泳ぐ, およぐ, "to swim").
  About 19 example kanji are outside our kanji set (駕, 蝙, …) — skip them.
- **Clean the Anki file in the build, not by editing it:**
  - Kangxi-radical codepoints ⼰ ⽦ ⽄ → 己 疋 斤.
  - Wrong families: 中→虫, 士→支/枝/肢, 糸→係.
  - Typos: 谷 "コ/KOKU", 屈 glossed "dig" (that's 掘).
  - Drop rows R01–R20: rhyme groups, not true sound families.
  - The Audio column is empty.
- Where it shows: the component popover already marks sound parts (lime
  border + reading badge in `SingleKanjiPart`). Radicals that are sound parts
  (門, 几, 羊, …) could show it in the radical popover too.

### 2. Radical popover extras

Each is one more field in `radicals.json` → `info`. The user is unsure about
1 and 2.

1. **Alternate forms** — sylhare CSV "Alternate" column (王 → 玉 ⺩). Would also
   explain pairs like 攵/攴.
2. **Example kanji with this radical** — e.g. the 3 most common, from the radical
   search index (`raw-data/radicals/external/rewhowe-decomposition.json`).
3. **Meaning** — `info.cn` (sylhare) overlaps
   `raw-data/radicals/external/anki-semantic-radicals.tsv`, which is shorter and
   cleaner ("Insect / Bug" vs "worm, insect, bug"). Pick or merge. The Anki file
   has ~20 simplified-Chinese rows (讠 纟 贝 …) to drop, and
   `阝(Left side)` / `阝(Right side)` must become ⻖ / ⻏.
4. **Kanji where the radical carries the meaning** — kanjium's first slot is
   the dictionary radical (`raw-data/kanji-structure/kanjium.json`), usually
   the meaning part: 虫 → 蚊 蛍 蚕 蛇 蝶 蜂. Not perfect (虹 is filed under 虫).

### 3. Component search

A new search type, like radical search, built from
`raw-data/radicals/external/sphmn-components-ck.csv` (component → every jōyō
kanji containing it, at any depth). Finds things radical search can't
(寺 → 侍 持 待 時 特 等 詩).

- 981 components. Covers jōyō only, so our 291 non-jōyō kanji never match.
- Junk rows to drop: `中一` and one with an empty component.
- The drawer groups by stroke count; ~371 components have no stroke count —
  put them in a "?" section.
- No "selected items with keyword" bar (most components have no keyword).
- 981 buttons is fine on phones without virtualization; just avoid
  re-rendering every button on each tap.

### 4. Small open questions

- **Check component keywords against kanji keywords in the build?** Today it
  only checks components against each other; 乂 "regulate" and 昏 "dusk"
  slipped through (now renamed "mow" and "twilight").
- **Push keyword fixes upstream** to Kanji Heatmap Data
  (`overrides/component_keyword.json`) at some point.
- **Unnamed parts:** 358 parts show "...". None is used by 10+ kanji; 28 are
  used by 5+ (the shortlist if names are ever wanted). Fine to leave.

## Working rules

- Run `pnpm exec prettier --check .` before finishing (see `CLAUDE.md`), plus
  `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`.
- After changing data or the build, run `pnpm run generate-json` and commit the
  regenerated `public/json/v2/` and `docs/data/` files.
- For refactors, prove nothing changed on screen: snapshot every glyph's
  keyword, radical info and search target before and after, and diff.
- Keep it simple. The user prefers small, explained steps and decides
  anything that changes what users see.
