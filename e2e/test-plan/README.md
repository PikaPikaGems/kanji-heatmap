# E2E Test Plan — Overview & Strategy

This directory is the plan for the end-to-end test suite: which tests to
build, in what order, and why. The goal is **refactor confidence** — a
suite that lets us restructure components, hooks, the worker layer, or
state management and trust that a green run means user-visible behavior
is intact.

## Philosophy

- **Assert user-visible behavior, never implementation details.** Tests
  interact via roles, labels, placeholders, and visible text — not CSS
  classes, component names, or internal state. A refactor that preserves
  behavior must not break a test; a refactor that breaks behavior must.
- **Drive state through the URL where possible.** Search, filters, sort,
  and the detail drawer are all URL-driven (see `01-search-sort-filter.md`),
  so deep-linking is both a fast test setup mechanism and a feature under
  test.
- **localStorage is the persistence layer.** Tests seed it to set up
  state and read it (sparingly) to assert persistence. Each test starts
  from a clean profile — Playwright gives every test a fresh context, so
  no manual cleanup is needed.
- **Keep the suite fast and deterministic.** External network is stubbed
  (see below); anything that can't be made deterministic without touching
  product code goes to the P3 backlog (`05-future-infrastructure.md`).

## What exists today

Infrastructure (already bootstrapped — extend it, don't replace it):

- `playwright.config.ts` — single chromium project, `baseURL`
  `http://localhost:5174`, auto-starts the Vite dev server with
  `CF_PAGES=1` after generating the katakana JSON.
- `e2e/fixtures.ts` — exports a `test` with all external dependencies
  stubbed: kanji SVGs (kanjivg.tagaini.net / assets.pikapikagems.com),
  sample-vocab JSON, `/api/(jisho|jotoba|handwriting)` Pages Functions,
  and aborted heavyweight handwriting assets (ONNX model, ref-patterns).
- CI: `.github/workflows/ci.yml` runs the suite on every PR and push to
  `main`, uploading the Playwright report on failure.

Existing specs and what they already guard (don't duplicate):

| Spec | Coverage |
| --- | --- |
| `home.spec.ts` | Grid renders with item count; search narrows results; card-presentation popover; radical-search drawer opens/closes; kanji cell click opens/closes detail drawer |
| `kanji-details.spec.ts` | `?open=` deep link; stroke-order accordion, replay controls, dmak-drawn SVG |
| `navigation.spec.ts` | Dashboard empty state; About page; 404 screen |
| `practice.spec.ts` | Reading practice start → game screen; writing practice initial screen; speed-katakana correct answer advances |
| `search-input.spec.ts` | Paste-based search-type inference (kanji → Multi-Kanji, roman → Meanings, kana → Readings) |

## Conventions for new specs

1. Import from the shared fixtures: `import { expect, test } from "./fixtures";`
2. Selectors: `getByRole` / `getByLabel` / `getByPlaceholder` / visible
   text. The search box is `getByLabel("Search kanji")`; kanji cells are
   buttons named by their character.
3. The kanji web worker loads several JSON files at startup — first
   assertion after `goto` gets `{ timeout: 30_000 }`; subsequent
   assertions use defaults.
4. Search input debounces 400ms before querying the worker — assert on
   the *result* (e.g. `/\d+ Items? Matched/`), never on timing.
5. One spec file per feature area, `test.describe` per sub-area, and a
   top-of-file comment saying which refactor the spec guards (see
   existing specs for the pattern).
6. If a new external request appears, stub it in `fixtures.ts` so every
   spec benefits.

## Plan documents & priorities

| Doc | Area | Priority |
| --- | --- | --- |
| `01-search-sort-filter.md` | Search types, sort & filter dialog, URL round-trip | **P1** |
| `02-kanji-details-bookmarks-dashboard.md` | Detail drawer content, bookmarks/known status, dashboard | **P1/P2** |
| `03-navigation-settings-misc.md` | Nav surfaces, home-search memory, theme/font, secondary pages | **P2** |
| `04-practice-games.md` | Reading / writing / speed-katakana flows, activity recording | **P2** |
| `05-future-infrastructure.md` | Offline/PWA, handwriting, real API proxies, browser matrix | **P3** |

- **P1** — gates any refactor of the list screen, worker, or URL state.
  Build these first.
- **P2** — persistence and secondary screens; build once P1 is green.
- **P3** — requires new test infrastructure; documented so the cost is
  known, not scheduled.

## Running

```sh
pnpm exec playwright install chromium   # once per machine
pnpm test:e2e                           # full suite (starts dev server itself)
pnpm test:e2e --ui                      # interactive mode
```
