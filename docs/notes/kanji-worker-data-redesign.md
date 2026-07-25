# Kanji worker + JSON data layout redesign

**Status:** implemented on `claude/kanji-worker-simplify-xgcr03`, except for
the one item listed under "Still to do" at the end (as of 2026-07-25).
**Supersedes:** the open question in `worker-main-thread-double-caching.md`.
**Scope:** `src/kanji-worker/`, `public/json/`, `raw-data/`, the data
generation pipeline, and the providers that feed kanji data to the UI.

This note records _how_ the plan was reached: the measurements taken, the
problems found in the data, the design principles that emerged, and the
alternatives that were rejected and why. It is meant to be readable by
someone who was not part of the discussion.

---

## 1. Where this started

`docs/notes/worker-main-thread-double-caching.md` flagged that several kanji
maps live both in the web worker (authoritative) and on the main thread
(copies), and deferred the fix with the advice: **"measure first — if the
maps are small in practice this may not be worth doing at all."**

The measurement was done against the static files in `public/json`:

- 17 JSON files, 2.1 MB total, 2,426 kanji.
- The duplicated maps are ~1–1.5 MB of JS objects in the worst case.

**Conclusion: memory duplication is not a problem worth a refactor.** But the
investigation surfaced the real problem, which the owner stated directly: the
kanji worker provider is _hard to read, fix, and extend_, and the JSON layout
was shaped by requirements that have since changed.

So the goal was restated:

> Make this area simple to read/fix/extend, and give the data a principled
> eager/lazy split with a correct, inspectable generation pipeline.

Two constraints were fixed early:

1. **The web worker stays.** It is why search/sort/filter are fast; removing
   it was proposed and explicitly rejected.
2. **`getKanjiBasicInfo` stays synchronous.** Evidence: `useItemBtnCn`
   (`kanji-item-button-hooks.tsx`) reads `frequency`/`jlpt` _during render_
   for every visible grid cell, and `ExpandedBtnContent` reads
   `on`/`kun`/`keyword`/representative word during render. Making these
   async would make every tile paint once uncolored and repaint when the
   promise resolves — visible pop-in on every grid paint, plus loading
   states in ~10 call sites.

---

## 2. Design principles

These were derived during the discussion, and every file decision below
follows from them.

### P1. The eager/lazy rule

> Data read **synchronously during tile render** — or reachable at first
> paint via URL-encoded sort/filter settings — is **eager**.
> Data behind a **user gesture** (hover, popover, drawer section, radical
> drawer, text search) is **lazy**, using the loading UI those surfaces
> already have.

Why today's layout violates it: sort comparators and filters read
`extended.jouyouGrade / strokes / wk / rtk / kklcIndex`, and sort/filter
settings are URL-reachable at first paint — so `kanji_extended.json` (302 KB)
is forced eager even though most of its content is hover/detail data. The fix
is to move those five fields into the main file, not to keep loading
everything.

### P2. File splitting — the actual cost model

Loading one JSON file costs: 1 RTT + gzipped bytes + decompress +
`JSON.parse` (proportional to **raw** bytes) + allocation. Memory after
parsing is identical however you split.

- With HTTP/2/3, K parallel requests ≈ one request's wall time; per-request
  overhead is tens of bytes of headers.
- Parse happens **inside the worker** here, so it never janks the UI; it only
  delays readiness. Measured: ~3 ms per 350 KB (desktop Node), ~25 ms for all
  17 files concatenated (2.1 MB). Expect 3–5× on mid-range phones.
- Therefore, at this app's scale (tens–hundreds of KB), **size almost never
  decides the split.** Load timing does.

Decision order: (1) load-timing groups — never bundle bytes a surface does
not need; (2) update lifecycle — data that changes together lives together;
(3) one concept = one file = one lazy dataset.

**Measured corollary (this surprised us twice):**

- Two files that share the same key set duplicate every key. When one side's
  payload is _small relative to its keys_, merging is strictly better:
  `kanji_main` + `kanji_rep_words` as separate files = 169.7 KB gz;
  merged per-kanji = **163.5 KB gz**. (~17 bytes of payload per rep-word
  entry vs a 3-byte key + quoting — keys were ~20% of that file.)
- The effect does **not** generalize. Merging `extended_general` +
  `extended_hover` (both substantial payloads) _increases_ size:
  127.8 KB gz split vs 129.1 KB gz merged, because homogeneous content
  compresses better per file.

The lesson recorded for future changes: **measure the specific pair; do not
assume either direction.** An earlier estimate here compared a wrapper object
(`{main: …, rep: …}`) instead of a true per-kanji merge and wrongly concluded
the split was free.

### P3. Tuple vs object

> **Dense data → positional tuple. Sparse/optional data → short-key object.**

Every kanji has a keyword, strokes and readings, so those files stay tuples
(smaller raw bytes = faster parse; they are already tuples today).
Structures and components have genuinely optional fields — per-source
coverage is 2,061–2,426, and `k`/`s`/`n` appear independently — so omitted
short keys beat null padding and stay readable.

Gzip makes key names nearly free (full names vs short keys vs tuple for the
structures file: 54 / 53 / 49 KB gz), so this is a readability decision, not
an optimization one.

### P4. One fact, one place — and what is _not_ duplication

Per-component facts (keyword, sounds, stroke count) live only in
`components.json`. Per-kanji records hold _references_ into it. Per-word
facts live only in `vocab.json`.

Two things that look like duplication but are not:

- **`parts` vs `kanji_decomposition.json`.** Measured: they differ for
  **2,150 of 2,426 kanji**. `parts` is the curated meaning breakdown shown as
  hover chips (五 → 一 + 力). `kanji_decomposition` is the _radical-search
  index_: it includes the kanji itself (五 → "五") and uses drawer-variant
  characters (六 → "ハ亠", katakana ハ, where `parts` has kanji 八). Deleting
  either breaks a different feature.
- **`phonetic` (per kanji) vs `s` (per component).** The former is an edge
  ("this kanji's phonetic component is 𠦝"), the latter is a node attribute
  ("𠦝 signals the sounds ちょう/かん"). Different relations.

### P5. Sources vs generated artifacts

`raw-data/` holds **inputs** (upstream release, extracted radical tables, the
four structure files, manual overrides). `scripts/generate-v2-json.mjs` is
the only writer of `public/json/v2/`. Nothing served is hand-maintained.
Re-splitting the data later becomes a script change, not a migration.

### P6. Characterization tests before refactoring

The hover/general assembly payloads cross the worker boundary and are
consumed through `as HoverItemReturnData` casts — the compiler cannot catch
drift. So the logic was first extracted **verbatim** into a pure module
(`src/kanji-worker/kanji-assembly.ts`) and pinned with snapshot tests against
the real `public/json` data _before_ anything else changes. Those tests run
against both v1- and v2-derived caches during the migration, which is what
makes the data regeneration provably behavior-preserving.

---

## 3. What the data audit found

Measured, not assumed:

| Finding                                   | Detail                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component keyword coverage                | 540 distinct non-kanji components are referenced across all datasets; **149 have a keyword, 391 do not** (the generated `component-coverage.json` is the authority on this count)                                                                                           |
| Where the gaps are                        | All 391 are referenced only by the structure files / phonetic maps. Every surface that currently _displays_ keywords (hover parts, radical drawer, decomposition search) is 100% covered                                                                                    |
| Keyword conflicts                         | **Zero** across `component_keyword.json`, `phonetic.json`, `moreRadicalKeywords`, `nonRadicalVariantKeywords` — consolidation is safe today                                                                                                                                 |
| `radicalFalseFriends` bugs                | `艹` maps to `" ⺾"` (leading space → that alias lookup can never match); `辶` is declared twice; 3 NFKC lookalike pairs exist beyond the manually tracked ones                                                                                                             |
| Structure files are heterogeneous         | hlorenzi = objects `{type, semantic?, phonetic?}` (2,244); kanjium = 5-tuples (2,426); scott / yagays = component arrays (2,061 / 2,356). Their exact types already exist in `src/lib/kanji-section-constants.ts`                                                           |
| Furigana compression is ambiguous         | The naive `会[かい]社[しゃ]` form cannot distinguish `あん` + `肝[きも]` from `あん肝[きも]` — **140 of 4,408 words fail** to round-trip. Anki-style, which puts a space before a bracketed segment that follows a plain one (`あん 肝[きも]`), round-trips **4,408/4,408** |
| Frequency index oddity                    | In `transformToMainKanjiInfo`, freq index 3 populates field `kd` but is commented `rank_wkfr`, and index 15 populates `wkfr` commented `rank_kd` — crossed. **Preserved verbatim**; "fixing" it would silently change displayed rankings                                    |
| Dead data                                 | `rtkb` is declared on `GeneralKanjiItem` but never reaches any runtime payload (pinned by test); `_rtk_old` is already discarded by the v1 transform; `kanjiMainInfoCache` / `kanjiOtherInfoCache` in `helpers.ts` have zero references                                     |
| Duplicate download                        | `similar-kanjis.json` is fetched by the worker _and_ independently by `production-practice-v1/Game.tsx`                                                                                                                                                                     |
| Type bugs found while typing the protocol | `fetchPhoneticInfo` was typed `Record<string,string>` but the data is `Record<string,string[]>`; `wordPartDetails` was typed `string[][]` but is `[string, string?][]`                                                                                                      |
| Navigation regression                     | `KanjiListWithSearch` unmounts on route change, so returning to `/` restarts `useWorkerQuery` from idle and re-shows `LoadingKanjis` although nothing changed                                                                                                               |
| Radical drawer freeze                     | Not the search (already in the worker). It is main-thread render: `RadicalsResultsPreview` renders every match unvirtualized, ~200 `RadicalBtn`s re-render unmemoized, and the list screen behind the dialog re-renders too                                                 |

---

## 4. Resulting file layout

All served files live in `public/json/v2/`, snake_case. Sizes are raw / gzip,
measured from current data.

**Eager — 1 file, 389 KB / 163 KB gz** (down from an effective
747 KB / 365 KB before this change):

- `kanji_main.json` — keyword, on, kun, jlpt, 19 frequency ranks, strokes,
  jouyou grade, WK level, KKLC index, RTK index, representative word +
  reading. Everything a tile paints synchronously, and every sort/filter
  field. Shipped once to the main thread as the sync snapshot.

**Lazy — one dataset each, fetched on the gesture that needs it.** Sizes are
gzipped, which is how they go over the wire:

| File                          | Size (gz) | Fetched when                                                                                                                                                  |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kanji_extended_general.json` | 84 KB     | a meaning/reading text search runs, or the details "General Information" section renders                                                                      |
| `kanji_extended_hover.json`   | 41 KB     | the first hover card opens                                                                                                                                    |
| `vocab.json`                  | 127 KB    | the first hover card or vocab popover opens                                                                                                                   |
| `components.json`             | 3 KB      | the init snapshot is built (it answers component keywords for synchronous lookups)                                                                            |
| `rep_word_details.json`       | 60 KB     | a gloss or emoji tag is displayed: hover card, details study word, practice deck                                                                              |
| `kanji_structures.json`       | 50 KB     | the "Character Structure" section is expanded                                                                                                                 |
| `kanji_reading_details.json`  | 41 KB     | the "Reading Usefulness" section is expanded                                                                                                                  |
| `kanji_decomposition.json`    | 19 KB     | a **radical** search runs. Multi-kanji and handwriting searches do **not** use it — they match the kanji characters in the query directly (`kanjiListSearch`) |
| `similar_kanjis.json`         | 43 KB     | a similar search runs, **or** the "Character Structure" section opens (it lists similar kanji via `useSimilarKanjis`), or the practice game starts            |
| `cum_use.json`                | <1 KB     | the dashboard's cumulative-use chart mounts (main thread, never through the worker)                                                                           |

---

## 5. Generated file manifest

`pnpm run generate-json` (`scripts/generate-v2-json.mjs`) reads **only**
`raw-data/` and writes **only** the files below. Nothing else in the tree is
touched, and the script fails without writing if the data breaks an invariant.
Every one of these files is committed, so the manifest doubles as a checklist:
after a regeneration, exactly these paths should appear in `git status` and no
others.

Sizes are raw / gzip (`gzip -9`, which is roughly what a CDN serves), measured
from the data currently committed.

### Served from `public/json/v2/` — 11 files

| File                          | Raw    | Gzip   | Entries | Loaded |
| ----------------------------- | ------ | ------ | ------- | ------ |
| `kanji_main.json`             | 389 KB | 163 KB | 2,426   | eager  |
| `vocab.json`                  | 308 KB | 127 KB | 4,408   | lazy   |
| `kanji_structures.json`       | 322 KB | 50 KB  | 2,426   | lazy   |
| `kanji_extended_general.json` | 237 KB | 84 KB  | 2,426   | lazy   |
| `kanji_reading_details.json`  | 229 KB | 41 KB  | 2,134   | lazy   |
| `rep_word_details.json`       | 154 KB | 60 KB  | 2,348   | lazy   |
| `similar_kanjis.json`         | 120 KB | 43 KB  | 2,426   | lazy   |
| `kanji_extended_hover.json`   | 115 KB | 41 KB  | 2,426   | lazy   |
| `kanji_decomposition.json`    | 48 KB  | 19 KB  | 2,426   | lazy   |
| `components.json`             | 9 KB   | 3 KB   | 390     | lazy   |
| `cum_use.json`                | 2 KB   | <1 KB  | 7       | lazy   |

The raw column is what `pnpm run generate-json` prints; the gzip column is
`gzip -9`.

Entry counts are not all 2,426 on purpose: `kanji_reading_details` covers only
kanji that have a reading breakdown (2,134), `rep_word_details` only kanji with
a representative word (2,348), `vocab` is keyed by word rather than kanji
(4,408), `components` holds non-kanji components only (390), and `cum_use` is
keyed by frequency source (7).

### Not served — 1 file

| File                                | Raw   | Gzip | Contents                                                                          |
| ----------------------------------- | ----- | ---- | --------------------------------------------------------------------------------- |
| `docs/data/component-coverage.json` | 40 KB | 2 KB | `{summary: {referenced, withKeyword, missing}, missing: [{char, refs, sources}]}` |

The coverage report is committed but never fetched by the app. It is JSON
rather than markdown so it is diffable and so a unit test can assert the gap
count never grows — filling a keyword gap shrinks `summary.missing`, and
introducing a new uncovered component makes the test fail. Current state:
540 components referenced, 149 with a keyword, 391 without.

`public/json/v2/` now holds every JSON the app fetches — the five v1
`kanji-structure-*.json` / `kanji-readings-details.json` files that used to sit
in `public/json/` are gone, and their inputs live only in `raw-data/`.

`public/json/katakana/challenge-set-<N>.json` is also generated, but by a
separate script (`generate-speed-katakana.mjs`, run as part of `pnpm build`)
and is gitignored rather than committed.

---

## 6. Decisions and rejected alternatives

| Decision                                                                                    | Rejected alternative                                           | Why                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep the web worker                                                                         | Remove it, run search on the main thread                       | It is the reason search/sort/filter feel instant                                                                                                                      |
| `getKanjiBasicInfo` stays sync, fed by a one-time snapshot                                  | Make it async                                                  | ~10 render-time call sites would need loading states; the grid would paint uncolored then repaint                                                                     |
| Representative word (word + reading) **merged into** `kanji_main`                           | Keep as its own eager file                                     | Same upstream provenance (same release tarball), same load timing, and measured **6 KB gz smaller** merged because the 2,426 keys stop being duplicated               |
| Gloss + emoji tag split out as lazy `rep_word_details`                                      | Keep all four rep-word fields eager                            | Expanded tiles use only word + reading; gloss/tag are used only on hover, details and practice — 60 KB gz deferred                                                    |
| Extended split into general + hover                                                         | One extended file                                              | Different surfaces, different timing: hover-only users fetch 43 KB instead of 129 KB. Costs 1.3 KB gz vs merging — accepted                                           |
| 4 structure files merged into 1, short keys                                                 | Keep 4 files / positional tuple / full names                   | Always displayed together → 1 request instead of 4 (66 → 53 KB gz). Short keys chosen for readability; the ≤5 KB gz difference between shapes is not worth optimizing |
| `vocab_furigana` + `vocab_meaning` merged, furigana as Anki-style string                    | Keep two files; naive `会[かい]社[しゃ]` encoding              | Already always fetched together; naive encoding is ambiguous for 140 words                                                                                            |
| One `components.json` registry, built by script, with keywords pre-resolved through aliases | Leave the 5 sources scattered; or merge-only without overrides | Answers "where is this component's keyword?" in one lookup. Overrides file gives one place to fix gaps; the coverage report makes gaps visible and prioritized        |
| Coverage report as JSON                                                                     | Markdown                                                       | Structured, diffable, and testable — enables a non-regression ratchet                                                                                                 |
| **This PR fills zero of the 390 missing keywords**                                          | Auto-fill them                                                 | There is no authoritative source for keywords like 尞/冓/咼; inventing them is a content decision for the owner                                                       |
| Eager loading measured by concept, not habit                                                | Status quo                                                     | Structures + reading details were being fetched even for users who never open those sections                                                                          |

---

## 7. Deliberate behavior changes

Each is called out in the commit that introduces it:

1. Fixing `艹 → " ⺾"` makes a previously-failing keyword lookup succeed.
2. Jouyou-grade tile borders paint on first render instead of popping in
   (grade moves from an async request into the sync snapshot).
3. Returning to a route no longer flashes `LoadingKanjis`.
4. The first-ever hover pays a one-time lazy fetch behind the existing hover
   loading state; subsequent hovers are one round trip.
5. The radical drawer's results strip is virtualised with `virtua`'s
   `VList horizontal` — the same library the main kanji list already uses. Every
   match stays scrollable; only the visible window is mounted. Verified against
   the previous layout in a browser: item width (124px) and total scroll width
   (3,712px for 29 matches) are identical, with 11 items mounted instead of 29.
6. Speed-katakana challenge sets and core kanji data now use separate service
   worker caches, so heavy katakana play no longer evicts `kanji_main.json`.

---

### A design rule this produced

**The worker owns its datasets; the main thread asks about one kanji.**

The detail-section requests were first written to return the whole map, on the
reasoning that the drawer moves between kanji so one round trip would beat many.
That was wrong twice over. It put a second copy of a 2,426-entry map on the main
thread — the duplication this whole note started from — and it was inconsistent
with `kanji-hover`, `kanji-general` and `kanji-similar`, which the same drawer
already asked per kanji.

It also produced a symptom that was easy to misread as unrelated: because a
collapsed accordion unmounts its body, every re-expand re-cloned the whole map
across the boundary, which then needed a main-thread memo to paper over. The
per-kanji version deleted that memo. **A fix that requires a cache to stay fast
is worth re-examining** — the cache was evidence the payload was wrong, not that
it needed caching.

Whole-map replies are still right for `similar-map` (the practice game needs
many kanji at once) and `component-map` (keywords are read synchronously during
render). The test is whether a caller genuinely needs many entries at once, not
whether it might need them eventually.

---

## 8. Process notes

- **Rebase first.** The branch was reset onto current `main` before any work,
  and the plan's file references re-verified afterwards.
- **One PR, many small commits**, each independently green
  (`test`, `lint`, `tsc -b`). Characterization tests land first; data
  generation lands before any consumer switches to it; v1 files are deleted
  only in the final commit, so every intermediate commit runs.
- An early implementation attempt was started before the plan was agreed and
  was halted; only the characterization-test commit was kept. The staged
  commit sequence exists so review can happen per concept rather than on one
  large diff.
- **Two claims in this note were wrong and were caught by reading the code
  rather than by any test.** Both are recorded because the pattern matters
  more than the individual errors:
  - This note stated that the structure and reading-detail files "load
    eagerly on the main thread". They never did — `createKanjiLookupProvider`
    fetched from a `useEffect` in its first consumer hook, and both consumers
    sit inside collapsed accordions. The justification for moving them into
    the worker is the parse location and the four-requests-instead-of-one, not
    eager bytes. Nothing guarded the accordion behaviour the laziness rests
    on, so `SimpleAccordion.test.tsx` now pins it: `forceMount`, or any
    accordion that hides its body with CSS instead of unmounting it, would
    silently make every detail drawer fetch every dataset.
  - The generator reported file sizes using `json.length` — UTF-16 code units,
    not bytes — understating every file by ~25% on this mostly-Japanese data.
    Sizes quoted in a design document need to say which tool produced them,
    which the tables here now do.
- **Environment caveat:** `pnpm install` cannot fetch `kanjicanvas` in a
  sandboxed agent environment. `package.json` points at
  `github:asdfjkl/kanjicanvas`, the package is not on npm, and GitHub source
  archives are served from `codeload.github.com`, which returns 403 for
  repositories not attached to the session — independently of the environment's
  network-access level. Workaround used here: install from a locally built
  tarball of the pinned commit, then restore `package.json` and the lockfile.

  Measured, for whoever fixes this properly: the full test suite passes without
  the package (it is dynamically imported behind one handwriting backend), and
  only `vite.config.ts`'s `copyRefPatterns` needs it, via an unconditional
  `copyFileSync`. So making it an `optionalDependency` and letting that plugin
  skip-with-warning — while hard-failing when `CI` is set, so a fetch failure
  cannot silently ship a build without handwriting recognition — removes the
  problem for every environment. Vendoring is the alternative and is worse:
  `ref-patterns.js` is 6.7 MB raw / 2.4 MB gzipped, permanently in git.

---

## 9. Out of scope / future work

- Filling the 390 missing component keywords (tracked by the coverage report).
- `extra_kanji_keyword.json` (44 entries): wire into the registry so
  out-of-set kanji in sample vocabulary stop rendering `"..."`.
- `filtered_kanji.json`: referenced nowhere in `src/` or `scripts/` — confirm
  with the data owner before removing.
- The crossed `kd` / `wkfr` frequency indices: decide whether the field names
  or the comments are wrong, then fix deliberately.
- Deeper radical-search UX restructure (beyond the render-perf fixes).
- **PWA cache audit — done, and it found a pre-existing problem, now fixed.**
  The v2 files needed no config change: `globPatterns` is `**/*.{js,css,html}`
  so no JSON is precached, and the runtime rule `/\/json\/.*\.json$/i` already
  matched `/json/v2/...` because `.*` spans the directory segment. But that
  rule's cache was capped at `maxEntries: 50` while the app can fetch **211**
  distinct JSON URLs: 11 data files plus 200 `challenge-set-<N>.json` for
  speed-katakana. Sharing one LRU meant playing enough katakana evicted
  `kanji_main.json`. Under `StaleWhileRevalidate` that is not a correctness bug
  — the file is refetched — but it quietly defeated the offline support the
  comment above the rule claims to provide. It predated the redesign (17 v1
  files + 200 sets was the same situation), so it was not a regression.
  Resolved by splitting into two caches that cannot evict each other: core data
  at 30 entries, challenge sets at 50.

---

## 10. Still to do

Everything in this note shipped. What remains is owner decisions from §9, none
of which are code-blocked and all of which the owner is handling separately:
filling the 391 component keyword gaps, wiring `extra_kanji_keyword` into the
registry, confirming `filtered_kanji.json` can go, deciding what to do about the
crossed `kd` / `wkfr` frequency indices, and any deeper radical-search UX
restructure.

One flake worth knowing about, unrelated to these changes: the e2e case
"radical search opens its drawer" occasionally times out waiting for the dialog
under parallel load. It passes in isolation and on re-run, and it only
opens and closes the drawer, so it is a test-timing issue rather than a
symptom — but it is the kind of thing that looks like a real failure in CI.
