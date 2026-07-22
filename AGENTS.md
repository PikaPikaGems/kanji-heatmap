# AGENTS.md

## Coding conventions

The source of truth is `.cursor/rules/*.mdc` (auto-applied by Cursor). Follow them even if you are a tool that does not load those files:

- Tests: do NOT add or change automated tests unless the user explicitly asks. See `tests-only-when-asked.mdc`.
- React hooks: avoid `useEffect`, `useMemo`, `useCallback`, and `forwardRef` unless truly necessary and there is no simpler way; if you must use one, add a short comment explaining why. Prefer deriving values during render. See `avoid-react-effect-memo-callback-forwardref.mdc`.
- Single responsibility: one screen → one component (no `variant` enums stuffed into a "god" screen); route phases with a linear early-return chain rather than stacked `{phase === … && …}` blocks. Prefer early exits in conditionals generally. See `react-single-responsibility-screens.mdc`.
- Formatting: run Prettier on the exact files you edit (`pnpm exec prettier --write <paths>`); do not run a full-repo format unless asked. Match `.prettierrc.json`. See `prettier-format.mdc`.

## Cursor Cloud specific instructions

Kanji Heatmap is a client-side React + Vite single-page app (no backend of its own). Kanji data is served as static JSON from `public/json`. Standard commands live in `package.json` and setup/data docs live in `README.md` — refer to those rather than duplicating them.

### Running the app

- `pnpm run dev` — Vite dev server on port **5174**. All core features (kanji grid, search, filtering, detail views, study notes, games) work here.
- `pnpm run dev:cf` — Vite on port **5173** with the `@cloudflare/vite-plugin` enabled. Use this port when developing.
- The dev server binds to localhost only. Use `--host` if you need to reach it from outside the VM.

### Cloudflare Pages Functions caveat (non-obvious)

- The API proxies in `functions/api/` (Jisho, Jotoba, Google Handwriting) are **Cloudflare Pages Functions**. They are NOT served by `@cloudflare/vite-plugin` in either dev script, so `GET /api/jisho` etc. return 404 during local dev. These features also require outbound access to external services (`jisho.org`, Jotoba, Google) that may be blocked in the VM. Treat them as optional — the rest of the app is fully functional without them.

### Checks

- Lint/typecheck/test/build commands are in `package.json` (`lint`, `typecheck`, `test`, `build`). CI (`.github/workflows/ci.yml`) additionally runs `pnpm format:check`.
- The production build must be run with `CF_PAGES=1 pnpm build` (matching CI); this env var disables the Cloudflare vite plugin so the build matches the real Cloudflare Pages environment.
- E2E tests (`pnpm test:e2e`) need Chromium: run `pnpm exec playwright install chromium` first (browser binaries are not installed by `pnpm install`).
