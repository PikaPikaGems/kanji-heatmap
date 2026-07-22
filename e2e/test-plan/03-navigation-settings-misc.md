# 03 — Navigation, Settings & Secondary Screens (P2)

Guards refactors of the site layout (`src/components/site-layout/`),
the home-search memory singleton (`src/lib/home-search-memory.ts`),
theme/font providers (`src/providers/theme-provider.tsx`,
`src/hooks/use-change-font.ts`, `src/hooks/use-change-theme-color.ts`),
and the secondary screens.

**Already covered:** direct `goto` for `/dashboard`, `/about`, and 404
(`navigation.spec.ts`).

Route table: `src/App.tsx`; link definitions:
`src/lib/pages/nav-links.ts`, `src/lib/pages/practice-pages.ts`.
Layout nuance worth preserving in any refactor: `/speed-katakana`,
`/reading-practice`, `/writing-practice` render **outside** the standard
header layout, and speed-katakana is outside `KanjiFunctionalityProvider`
entirely.

---

## Navigation surfaces

### NAV-1: Floating island tabs

- **Guards:** `FloatingIsland.tsx` + wouter client-side routing.
- **Steps:** from `/`, click Dashboard tab → Mastery tab → Explore tab.
- **Assertions:** each screen's landmark renders (dashboard text,
  mastery "coming soon" content, kanji grid); URL updates; no full page
  reload (assert via a `window` marker set in an init script that must
  survive navigation).

### NAV-2: Header drawer links

- **Guards:** `HeaderDrawer.tsx` link list.
- **Steps:** open the header drawer/menu; click through to About, Terms,
  Privacy, Cumulative Use Graph.
- **Assertions:** each page's heading renders; drawer closes after
  navigation.

### NAV-3: Practice FAB reaches all three games

- **Guards:** `PracticeFab.tsx` + `practiceNavLinks`.
- **Steps:** from `/`, open the practice FAB; visit Reading, Writing,
  Speed Katakana in turn (returning via browser Back).
- **Assertions:** each game's start screen renders ("Start Practicing" /
  "Start Game"); Back returns to the list with state intact.

### NAV-4: Home-search memory restores the last query

- **Guards:** `src/lib/home-search-memory.ts` — module-level singleton
  outside React; survives client-side navigation, resets on reload.
- **Steps:** on `/`, search `みず` (wait for results, URL has
  `search-text`); client-navigate to `/dashboard`; click the home/Explore
  link.
- **Assertions:** URL is `/?search-text=…` again and results are
  filtered. Then `page.reload()` on `/dashboard` and click home:
  URL is plain `/` (memory is in-memory only — asserting the reset
  guards against someone "fixing" it into persistence accidentally).

### NAV-5: `/docs` redirects to `/about`

- **Steps:** `goto /docs`.
- **Assertions:** URL becomes `/about`; About heading visible.

---

## Settings persistence

### SET-1: Theme toggle persists

- **Guards:** `theme-provider.tsx` — applies theme by mutating
  `document.documentElement`; assert on `<html>`, not component output.
- **Steps:** toggle theme via `ModeToggle`; reload.
- **Assertions:** `<html>` classList contains the chosen theme class
  before and after reload; localStorage `vite-ui-theme` matches.

### SET-2: Kanji font cycles and persists

- **Guards:** `use-change-font.ts` (15 fonts, cycles, CSS var on root).
- **Steps:** click the change-font button twice; read the font CSS
  var / localStorage `kanji-font`; reload.
- **Assertions:** value advanced twice and survives reload.

### SET-3: Card presentation settings persist

- **Guards:** `ItemSettings` provider + popover
  (`ControlBar/ItemPresentation/`).
- **Steps:** open "Card Presentation Settings"; switch card type
  compact ↔ expanded and border meaning to JLPT; reload.
- **Assertions:** popover reopens with the chosen values; grid cell
  appearance changed (expanded cards show extra content — assert on that
  text, not on class names); localStorage `item-settings` updated.

---

## Secondary screens

### SCR-1: Cumulative use graph renders

- **Guards:** `CumUseScreen` + chart.js integration
  (`KanjiCumUseChart`, which has unit-tested helpers).
- **Steps:** `goto /cumulative-use-graph`.
- **Assertions:** page heading renders; a `canvas` element is attached
  and non-empty-sized (chart.js draws to canvas — pixel assertions are
  out of scope).

### SCR-2: Terms and Privacy render their content

- **Steps:** `goto /terms`, `goto /privacy`.
- **Assertions:** respective headings visible (mirrors the existing
  About test).

### SCR-3: Mastery placeholder renders

- **Steps:** `goto /mastery`.
- **Assertions:** coming-soon content visible — pins the route so a
  future implementation consciously updates the test.
