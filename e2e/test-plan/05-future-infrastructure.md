# 05 — Future Work: Needs New Test Infrastructure (P3)

Deliberately **not** scheduled. Each item lists what it would take, so
the cost is known when (if) it becomes worth paying. None of these block
refactor confidence for the current P1/P2 surface.

## Offline / PWA behavior

What's untested: service-worker registration (`vite-plugin-pwa`,
`registerType: "autoUpdate"`), Workbox runtime caching rules in
`vite.config.ts`, the offline fallback UI
(`src/components/error/DefaultOfflineFallback.tsx`), and
`use-network-state.ts`.

Why it needs infra: the dev server used by e2e doesn't build the service
worker — testing this requires `vite build` + `vite preview` as a second
Playwright project (own `webServer` entry), plus
`context.setOffline(true)` flows.

Key scenario worth having: `/json/*.json` uses **StaleWhileRevalidate
and is not precached** — a first-ever visit that goes offline has no
kanji data (documented trade-off in the config comments). A test should
pin both sides: online-then-offline works; cold-offline shows the
fallback rather than a broken screen.

## Handwriting search (3 variants) and writing-practice recognition

Currently `fixtures.ts` aborts `/onnx/*` and `/js/ref-patterns.js`
(~8MB combined), so the `handwriting`, `handwriting-alt`,
`handwriting-alt-2` search types and real writing-practice grading are
unexercised.

Options, cheapest first:
1. Stub the recognizer boundary: fulfill the asset routes with a tiny
   fake and mock the candidate-list producer so the UI flow (draw →
   candidates → select → search) is tested without real inference.
2. Check the real assets into a test-fixtures dir (or fetch in CI with
   caching) and run one smoke test with genuine recognition — slow, keep
   out of the default suite (`test.describe.configure` or a separate
   project + CI job).

Drawing itself is testable today via `page.mouse` strokes on the canvas.

## Real Jisho / Jotoba proxy functions

`functions/api/*.ts` (Cloudflare Pages Functions) never run in e2e — the
plain Vite server doesn't serve them and fixtures stub `/api/*`. Testing
them requires a Playwright project targeting the wrangler-backed server
(`pnpm dev:cf`, port 5173) and either recorded upstream responses or
tolerance for live-network flake. Recommendation: contract-test the
functions in isolation (vitest + `wrangler unstable_dev`) instead of
dragging them into browser e2e.

## Worker-init failure fallback

`KanjiWorkerProvider` renders an error fallback if worker init rejects.
One negative test: `context.route` the `/json/*` startup payloads to
`route.abort()` and assert the fallback renders instead of an infinite
loading state. Cheap — promote to P2 if the worker layer gets refactored.

## Browser & viewport matrix

Currently chromium-only, desktop viewport. Considerations:
- **Mobile viewport project** (`devices["Pixel 7"]`): the layout has
  mobile-specific surfaces (drawers, floating island); cheap to add —
  run the existing suite, fix selectors that assume hover.
- **WebKit/Firefox**: doubles-to-triples CI time for a local-first app
  with no server variance; not recommended until a real cross-browser
  bug shows up. If added, run on a schedule (nightly) rather than every
  PR.

## Visual regression

The "heatmap" coloring (frequency-ranked cell colors, JLPT borders,
theme colors) is inherently visual and currently unasserted. Playwright
`toHaveScreenshot` on a deterministic state (fixed filter + sort + seeded
settings) would guard it, at the cost of snapshot maintenance (fonts must
be self-hosted/stable — they are, via `public/fonts`). Start with one
screenshot of the grid's first rows under fixed settings, dark theme
only.
