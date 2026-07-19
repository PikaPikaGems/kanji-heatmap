# End-to-end tests

Playwright specs under `e2e/`. Run with `pnpm test:e2e`.

## Explore screen (`e2e/home.spec.ts`)

- Renders the kanji grid with an item count
- Search narrows results
- Card presentation settings popover opens
- Card presentation can switch border meaning to study status
- Radical search opens its drawer
- Clicking a kanji opens and closes the detail drawer

## Search input type inference (`e2e/search-input.spec.ts`)

- Pasting kanji switches to Multi-Kanji with a hint chip
- Pasting a roman word switches to Meanings
- Pasting kana keeps the default Readings type and searches

## Search types (`e2e/search-types.spec.ts`)

- Meanings search via type select narrows results
- Similar shapes search via URL returns matches
- Clear search restores the full grid

## Sort and filter (`e2e/sort-filter.spec.ts`)

- JLPT filter via URL narrows the grid
- `sort-primary` via URL is applied
- Sort and filter dialog Apply updates the URL
- Clear all restores defaults from the dialog

## Kanji detail drawer

### Stroke order (`e2e/kanji-details.spec.ts`)

- Kanji drawer shows the stroke-order animation section

### Drawer sections & navigation (`e2e/kanji-drawer.spec.ts`)

- Accordion sections render static content
- Arrow keys move to the next kanji in the list
- Review pile action shows coming soon popover

## Bookmarks (`e2e/bookmarks.spec.ts`)

- Bookmarking a kanji updates explore badge and dashboard
- Reading practice bookmarked-only with empty bookmarks disables start

## Navigation (`e2e/navigation.spec.ts`)

- Dashboard renders
- About page renders
- Unknown route shows the 404 screen

## Route smoke coverage (`e2e/routes.spec.ts`)

- Mastery page renders coming-soon state
- Cumulative use graph renders its chart heading
- Terms of use page renders
- Privacy policy page renders
- `/docs` redirects to `/about`

## Site chrome (`e2e/site-chrome.spec.ts`)

- Floating island navigates between primary tabs
- Practice FAB opens modes and routes to reading practice
- Header menu opens and routes to a docs page
- Theme toggle flips dark/light and persists

## Dashboard (`e2e/dashboard.spec.ts`)

- Renders overview sections and activity filters

## Practice modes (`e2e/practice.spec.ts`)

- Reading practice: start a session reaches the game screen
- Writing practice: initial screen renders
- Speed katakana: typing the correct romaji advances the word
- Speed katakana: typing skip advances without matching
- Reading practice: forgot path returns to the start screen
- Writing practice: model load failure allows play without grading
