# 01 — Search, Sort & Filter, and URL State (P1)

The biggest coverage gap and the highest-value refactor guard. All list
state lives in the URL query string — there is no store. Guards refactors
of:

- `src/lib/settings/search-settings-adapter.ts` (encode/decode/normalize)
- `src/lib/settings/url-params.ts` (param names)
- `src/providers/search-settings-provider.tsx` (mount-time URL rewrite)
- `src/components/screens/ListScreen/ControlBar/` (SearchInput, SortAndFilter)
- `src/kanji-worker/kanji-search.ts` (per-type search execution)

URL params: `search-type`, `search-text`, `filter-stroke-min/max`,
`filter-jlpt`, `filter-freq-source`, `filter-freq-rank-min/max`,
`sort-primary`, `sort-secondary`, `open`, `bg-src`. Defaults are
**omitted** from the URL (`setOrDelete`), e.g. the default search type
`readings` never appears.

---

## Search types

### ST-1: Each non-drawer search type returns results

- **Guards:** the worker's per-type search dispatch.
- **Steps:** for each of `keyword`, `meanings`, `onyomi`, `kunyomi`,
  `multi-kanji`, deep-link with a known-good query, e.g.
  `/?search-type=meanings&search-text=water`,
  `/?search-type=multi-kanji&search-text=水火`,
  `/?search-type=onyomi&search-text=スイ`,
  `/?search-type=kunyomi&search-text=みず`,
  `/?search-type=keyword&search-text=water`.
- **Assertions:** `/\d+ Items? Matched/` visible with a count ≥ 1; a
  known kanji cell (e.g. 水) present in the grid.
- **Note:** parameterize with a `for` loop over `[type, query, expectedKanji]`
  tuples — one test per tuple via `test(...)` inside the loop.

### ST-2: "similar" search exercises the lazy similarity cache

- **Guards:** `ensureSimilarCache` in `src/kanji-worker/kanji-worker.ts` —
  the similar-kanji JSON is fetched only on first use, an easy path to
  break silently.
- **Steps:** `goto /?search-type=similar&search-text=水`.
- **Assertions:** results render (count visible, ≥ 1 item).

### ST-3: Type selector switches type via UI

- **Steps:** on `/`, open the search-type selector, choose "Meanings",
  type `water`.
- **Assertions:** results match; URL contains `search-type=meanings`.

---

## Sort & Filter dialog

Opened via the "Sort and Filter Settings" button on `/`
(`SortAndFilterButton.tsx` → `SortAndFilterDialog.tsx` →
`SortAndFilterForm.tsx`).

### SF-1: Stroke-count filter narrows results and writes the URL

- **Steps:** note the initial item count; open the dialog; set stroke
  range to e.g. min 1 / max 3; apply.
- **Assertions:** item count decreases; URL contains
  `filter-stroke-min=1&filter-stroke-max=3`; every visible cell is a
  low-stroke kanji (spot-check one, e.g. 一 present, 鬱 absent).

### SF-2: JLPT filter

- **Steps:** open dialog, select only N5, apply.
- **Assertions:** count drops to the N5 set size (~80); URL contains
  `filter-jlpt=n5` (encoding per adapter); selecting **all** levels
  removes the param again (all-selected is a default).

### SF-3: Frequency source + rank range

- **Steps:** open dialog, pick a frequency source, set a rank range
  (e.g. 1–100), apply.
- **Assertions:** count ≈ 100; URL contains `filter-freq-source` and both
  rank params. Then set source back to "none": rank params disappear from
  the URL (adapter drops them when source is `none`).

### SF-4: Sort order visibly changes the grid

- **Steps:** apply a deterministic primary sort (e.g. stroke count
  ascending); read the first grid cell. Switch to descending or a
  different key; read again.
- **Assertions:** first cell changes accordingly (e.g. 一 first for
  stroke-asc); URL contains `sort-primary=…`; default sort keeps the URL
  clean.

### SF-5: Secondary sort param is dropped when primary is none

- **Guards:** `setOrDelete` edge case in the adapter.
- **Steps:** set primary + secondary sort, apply, then reset primary to
  its default/none.
- **Assertions:** `sort-secondary` disappears from the URL along with
  `sort-primary`.

---

## URL round-trip & normalization

### URL-1: Deep link populates the form controls

- **Steps:** `goto /?filter-stroke-min=2&filter-stroke-max=5&filter-jlpt=n4`,
  open the Sort & Filter dialog.
- **Assertions:** the form shows stroke 2–5 and N4 selected — proves
  decode, not just search execution.

### URL-2: Invalid params are clamped and the URL rewritten

- **Guards:** the mount-time `useLayoutEffect` normalization (`replace`)
  in `search-settings-provider.tsx` plus `clamp`/allow-list coercion in
  the adapter.
- **Steps:** `goto /?filter-stroke-min=-5&filter-stroke-max=9999&search-type=not-a-type`.
- **Assertions:** app renders normally (no crash); `page.url()` after
  settle shows clamped/removed values; results still load.

### URL-3: Reload preserves the full search state

- **Steps:** build a combined state via UI (search text + a filter +
  a sort), `page.reload()`.
- **Assertions:** same item count, same first cell, form controls still
  reflect the state — the encode→decode round trip is lossless.

### URL-4: `bg-src` param survives normalization

- **Steps:** `goto /?bg-src=<valid value>` (see adapter for allowed
  values), reload.
- **Assertions:** param retained; invalid value removed.
