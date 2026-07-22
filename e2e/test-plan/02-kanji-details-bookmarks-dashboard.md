# 02 — Kanji Detail Drawer, Bookmarks & Dashboard (P1/P2)

Guards refactors of the detail drawer
(`src/components/screens/ListScreen/Drawer/` →
`src/components/sections/KanjiDetails/`), the bookmark/known-status
storage layer (`src/lib/bookmarks.ts`, `src/lib/storage.ts`,
`src/hooks/use-local-storage.ts`), and the dashboard
(`src/components/screens/DashboardScreen/`).

**Already covered:** drawer open/close via cell click and `?open=` deep
link; stroke-order accordion + replay controls (`kanji-details.spec.ts`,
`home.spec.ts`). Dashboard **empty** state (`navigation.spec.ts`).

localStorage keys involved:

- Bookmarks: `b:<kanji>:<word>` = `"true"` (prefix scan in `bookmarks.ts`)
- Known status: boolean keys via `useLocalStorage2`
- Activity: `activity-all-time`, `activity-by-day`
  (`src/lib/activity/storage.ts`)

---

## Detail drawer content (P1)

### KD-1: Drawer sections render for a data-rich kanji

- **Guards:** `KanjiInfoContent.tsx` accordion composition and the
  worker's `kanji-extended` request.
- **Steps:** `goto /?open=%E6%B0%B4` (水); expand each accordion section
  in turn.
- **Assertions:** readings/meanings header content visible; example
  vocabulary section renders (vocab JSON is stubbed to `[]`, so assert
  the section header / empty container rather than word rows); similar
  kanji section lists at least one clickable kanji; external link buttons
  (Jisho, Jotoba) present.

### KD-2: Similar-kanji click navigates the drawer to the new kanji

- **Guards:** drawer-internal navigation via the `open` URL param
  (`useKanjiUrlState` in `src/hooks/routing-hooks.ts`).
- **Steps:** open 水, expand similar-kanji section, click a suggestion.
- **Assertions:** URL `open` param now equals the clicked kanji; drawer
  header shows it; browser Back returns to 水's drawer.

### KD-3: Document title reflects the open kanji

- **Guards:** `use-html-document-title`.
- **Steps:** `goto /?open=%E6%B0%B4`.
- **Assertions:** `await expect(page).toHaveTitle(/水/)`; closing the
  drawer restores the default title.

---

## Bookmarks & known status (P1)

### BM-1: Bookmarking persists across reload

- **Guards:** `KanjiWordStatusActions.tsx` write path + `safeReadJson`
  storage helpers.
- **Steps:** open a kanji drawer, toggle a bookmark action; assert its
  pressed/active state; `page.reload()`; reopen the same drawer.
- **Assertions:** action still active; localStorage has a `b:` prefixed
  key (`page.evaluate` over `Object.keys(localStorage)`).

### BM-2: Known-status toggle persists and is reflected in card borders

- **Guards:** study-status border coloring (`ItemSettings`
  `borderColorMeaning: "study-status"`).
- **Steps:** seed `item-settings` for study-status borders (or set via
  the Card Presentation popover); mark a word/kanji known in the drawer;
  close the drawer.
- **Assertions:** the corresponding grid cell reflects the status
  visually — assert via an accessible attribute if available; if only a
  class changes, note it and assert localStorage + drawer state instead.

### BM-3: Same-page storage sync (synthetic StorageEvent)

- **Guards:** `notifyStorage` in `src/lib/storage.ts` — components on the
  same page sharing a key sync via a manually dispatched `StorageEvent`;
  the subtlest sync surface in the app.
- **Steps:** with the dashboard bookmarks breakdown visible in one part
  of the flow, toggle a bookmark from the drawer (or simulate a second
  consumer) — concretely: open `/dashboard` after toggling in the same
  SPA session **without reload** (client-side nav via header link).
- **Assertions:** dashboard reflects the new bookmark without a reload.

---

## Dashboard with data (P2)

### DB-1: Seeded activity renders heatmap and stats

- **Guards:** `ActivityCalendarHeatmap.tsx`, `CalendarGrid.tsx`,
  stats overview components.
- **Steps:** before `goto`, seed localStorage via an init script
  (`page.addInitScript`) with valid `activity-all-time` /
  `activity-by-day` payloads (derive the shape from
  `src/lib/activity/storage.ts` and its unit test
  `src/hooks/use-activity-data.test.tsx`).
- **Assertions:** "Saved only on this device" empty-state text is
  **hidden**; heatmap grid renders cells; a non-zero stat is visible.

### DB-2: Bookmarks breakdown counts seeded bookmarks

- **Steps:** seed several `b:<kanji>:<word>` keys via init script;
  `goto /dashboard`.
- **Assertions:** breakdown section shows the expected count / kanji.

### DB-3: Duration navigation switches the visible period

- **Steps:** with seeded multi-day activity, use the duration nav
  controls.
- **Assertions:** the displayed period label changes; grid re-renders
  without error.
