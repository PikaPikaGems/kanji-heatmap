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

A kanji always uses its `kanji_main` keyword, and so does any shape whose
alias leads to a kanji (釒 → 金 shows "gold"); only forms with a name of their
own keep it (⺩ "king left"). A glyph counts as a radical only if it leads to
a drawer radical (`isKnownRadical`).

**Build checks.** `generate-json` fails if a radical has no `literalEn`, a
`literalEn` is unused, an alias leads nowhere, or a component keyword equals
another component's keyword or any kanji keyword (`KANJI_KEYWORD_SHARED_OK`
lists the allowed exceptions).

**Where parts show.** Kanji breakdowns come from two places: the four
Character Structure sources (`public/json/v2/kanji_structures.json`) and the
release's per-kanji parts list (`kanji_extended.json` field 0 →
`kanji_extended_hover.json`). Count both when asking "is this glyph used?" —
阝 is in no structure source but in 43 parts lists.

## Decisions already made (don't reopen)

- Files in any `external/` folder or the release folder are never edited. Fixes
  go in an `ours.json`.
- Radical popover and component popover stay **separate**.
- Radicals that are also kanji (王, 火, 車) keep their kanji link.
- Only alias glyphs that are truly the same shape (𤣩 → ⺩). 䖝 (inside 風)
  stays unaliased and shows "...". Unnamed parts are not aliased unless the
  user approves it (see `docs/notes/naming-review.md`).
- **Show source data as is.** No rewriting of what a source says, even when
  it looks fixable (the build will not turn 阝 into ⻖/⻏ by position). Users
  are told where each breakdown comes from.
- 阝 is a plain component named "hill or village", with no radical popover
  (it's in `sylhareSkipAlts`). Sources use it for both ⻖ (left, 31 kanji) and
  ⻏ (right, 12 kanji).
- ハ and 已 are the drawer's own glyphs for the 八 and 己 radicals, so they
  share the kanji keyword ("eight", "oneself") on purpose. No aliases.
- 歹 stays "bare bone".
- Replacing the 🇨🇳 meaning line is a feature (item 2, popover extra 4), not cleanup.
- Every Kanji Heatmap Data fix is listed under "Pending" in
  `docs/notes/kanji-heatmap-data-pending.md` and is parked until the user picks
  it up.
- 𠘨 stays aliased to 風 (popover says かぜ, wind).
- Positions in the sylhare CSV are fine as they are; the popover shows only
  the first value (かまえ for "かまえ, はこがまえ").
- The `improve-radicals` branch is abandoned. Ignore it.
- `extra_kanji_keyword.json` (release) is unused; leave it alone.

## Pending

### 1. Sound info feature

Split in two (user, October 2026):

- **1A — sound part coverage. Start after
  PikaPikaGems/kanji-heatmap#302 is merged**, on a new branch from `main`.
  Merge the release's sound data with the Anki deck in this repo's build and
  write the result to `public/json/v2/`. Moving the merged data to Kanji
  Heatmap Data later is listed in `docs/notes/kanji-heatmap-data-pending.md`.

  How it works today: each kanji's sound part is the release's
  `kanji_extended.json` field 8 (`phonetic`), copied to
  `kanji_extended_hover.json`; its readings are `components.json` → `s`, from
  the release's `phonetic.json`. The app reads them in `getPhonetic`
  (`src/kanji-worker/kanji-assembly.ts`) and `SingleKanjiPart` draws the lime
  border and reading badge. 509 of 2,426 kanji have a sound part, using 122
  parts; all 122 have readings.

  What the Anki deck adds (measured October 2026, R rows dropped): 50
  families the release doesn't have (加 カ, 果 カ, 牙 ガ, 門 カン, 兄 キョウ,
  竟 キョウ, 共 キョウ, 区 ク, 糸 ケイ, 圭 ケイ, 券 ケン, 犬 ケン, 県 ケン,
  臤 ケン, ⺹ コウ, 洪 コウ, 高 コウ, 左 サ, 少 サ, 才 ザイ, 斉 ザイ, 参 サン,
  次 シ, 匕 シ, 直 ショク, 昔 シャク, 十 ジュウ, 旬 ジュン, 小 ショウ, 㐱 シン,
  亲 シン, 㦮 セン, 相 ソウ, 弟 ダイ, 単 タン, 竹 チク, 主 チュウ, 兆 チョウ,
  甬 ツウ, 丁 テイ, 疋 テイ, 童 ドウ, 忍 ニン, 必 ヒ, 宓 ミツ, 名 メイ,
  明 メイ, 面 メン, 予 ヨ, 羊 ヨウ), and roughly 100 kanji that have no sound
  part today would get one (架 賀, 課 菓, 間 関 簡, 洋 養, 挑 眺 跳, …). That
  count still includes family heads (加 in 加's family) and the bad rows below.

  For the user to decide before shipping (it changes what users see):

  - Whether a kanji that already has a release sound part can get a
    different one from Anki (or the release always wins).
  - 祭: release さい vs Anki サツ (below).
  - Show the user a list of every kanji that gains or changes a sound part.

- **1B — sound examples in the radical popover.** Part of item 2 (radical
  popover overhaul).

Original notes:

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

### 2. Radical popover overhaul: names + extras

One project (user, October 2026): settle how radicals are named **and**
what the radical popover shows, together. Nothing here is decided yet.

#### Why we're revisiting the radical names

Each radical's English name (`literalEn` in `raw-data/radicals/ours.json`)
was meant to be a literal translation of its Japanese name. Reviewing those
names one by one (`docs/notes/naming-review.md`, section 2) stalled, because:

- **There is no single rule.** Today's names mix literal translations
  ("three water" さんずい), meanings ("bare bone" 歹, "stopping" 艮,
  "bristle right" 彡) and spelled-out kana ("katakana no" 丿, "no + mata"
  夂). Every name became its own debate.
- **Literal names are opaque where most people see them.** A chip in a kanji
  breakdown, the parts list or the radical drawer shows only the glyph and
  the English name. "u crown" (宀 うかんむり, named after the katakana ウ), "wa
  crown" (冖 ワ) and "ma hanging" (广 まだれ, from 麻) meant nothing to a
  learner there (renamed provisionally, below).
- **Every other chip shows a meaning.** Kanji show their keyword ("king"),
  non-radical parts show a meaning ("mow"), and a shape that leads to a kanji
  now shows the kanji keyword (釒 "gold", not かね's "metal"). Radicals are
  the only chips that translate a Japanese _name_.
- **The name is part of the popover.** Its title line is "うかんむり, u crown",
  followed by the position and the 🇨🇳 meaning line. If the name becomes a
  meaning, the meaning line may repeat it; if a new meaning source is used
  (popover extra 4 below), the name should match it. So the name can't be settled
  without designing the popover, and vice versa.
- Only 107 of the 245 names ever show (the rest belong to radicals that are
  kanji, which show the kanji keyword). Those 107 are the ones to decide.

Candidate naming rules (the user hasn't chosen):

- **Describe the part:** meaning + position for everything ("water left",
  "roof crown", "slanting roof hanging"). One rule, no exceptions except
  kana-only shapes (マ "katakana ma"). Most names change; the Japanese name
  stays visible in the popover.
- **Translate the name, fix opaque ones:** keep literal translations, but
  where the name is only a sound or a kana shape, use the meaning ("roof
  crown", "cover crown", "hemp hanging"). About 10 names change.

**User's current leaning (not decided):** translate the name literally; when
the name is a kana shape, spell the kana out ("katakana u crown", like
"katakana no"); when the name comes from something a learner can't see (广
まだれ's ま is from 麻), use the meaning instead ("slanting roof hanging").
This is close to "translate the name, fix opaque ones", but keeps the
spelled-out katakana names.

Provisional (user, October 2026; revisit here): 宀 "katakana u crown" and 冖
"katakana wa crown" (named after the katakana they look like, like 丿
"katakana no"), and 广 "hemp hanging" (まだれ's ま comes from 麻, hemp). The
user finds "hemp hanging" unintuitive; "slanting roof hanging" (its meaning)
is the main alternative.

Earlier choices were made under the literal rule and may be revisited here,
only with the user: のまた "no + mata", るまた "ru + mata", 丿/ノ "katakana
no", 厶 "katakana mu", 乙/⺃ "second", 歹 "bare bone", and the sound-named
radicals keeping a meaning (彡 "bristle right", 冂 "border enclosure", 凵
"open box wrap", 爿 "split wood left", 齊 "even", 亅 "hook stick").

Already fixed: 火, 黄, 革, 示, ⺭, 酉, 禸, then (October 2026) 辛 "spicy", 阜
"small village", ⻖ "small village left", 釆 "no + rice", 斗 "measuring box
right", 幺 "thread head", 缶 "water jar", and for the clash check 戈
"dagger-axe", 艮 "stopping", 豕 "wild pig", 爻 "intersecting lines", 鬲
"tripod kettle", 鹵 "chemical salt", 龠 "pan flute".

Kept on purpose: のまた "no + mata", るまた "ru + mata", 丿/ノ "katakana no",
厶 "katakana mu", 乙/⺃ "second", 歹 "bare bone". Radicals whose Japanese
name is just a reading keep a meaning instead: 彡 "bristle right", 冂 "border
enclosure", 凵 "open box wrap", 爿 "split wood left", 齊 "even", 亅 "hook
stick".

#### Popover extras

Each adds or changes what the radical popover shows (one more field in
`radicals.json` → `info`). The user was unsure about 2 and 3; 4 would change
the existing 🇨🇳 meaning line; 6 is the sound half of item 1.

1. **The name** — see above. Decide first; it shapes the title line.
2. **Alternate forms** — sylhare CSV "Alternate" column (王 → 玉 ⺩). Would also
   explain pairs like 攵/攴.
3. **Example kanji with this radical** — e.g. the 3 most common, from the radical
   search index (`raw-data/radicals/external/rewhowe-decomposition.json`).
4. **Meaning** — `info.cn` (sylhare) overlaps
   `raw-data/radicals/external/anki-semantic-radicals.tsv`, which is shorter and
   cleaner ("Insect / Bug" vs "worm, insect, bug"). Pick or merge. The Anki file
   has ~20 simplified-Chinese rows (讠 纟 贝 …) to drop, and
   `阝(Left side)` / `阝(Right side)` must become ⻖ / ⻏.
5. **Kanji where the radical carries the meaning** — kanjium's first slot is
   the dictionary radical (`raw-data/kanji-structure/kanjium.json`), usually
   the meaning part: 虫 → 蚊 蛍 蚕 蛇 蝶 蜂. Not perfect (虹 is filed under 虫).
6. **Sound examples (1B)** — for radicals that are also sound parts (門, 几,
   羊, …): the reading and a few words, as in item 1.

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

### 4. Before and after merging this work

- Done: PikaPikaGems/kanji-heatmap#301 was merged, and the remote
  `radicals-cleanup` and `improve-radicals` branches were deleted. Of
  `radicals-cleanup`, four files were imported into `raw-data/radicals/external/` and `raw-data/misc/`. Left
  out on purpose: `Phonetic_Component.tsv` (near-copy of the phonetic deck),
  `components-kc.csv` (the same data as `components-ck.csv`, flipped) and
  `kanji-composition-map.txt` (already in `raw-data/kanji-structure/scott.json`).
- **Pending upstream — grade bug.** Listed in `docs/notes/kanji-heatmap-data-pending.md`, with every other Kanji Heatmap
  Data fix.

### 5. Small open questions

- Done: the build fails if a component keyword is also a kanji keyword (see
  "Build checks").
- **Unnamed parts:** 356 parts show "...". None is used by 10+ kanji; 28
  glyphs (23 shapes) are used by 5+. The user wants the most used ones named:
  suggestions are in section 1 of `docs/notes/naming-review.md`, waiting for
  decisions.

## Working rules

- Run `pnpm exec prettier --check .` before finishing (see `CLAUDE.md`), plus
  `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`.
- After changing data or the build, run `pnpm run generate-json` and commit the
  regenerated `public/json/v2/` and `docs/data/` files.
- For refactors, prove nothing changed on screen: snapshot every glyph's
  keyword, radical info and search target before and after, and diff.
- Keep it simple. The user prefers small, explained steps and decides
  anything that changes what users see.
