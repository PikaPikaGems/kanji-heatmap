# Radicals & components: pending work

Handoff notes from the radical/component cleanup (October 2026). Read this
first if you're picking up any of the items below. The raw-data READMEs
(`raw-data/README.md`, `raw-data/radicals/README.md`,
`raw-data/components/README.md`, `raw-data/kanji-heatmap-data/README.md`)
describe every input file and where it came from.

## How things work now

**Data layout.** `raw-data/` has one folder per source:

| Folder                               | What                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `raw-data/kanji-heatmap-data/`       | Kanji Heatmap Data release, copied in unchanged                                  |
| `raw-data/radicals/external/`        | Outside radical sources (sylhare, rewhowe, two Anki decks, sph-mn). Never edited |
| `raw-data/radicals/ours.json`        | Our radical choices: `literalEn`, `aliases`, sylhare skip/extra lists, `extras`  |
| `raw-data/components/ours.json`      | Our component keywords — the only source of non-radical keywords                 |
| `raw-data/kanji-structure/external/` | The four Character Structure sources                                             |
| `raw-data/misc/external/`            | jōyō list, TopoKanji, reading frequencies, katakana words                        |

**Build.** `pnpm run generate-json` runs `scripts/generate-v2-json.mjs` (which
uses `scripts/radicals.mjs`) and then `scripts/count-non-radical-components.mjs`.

**Generated files the app reads:**

- `public/json/v2/components.json` — per component: `k` keyword, `s` sounds, `n` strokes.
- `public/json/v2/radicals.json` — `groupedByStrokeCount` (drawer), `aliases`,
  `info` (`{ ja, pos, cn }` per radical: Japanese name, position, meaning).
  The radical's English name is its component keyword.

**Each fact is stored once.** `scripts/radicals.mjs` (`buildRadicalData`)
returns finished aliases, names and popover info; `generate-v2-json.mjs` only
writes them out. Aliases (氵 → ⺡) are pointers, and they are the only link
between glyphs that are the same radical (no matching by Japanese name, no
copies). The app follows them with `followAlias` in `src/lib/radicals.ts`
(`componentKeyword`, `radicalInfo`, `resolveRadicalForSearch` all use it).
`raw-data/radicals/README.md` has the full rules.

**Card keyword** (first wins):

1. A kanji's `kanji_main` keyword.
2. The glyph's own keyword: `raw-data/components/ours.json`, else its radical
   name (`literalEn`).
3. Follow the alias and repeat; reaching a kanji gives its `kanji_main`
   keyword (衤 → 衣 "garment"). Kanji keywords live only in `kanji_main`.

A glyph counts as a radical only if it leads to a drawer radical
(`isKnownRadical`).

**Build checks.** `generate-json` fails on a `literalEn` for a kanji, an
unused `literalEn`, a named radical glyph with neither a name nor an alias,
an alias that leads nowhere, a keyword on a kanji, or a component keyword
that equals another component's keyword or any kanji keyword
(`KANJI_KEYWORD_SHARED_OK` lists the allowed exceptions).

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

- **1A — sound part coverage. Done on branch `sound-parts-merge`**
  (October 2026), waiting for the user's review before merge. The build
  merges the release's sound parts with the Anki deck:
  `scripts/sound-parts.mjs`, inputs and rules in
  `raw-data/sound-parts/README.md`, our choices in
  `raw-data/sound-parts/ours.json`. `docs/data/sound-parts.json` lists every
  kanji Anki filled in. Moving the merged data to Kanji Heatmap Data later is
  listed in `docs/notes/kanji-heatmap-data-pending.md`.

  Decided with the user:

  - **A sound part is a learner hint:** visible in the kanji, and the kanji
    is read with the family sound. Not a claim about the kanji's history
    (the release already shows 央 えい).
  - **Precedence: ours.json > release > Anki.** Anki only fills kanji with
    no sound part, and only kanji read with the family sound.
  - **Family heads get themselves** (加 → 加), like the release's 旨 → 旨,
    also when the head isn't read with the family sound (門 もん, family
    かん). A kanji in one family and at the head of another keeps the hint for
    its own reading (少 → 小 しょう).
  - **The sound chip popover says it's a hint:** "Sound hint: kanji with 門
    are often read かん" (`SingleKanjiPart`).
  - **Dropped Anki families:** 祭, 券, 疋, 士, 糸 (reasons in `ours.json`).
  - **浅 銭 践 → 㦮**, **係 → 系 けい** (and 系 → 系), **枝 肢 → 支 し** (and 支 → 支), and **斉 and 才
    read さい**, through `ours.json`.
  - ⺹ is read as 耂, like the Kangxi codepoints ⼰ ⽦ ⽄ → 己 疋 斤.
  - 孝 keeps the release's 孝 (family heads point to themselves).

  Result: 133 more kanji have a sound part (642 instead of 509; 49 of them
  are family heads), and 浅 銭 践 switch to 㦮. 49 parts gain readings (170
  sound parts in use, was 122).
  Seven of the new ones have no name and show "..." (㦮 亲 甬 竟 臤 宓 㐱);
  31 sound parts are unnamed in all. They belong in the naming worklist
  (`docs/notes/naming-review.md`).

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
  (122 components) and `raw-data/sound-parts/external/anki-phonetic-components.tsv`
  (130 families). 80 overlap (79 agree, once ⼰ is read as 己), the Anki file
  adds 51 → about 173.
- **祭 (decided, user, October 2026):** drop the Anki 祭 row; 祭 keeps only the
  release's さい. Anki's サツ comes from 察/擦, which the release already gives
  their own sound part 察 (さつ). Adding サツ to 祭 would put a wrong badge on
  祭 and 際, the only kanji whose sound part is 祭.
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
  夂, since renamed). Every name became its own debate.
- **Literal names are opaque where most people see them.** A chip in a kanji
  breakdown, the parts list or the radical drawer shows only the glyph and
  the English name. "u crown" (宀 うかんむり, named after the katakana ウ), "wa
  crown" (冖 ワ) and "ma hanging" (广 まだれ, from 麻) meant nothing to a
  learner there (now renamed, below).
- **Every other chip shows a meaning.** Kanji show their keyword ("king"),
  non-radical parts show a meaning ("mow"), and a shape that leads to a kanji
  now shows the kanji keyword (釒 "gold", not かね's "metal"). Radicals are
  the only chips that translate a Japanese _name_.
- **The name is part of the popover.** Its title line is "うかんむり, u crown",
  followed by the position and the 🇨🇳 meaning line. If the name becomes a
  meaning, the meaning line may repeat it; if a new meaning source is used
  (popover extra 4 below), the name should match it. So the name can't be settled
  without designing the popover, and vice versa.
- Only 107 of the 245 names ever showed; the rest belonged to radicals that
  are kanji, which show the kanji keyword. Those were deleted in the pipeline
  cleanup (October 2026), leaving 115 entries, all of which show somewhere.

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

Renamed (October 2026; may be renamed again in this overhaul): 宀 "katakana u crown" and 冖
"katakana wa crown" (named after the katakana they look like, like 丿
"katakana no"), and 广 "hemp hanging" (まだれ's ま comes from 麻, hemp). The
user finds "hemp hanging" unintuitive; "slanting roof hanging" (its meaning)
is the main alternative. In the same spirit, the names made of a katakana
plus a kanji now spell the katakana out: 釆 "katakana no + rice" (のごめ = ノ +
米), 夂 "katakana no + again" (のまた = ノ + 又), 殳 "katakana ru + again"
(るまた = ル + 又).

Earlier choices were made under the literal rule and may be revisited here,
only with the user: 丿/ノ "katakana
no", 厶 "katakana mu", 乙/⺃ "second", 歹 "bare bone", and the sound-named
radicals keeping a meaning (彡 "bristle right", 冂 "border enclosure", 凵
"open box wrap", 爿 "split wood left", 齊 "even", 亅 "hook stick").

Already fixed: 火, 黄, 革, 示, ⺭, 酉, 禸, then (October 2026) 辛 "spicy", 阜
"small village", ⻖ "small village left", 釆 "katakana no + rice", 斗 "measuring box
right", 幺 "thread head", 缶 "water jar", and for the clash check 戈
"dagger-axe", 艮 "stopping", 豕 "wild pig", 爻 "intersecting lines", 鬲
"tripod kettle", 鹵 "chemical salt", 龠 "pan flute", then 卩 "joint right",
隶 "servant right", 弋 "corded arrow", 夂 "katakana no + again", 殳
"katakana ru + again".

Kept on purpose: 丿/ノ "katakana no",
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
   the dictionary radical (`raw-data/kanji-structure/external/kanjium.json`), usually
   the meaning part: 虫 → 蚊 蛍 蚕 蛇 蝶 蜂. Not perfect (虹 is filed under 虫).
6. **Sound examples (1B)** — for radicals that are also sound parts (門, 几,
   羊, …): the reading and a few words, as in item 1.

#### Radical popover text (decided with the user, October 2026)

Shape of the popover, per radical:

    宀
    - 🇯🇵 うかんむり, because it looks like katakana ウ (u) and sits
      on top as a crown (かんむり).
    - 🇨🇳 "roof": began as a picture of a house.
    - Meaning: roof, house
      - 客: guest, visitor. Someone received under your roof.
      - 宿: lodging, inn. It began as a person resting on a mat; the
        roof marks it as indoors.
      - 安: peace, ease. It first meant sitting at ease, settled at home.
    - (no sound section: 宀 isn't a sound part)

    Sound section, for radicals that are sound parts (e.g. 青):
    - Sound: せい
      - 清, 清潔, せいけつ, clean
      - 精, 精神, せいしん, spirit, mind
      - 晴, 晴天, せいてん, clear weather

Rules:

- 🇯🇵 line: why Japanese speakers use the Japanese name, described from
  how it's written (夂 のまた: written like katakana ノ (no) followed by
  又 (mata, "again")).
- 🇨🇳 line: the Chinese origin of the glyph behind its English name.
- Meaning examples: 2–3 kanji, each with its concepts and a short line on
  how it links to the radical's meaning.
- Sound section only if the radical is a sound part. Each row: kanji,
  word, reading in kana, English gloss.
- Sections that don't apply are left out. Both the meaning and the sound
  section are optional: shape-only radicals (丶 丿 亅 亠) have no meaning
  of their own, and most radicals aren't sound parts.
- No source is a source of truth (user, October 2026). Wiktionary,
  kanjium, sylhare, Anki and the rest are all references. We check
  claims against them, cite the ones we used, and write our own wording,
  never copied.
- Origins are stated plainly when references agree, and with "Some
  believe…" when they disagree (冬).
- No mnemonics, no outdated folk explanations (字 "a child under a roof"),
  no commentary.
- Plain and short.

Data catches:

- Every origin claim must be checked against cited references. Drafts
  written from memory were wrong 3 times out of 8 checks: in 客 and 字
  the 各/子 part gives the sound, not the meaning; 冬's origin is
  unclear; 降 is 阝 for meaning + 夅 for sound, so it isn't a 夂 example.
- Sound words must be read with the family sound. A kanji's sample word
  may not be (晴 → 晴れる はれる), so 晴天 せいてん is needed instead.
- A meaning example must be a kanji where the radical really is the
  meaning part. Being the kanji's dictionary radical isn't enough:
  kanji are often filed by shape (舍, the traditional form of 舎, is
  under 舌 "tongue" in Kangxi, but its meaning part is 口; 来 is under
  木 in Japanese, but began as a picture of wheat; per Wiktionary).
- kanjium's radical, sound-part and formation-type fields may suggest
  candidate kanji to check, but are visibly unreliable: it gives 舎 the
  radical 人 and the sound part 舎 (itself).
- A radical is never its own sound example. The sound-parts data points
  family heads to themselves (加 → 加), so the build must filter the
  radical out.

Decided (user, October 2026):

- The text lives in its own file,
  `raw-data/radicals/ours-popover-text.json`, keyed by glyph (everything
  that is ours is prefixed `ours`). Not in `ours.json`, which stays a
  small config file. Sound words (word, reading, gloss) are stored there
  too: words like 晴天 aren't in `vocab.json`.
- The popover is designed by building one, looking at it in the dev
  server and iterating.

Proposed, not decided:

- Field format, e.g.

  ```jsonc
  "宀": {
    "ja": "…", "cn": "…", "source": "https://en.wiktionary.org/wiki/宀",
    "meaning": "roof, house",
    "semantic": [{ "kanji": "客", "concepts": "guest, visitor", "why": "…", "source": "…" }],
    "sound": [{ "kanji": "晴", "word": "晴天", "reading": "せいてん", "gloss": "clear weather" }]
  }
  ```

- The app gets the text as its own generated file, loaded when a popover
  opens, so `radicals.json` (loaded for the drawer) stays small.
- Every radical gets text, in batches, most used first. 40 was only a
  first batch. Radicals without text show the popover as today.
- Popover extras: drop 3 (the popover already links to "Find kanji that
  include …"); 4 becomes the "Meaning:" line, written by us with sylhare
  and Anki as references, and the 🇨🇳 flag moves to the origin line; 5 is
  not shown, only used to suggest meaning examples; 6 becomes the sound
  section.
- Variants (extra 2): not the raw sylhare column (private-use glyphs that
  show as boxes, duplicate Kangxi codepoints like ⽻ for 羽, wrong ones like
  甩). Show "Also written: 氵 氺" from our `aliases` instead, if it's
  worth the space once the popover is built.

Open:

- Naming: if the 🇯🇵 line explains the Japanese name, chip names could
  become meanings ("roof" instead of "katakana u crown"). The user isn't
  sure; revisit once the popover exists.
- How many references must agree before a line is stated plainly: one
  (unless another disagrees) or at least two. Claude leans toward two.

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
  `kanji-composition-map.txt` (already in `raw-data/kanji-structure/external/scott.json`).
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
