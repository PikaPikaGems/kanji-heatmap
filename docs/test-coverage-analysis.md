# Test Coverage Analysis & Recommendations

_Analysis date: 2026-07-22_

## Summary of current state

| Metric | Value |
| --- | --- |
| Non-test source files (`.ts`/`.tsx`, excl. `.d.ts`) | **424** |
| Colocated unit/integration test files | **30** |
| Total unit test cases (`it`/`test`) | **~201** |
| Playwright e2e spec files | **12** |
| Coverage tooling installed | **none** (`@vitest/coverage-*` absent) |
| Coverage gate in CI | **none** |

The project has a healthy testing _foundation_: Vitest + Testing Library are
configured, there is a real e2e suite with a documented test plan under
`e2e/test-plan/`, and CI (`.github/workflows/ci.yml`) runs `pnpm test` and
`pnpm test:e2e` on every PR. The existing unit tests are also well-targeted —
they concentrate on genuinely tricky logic (`kanji-search`, `search-input-logic`,
`speed-katakana-match`, `use-sort-and-filter-form`).

The gap is **breadth**: only ~30 of 424 modules have a colocated test, and
several _correctness-critical, pure-logic_ modules — the exact kind that are
cheap to test and expensive to get wrong — have zero coverage today. There is
also no way to _measure_ coverage, so regressions in tested areas can slip.

---

## Priority 1 — Untested pure logic that is correctness-critical

These are pure functions (no DOM, no network) with clear inputs/outputs and
non-trivial branching. They are the highest value-per-effort tests to add.

### 1a. Activity / dashboard math — `src/lib/activity/` (0 tests across 8 files)
The entire activity subsystem that powers the Dashboard heatmap is untested.

- **`dates.ts`** — calendar-grid construction (`buildCalendarWeeks`,
  `monthLabelsForWeeks`), duration navigation (`shiftDuration`,
  `canGoPrev/NextDuration`), and date-key round-tripping
  (`toLocalDateKey` ⇄ `parseLocalDateKey`). These are full of off-by-one and
  boundary hazards (Sunday alignment, leap years, `-364` day windows, month
  rollover). Table-driven tests would lock the grid layout down.
- **`queries.ts`** — `summarizeActivityInRange`, `countAllDaysActive`,
  `maxDayTotalInRange`, and especially `getActivityLevel(n, maxN)` whose
  0/25/50/75/100% band thresholds drive heatmap intensity.
- **`cpm-band.ts`** — `cpmToBand` boundary values (0, 29→30, 69→70, 119→120)
  and `countBands`.
- **`storage.ts`** — `recordActivity` increments both all-time and per-day
  counters and sets `cakeDay` once; verify with a mocked `localStorage` + fixed
  `Date`.

### 1b. Search-result assembly — `src/lib/results-utils.ts`
`getFinalResults`, `hasNoFilters`, `shouldShowAllKanji`, and `isEqualFilters`
encode the core "what does the list show" rules (multi-kanji dedupe, keyword
client-sort, filter-equality short-circuits). Subtle and central to the app; no
test today.

### 1c. Practice answer-grading
- **`recognition-practice-v1/match-reading.ts`** — `isReadingCorrect` /
  `buildAcceptedReadings` decide whether a user's answer is correct, including
  romaji↔kana normalization, `・`-split readings, and the IME "trailing partial
  romaji" trim. Wrong-answer marking is the worst UX bug a quiz can have.
- **`lib/dakanji-grade.ts`** — `getGradeBand` / `gradeMessage` / `feedbackTitle`
  branch on the model's top-10 rank (including the `rank === -1` "missing" case).
  Pure string logic, trivially testable, user-visible.
- **`production-practice-v1/build-candidates.ts`** — distractor generation.

### 1d. Frequency & grade categorization
- **`lib/freq/freq-category.ts`** — `getFreqCategory` is a nested-ternary over
  boundary ranks (350/750/1200/1800, plus `null`/`<1`/`Infinity`). Classic
  boundary-test target.
- **`lib/jlpt.ts`, `lib/jouyou-grade.ts`, `lib/dakanji-adapter.ts`** — option
  lists and adapters used by filters.

### 1e. Filter primitives
- **`lib/selection-filter.ts`** (`isSelectionFilterActive`,
  `matchesSelectionFilter`) and **`lib/client-list-filters.ts`**
  (`needsClientListFilters`, `applyClientListFilters` — note the "return `[]`
  when anchor set not yet loaded" branch). Small, pure, and directly gate what
  the user sees.
- **`lib/bookmarks.ts`** — key format + `isBookmarked` round-trip.

---

## Priority 2 — Untested hooks & providers (state/logic)

20 of 30 hooks and ~15 provider modules have no test. Most render-only or
DOM-glue hooks can stay e2e-covered, but a few carry real logic worth unit
testing with `renderHook`:

- **`hooks/use-kana-input.ts`** — IME/romaji input state machine.
- **`hooks/use-next-prev-kanji.ts`** — list neighbor navigation (wrap/bounds).
- **`hooks/use-client-list-filters.ts`** — pairs with `client-list-filters.ts`.
- **`hooks/use-keyboard-listener.ts` / `use-enter-action.ts`** (enter-action is
  tested; keyboard-listener is not) — shortcut dispatch.
- **`shared-practice/use-practice-session.ts` (158 LOC)** and
  **`use-practice-deck.ts`** — session progression, scoring, deck advancement.
  These orchestrate the practice games and are only indirectly covered by e2e.
- Providers such as **`search-settings-provider.tsx`** and
  **`item-settings-provider.tsx`** hold reducer-like settings logic; a focused
  reducer/state test would complement the existing
  `search-settings-adapter.test.ts`.

---

## Priority 3 — Infrastructure & measurement gaps

1. **No coverage instrumentation.** Add `@vitest/coverage-v8`, a
   `test:coverage` script, and a `coverage` block in `vitest.config.ts`. This
   turns "we think coverage is low" into a tracked number and enables targeted
   backfill.
2. **No coverage floor in CI.** Once measured, add a modest ratchet (e.g.
   `lines: 60`, raised over time) so tested modules can't silently regress.
   Start low to avoid blocking, then tighten.
3. **URL <-> settings round-trip is only half-covered.** `url-params.ts` defines
   the entire deep-link contract (`URL_PARAMS`) and
   `search-settings-adapter.ts` is tested, but there is no test asserting a full
   `settings → URL → settings` round-trip preserves every field (stroke range,
   freq source+range, jlpt, jouyou, bookmarkedOnly, anchorWordsOnly, sort). This
   is exactly the kind of contract that breaks silently when a field is added.
4. **Worker boundary.** `kanji-search.ts` is well tested, but
   `kanji-worker/helpers.ts` (162 LOC) and the promise-wrapper/provider glue are
   not. Worth at least testing `helpers.ts` pure functions.

---

## Suggested sequencing

1. **Enable coverage** (`@vitest/coverage-v8` + config + script) — one PR, makes
   everything below measurable.
2. **Backfill `src/lib/activity/**`** — highest concentration of untested,
   pure, boundary-heavy logic behind a whole feature (the Dashboard).
3. **Backfill grading + results logic** (`match-reading`, `dakanji-grade`,
   `results-utils`, `freq-category`, `selection-filter`) — user-facing
   correctness, all pure functions.
4. **Add the settings URL round-trip test.**
5. **Introduce a low CI coverage floor and ratchet it up** as 2–4 land.

Items 2–4 are all pure-function tests with no mocking beyond a fake `Date` /
`localStorage`, so they are fast to write and fast to run.
