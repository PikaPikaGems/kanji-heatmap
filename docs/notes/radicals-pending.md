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
- Radicals that are also kanji (王, 火, 車) keep their kanji link. To be
  replaced by step 3 of the plan (the link moves into the radical popover).
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

### Plan (user, October 2026)

One step at a time, in this order. Each session picks up the next
unchecked step.

- [ ] **Step 1 — radical popover information** (item 2 below,
      "Radical popover text").
  - [x] 1a. Settle the popover rules (October 2026).
  - [ ] 1b. (In progress: first version with 宀 夂 冫 广 隹 青.) Build the
        popover in the dev server with 3–5 checked
        entries and iterate on the design (also try variants).
  - [x] 1c. Fill in every radical (252, every glyph with radical info), in
        PikaPikaGems/kanji-heatmap#311, followed by one review pass.
        Meaning and sound examples were picked by code from Wiktionary's
        glyph-origin role markers (see "How 1c was done" below).
- [ ] **Step 2 — radical keyword** (chip names, "Why we're revisiting
      the radical names" below). Decided once the popover exists.
- [x] **Step 3 — every radical opens the radical popover**, also
      radicals that are kanji (夕), with "Find kanji that include 夕" and
      "📖 Open kanji 夕 (evening)". Done in PikaPikaGems/kanji-heatmap#311
      (moved ahead of 1c): the build keeps radical info for every kanji
      radical (149 → 252 glyphs), and chips check "is it a radical?"
      before "is it a kanji?". This replaces the earlier decision that
      kanji radicals keep their kanji link; the extra tap is fine (user).
- [ ] **Step 4 — component search** (item 3 below).

### 1. Sound info feature

Split in two (user, October 2026):

- **1A — sound part coverage. Done and merged**
  (PikaPikaGems/kanji-heatmap#307, October 2026). The build
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

Popover layout (user, October 2026; supersedes the one-block shape below):
the popover is a bold summary (🇯🇵 name, 🇨🇳 English words with 🧠 when it
has meaning examples, 📍, 🔊 sounds) and a "view radical details →" link,
then "Find kanji that include …" and, for kanji radicals, "📖 Open kanji 夕
(evening)". The details open in a dialog with one heading per part:
🇯🇵 Japanese name, 🇨🇳 Origin, 🧠 Semantic, 🔊 Phonetic, Sources. (Showing
the details inside the popover was too cluttered.)

Dialog sections now (user, October 2026): 🇯🇵 Japanese name (with the
position, also on the popover's 🇯🇵 line), 🇨🇳 Chinese meaning (the
English words, then why the glyph means them), 🧠 Meaning hint and 🔊 Sound
hint (each opens with "A few kanji…", since the examples are not a full
list), 🧩 Other forms (only when there are other forms), 📚 References.

Shape, per radical (every section only when it applies):

    <RADICAL>
    🇯🇵 <Japanese name>, <chip keyword> · <reason for the name>
    📍 <position> (<English>)
    🇨🇳 <sylhare words>, <our added words> · <Chinese origin>
    <meaning examples>: <kanji> · <concepts> · <how it links>
    <sound examples>:   <kanji>, <word>, <reading>, <gloss>

    宀
    🇯🇵 うかんむり, katakana u crown · It looks like katakana ウ (u) and
       sits on top as a crown (かんむり).
    📍 かんむり (top)
    🇨🇳 roof, house · Began as a picture of a house.
    客 · guest, visitor · Someone received under your roof.
    宿 · lodging, inn · Began as a person resting on a mat; the roof
       marks it as indoors.

    Sound examples, e.g. 隹 (sound すい, from the sound-parts data):
    推, 推進, すいしん, propulsion, promotion

Data:

- The text lives in `raw-data/radicals/ours-popover-text.json`, keyed by
  glyph (everything that is ours is prefixed `ours`). Format, all fields
  optional:

  ```jsonc
  "隹": {
    "ja": "ふる (old) + とり (bird): the bird part of 舊, the old form of 旧 (old).",
    "jaRefs": ["…"],
    "addEn": "…",
    "cn": "A picture of a short-tailed bird, like a sparrow.",
    "refs": ["https://en.wiktionary.org/wiki/隹", "…"],
    "semantic": [
      { "kanji": "雄", "concepts": "male, brave", "why": "First meant a male bird.", "refs": ["…"] }
    ],
    "sound": [
      { "kanji": "推", "word": "推進", "reading": "すいしん", "gloss": "propulsion, promotion", "refs": ["…"] }
    ]
  }
  ```

- Japanese name and 📍 position: sylhare, as today.
- 🇨🇳 English words: sylhare's words first, then `addEn` (a comma
  string), without duplicates. Nothing is overridden (夂 → "to follow,
  go").
- The chip keyword is a separate thing from the 🇨🇳 English words.
- The sound itself comes from the sound-parts data (#307). Our file holds
  only the example words, since words like 晴天 aren't in `vocab.json`.
- The app gets the text as its own generated file, loaded when a popover
  opens (proposed; settle in 1b).

Rules:

- 🇯🇵 format (user, October 2026): each part as kana (kanji, English),
  joined with +; a position part as kana (position in English): "さん (三,
  three) + すい (水, water)", "て (手, hand) + へん (left side)". Shape
  names: "Written like katakana ワ (wa) + かんむり (top)". A short
  explanation may follow a colon. Positions in English match the 📍 line:
  へん left side, つくり right side, かんむり top, あし bottom, たれ
  top-left, にょう bottom-left, かまえ enclosure, がしら top.
- 🇯🇵: only the reason, without repeating the name. Shape reasons
  (looks like ウ; のまた is written ノ + 又) need no reference. History
  reasons (まだれ's ま from 麻; ふるとり from 舊) need references.
- Every radical gets a 🇯🇵 reason, also when the name is just a word or
  the kanji's own reading (ほこ, あお): say what the word means ("ほこ: the
  word for spear"). A non-native reader can't tell otherwise (user,
  October 2026; replaces "name only"). A word's meaning needs no
  reference: it's a dictionary meaning, like the word glosses we already
  show (user).
- 🇨🇳: the Chinese origin of the glyph.
- No source is a source of truth. Wiktionary, kanjium, sylhare, Anki and
  the rest are all references. One reputable reference, linked, is
  enough (user, October 2026): the link lets readers check it. Hedge
  ("Some believe…") when that reference shows disagreement (青, 冬); add
  a second reference only when a claim looks surprising. Our own
  wording, never copied. Reputable for 🇨🇳 lines and examples:
  Wiktionary's "Glyph origin" sections. For 🇯🇵 history reasons:
  Kanjipedia (漢字ペディア) or Japanese Wikipedia.
- Meaning examples: 2–3 kanji where the radical really is the meaning
  part, each with concepts and how it links. Never just one: a single
  example shows no pattern (user, October 2026), so a radical with only
  one gets none. Same for sound examples. The build enforces it. No separate "Meaning:" line; the 🇨🇳 line carries the meaning.
- Sound examples: 2–3, never the radical itself, and the word must be
  read with the family sound. They are learner hints, the same as the
  sound-part chips (user, October 2026: what matters is that it helps
  learners): the kanji's sound part in our sound-parts data is the radical,
  whatever its history (戈 in 裁 さい, though Wiktionary gives 𢦏). No
  reference needed. The dialog section is "🔊 Sound hint", not
  "Phonetic", so it claims no history; the popover shows 🔊 only when the
  dialog has examples.
- Both example sections are optional: shape-only radicals (丶 丿 亅 亠)
  have no meaning of their own, and most radicals aren't sound parts.
- No mnemonics, no outdated folk explanations (字 "a child under a
  roof"), no commentary. Plain and short. `·` separates a name from its
  text; `→` is kept for meaning shifts inside the text.

Popover extras (above): 2 (variants) is tried in 1b, from our `aliases`,
never sylhare's raw column (private-use glyphs, duplicate Kangxi
codepoints, wrong ones like 甩); 3 is dropped (the popover already links
to "Find kanji that include …"); 4 is the 🇨🇳 words rule above; 5 is a
candidate list only; 6 is the sound examples.

Data catches:

- Drafts written from memory were often wrong: in 客, 字 and 庫 the
  各/子/車 part gives the sound, not the meaning; 冬's origin is unclear;
  降 is 阝 for meaning + 夅 for sound, so it isn't a 夂 example; ⺌ is
  しょうかんむり in our data, not つかんむり.
- A kanji's dictionary radical isn't always its meaning part: kanji are
  often filed by shape (舍, the traditional form of 舎, is under 舌
  "tongue" in Kangxi, but its meaning part is 口; 来 is under 木 in
  Japanese, but began as a picture of wheat; per Wiktionary).
- kanjium's radical, sound-part and formation-type fields may suggest
  candidates, but are visibly unreliable: it gives 舎 the radical 人 and
  the sound part 舎 (itself).
- A kanji's sample word may not use the family sound (晴 → 晴れる
  はれる), so sound words are picked by hand (晴天 せいてん).
- The sound-parts data points family heads to themselves (加 → 加), so
  the build must filter the radical out of its own sound examples.

How 1c was done: Wiktionary pages for all our kanji and radicals were
downloaded once (MediaWiki API) and each kanji's `{{Han compound}}`
template read: in a phono-semantic compound (`ls=psc`) each part is marked
semantic (`s`) or phonetic (`p`); in an ideogrammic compound (`ls=ic`)
every part carries meaning. A meaning example had to be marked that way
for the radical (or its full form, 氵 → 水) and contain the radical in our
radical-search index; a sound example had to be marked phonetic for the
radical and have a word in our vocab data read with the family sound.
Concepts come from our kanji meanings. Origins and reasons were written by
hand from the glyph-origin text. The review pass rewrote "why" lines that
only restated the meaning, fixed odd concepts and long glosses.

Gaps: filled in October 2026 from Japanese Wikipedia's radical pages
(巾部, 酉部, 刀部, 心部, 己部, 亅部, 丿部, 耒部; the 🇯🇵 reasons and the
shape-stroke origins), Wiktionary (麥, 黃, 齒, 丨, 彐) and 漢字ペディア (龍).
Left: no 🇨🇳 origin for 𠂉 マ ユ, katakana-like shapes with no history as
characters of their own.

Sound-parts data to check (found while writing the popover text; not
changed, since sound parts are learner hints, see item 1):

- 省 is listed under 小 (しょう). Wiktionary: its sound part was 生, which
  became 少 over time; 小 isn't part of it. Not used as a 小 example.
- 裁 載 栽 are listed under 戈 (さい). Wiktionary marks none of them with
  戈 as the sound part (it is 𢦏).

Revisit later (user, October 2026; redundant on purpose for now):

- When the radical is the sound part of the kanji on screen (戈 in 裁),
  its popover shows the "Sound hint" box and the 🔊 line.
- The dialog's "🧠 Meaning hint" line repeats the 🇨🇳 words. An optional
  `semanticMeaning` field ("weapon") could replace it.

Settled: with sounds but no example words, the summary shows 🔊 and the
dialog leaves out the Phonetic section. The dialog heading is the radical
alone.

Open:

- Naming (step 2): if the 🇯🇵 line explains the Japanese name, chip
  names could become meanings ("roof" instead of "katakana u crown").
  Revisit once the popover exists.

#### Forms and families (decided with the user, October 2026)

Three kinds of "same radical":

- **Alias**: the same shape under another character code (⿊ = 黒,
  氵 = ⺡). Merged; never shown on its own.
- **Form**: a different shape of the same radical (水, ⺡ さんずい, 氺
  したみず). Its own entry, linked in the dialog's 🧩 Other forms section.
- Old forms (黑 艸 戶 齒 龜) are not labeled: no source says which
  alternates are old forms. They work through their alias (tapping 黑
  shows 黒). Glyphs the app never shows (户 靣 髙 ⿊ …) are dropped.

Families come from sylhare's Alternate column (raw-data/radicals/README.md,
"Families"); `familySkips` and `familyHeads` in ours.json hold the
exceptions. Per field:

- Japanese name, position, meaning and sound examples: **per form**. An
  example sits under the form it is written with (泳 under ⺡, 雪 under ⻗);
  the build checks this with kanjium's radical slot
  (`kanjiumFormFixes` corrects it, e.g. 燃).
- Origin: **shared**. A form shows its head's `cn`, then its own
  `cnNote` ("Written as three strokes on the left side."). A form whose
  story differs has its own `cn` (𠆢, ⺩).
- 🧩 Other forms lists the family's other glyphs; the dialog switches to
  a form when it is tapped. Name-only rows (方 on the left is ほうへん, 木
  is きへん) have no glyph of their own, so they are not forms: the head's
  🇯🇵 section shows them as "Also called ほうへん · へん (left side)". A radical with no other forms has no section; its
  position is on the 🇯🇵 line.

老 is named おい (an `extras` entry in ours.json); it used to inherit
おいかんむり from 耂's CSV row.

#### "Why" lines and example counts (October 2026)

Rule: a meaning example's line names the radical in parentheses and how it
links: "Silver is a metal (金).", "Hearing is done with the ear (耳)."
Naming the sound part is only for when it explains something (視).

Wiktionary's shinjitai pages (状, 献, 獣, 触) often have no glyph origin;
it is on the traditional form (狀, 獻, 獸, 觸). Checking those found more
examples.

漢字ペディア (kanjipedia.jp, by the 日本漢字能力検定協会) is a second source
(user, October 2026: any reputable source we can link to; Japanese is
fine). Its origin text (成り立ち) is from 『角川新字源 改訂新版』, one page
per kanji, linked as https://www.kanjipedia.jp/kanji/<page number>. It
explains links Wiktionary only marks (術: a village lane, "technique"
borrowed), and brought 乙 白 十 工 辰 ⺲ 行 角 革 虍 骨 鹿 文 至 to two or three
examples. The dialog labels its links by kanji.

Radicals still without meaning examples though they have kanji in our
list: neither source names the radical as the meaning part with a link we
can state (片 版, 瓦 瓶, 舛 舞, 耒 耕, 毛 尾/毬 and 卜 占 have one each; 匚
匠: 漢字ペディア says 匚 there is a changed 矩, not "box"; 臣 臨: 漢字ペディア
says 臥). The other 39 have no kanji filed under them (鼎 鼠 竜 …).

Sound parts with no examples, and why: only one other kanji in the
family (十 汁, 比 批, 高 稿, 匕 死, 犬 献, 竹 築, 耂 考, 面 麺), or the
other one is rarely read with the sound (里: 鯉 り).

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

Decided (user, October 2026):

- It sits **next to** radical search and does not replace it: the two
  sources give different results. Of the 224 drawer glyphs that are also
  sph-mn components, only 55 return the same jōyō kanji. They also write
  parts differently (sph-mn uses 氵 八 ⺮ 灬 where the drawer has ⺡ ハ 竹 ⺣),
  so the component drawer shows sph-mn's own glyphs and the two searches
  aren't linked by glyph without a mapping.
- Missing keywords and stroke counts are simply not shown. Components
  with no stroke count go in a "?" group. Jōyō-only coverage is fine.
- Component Breakdown (Character Structure) gets one more row,
  `(sph-mn)`, like the other sources: every part found inside the kanji,
  at any depth, flat. Built by flipping the ck file.
- Non-radical parts (寺 in 時) could later open a popover with "Find kanji
  that include 寺" through component search, matching step 3.

### 3b. Which parts list the reference card shows

Open (user, October 2026). The reference card at the top of a kanji page
shows the TopoKanji parts list (the release's `kanji_extended.json` field 0,
the same data as the `(TopoKanji)` row in Component Breakdown). It writes
some parts differently from the Character Structure sources: grass (艹) is
written 廾, so on 茶 and 花 the chip opens 廾 にじゅうあし ("twenty legs")
instead of くさかんむり. That is correct under "show source data as is";
the question is which source the reference card should feature (one of
the Character Structure sources, or our own list).

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
- **Radical info for drawer-only parts (e.g. 勿).** 勿 is in the radical
  drawer (`rewhowe-drawer.json`) but not in `sylhare-radicals.csv`, which
  lists only the 214 Kangxi radicals (dictionaries file 勿 under 勹). So it
  has no radical info: its popover shows only the keyword "must not", with no
  🇯🇵 name, no 🇨🇳 line and no "Learn more" dialog. Option: add our own info
  for it in `raw-data/radicals/ours.json` (a Japanese name, plus popover text
  in `ours-popover-text.json`). Origin, checked October 2026: Wiktionary says
  blood on a knife (the original 刎), borrowed for "do not" since oracle-bone
  times; 漢字ペディア (新字源) says a snapped bowstring, plucked to ward off
  evil, hence prohibition. In 物, 勿 is the sound part (Wiktionary). Same
  question applies to other drawer-only parts (啇, 奄, …).

## Working rules

- Run `pnpm exec prettier --check .` before finishing (see `CLAUDE.md`), plus
  `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`.
- After changing data or the build, run `pnpm run generate-json` and commit the
  regenerated `public/json/v2/` and `docs/data/` files.
- For refactors, prove nothing changed on screen: snapshot every glyph's
  keyword, radical info and search target before and after, and diff.
- Keep it simple. The user prefers small, explained steps and decides
  anything that changes what users see.
