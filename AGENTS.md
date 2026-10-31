# AGENTS.md

## Coding conventions

The source of truth is `.cursor/rules/*.mdc` (auto-applied by Cursor). Follow them even if you are a tool that does not load those files:

- Chat: keep answers concise; prefer bullets over paragraphs. See `concise-answers.mdc`.
- Tests: do NOT add, change or delete automated tests (unit or e2e) unless the user explicitly asks in that conversation. Applies to every agent and subagent; running existing tests is fine. See `tests-only-when-asked.mdc`.
- React hooks: `useEffect` is last resort (prefer render-time derivation, event handlers, or module-level setup). Avoid `useMemo`, `useCallback`, and `forwardRef` unless truly necessary and there is no simpler way. If you must use one (or `useEffect`), put a code comment directly above the hook call saying why it's absolutely needed and why the simpler options don't work, e.g. `// Effect needed: subscribes to window keydown and must unsubscribe on unmount.` See `avoid-react-effect-memo-callback-forwardref.mdc`.
- Single responsibility: one screen → one component (no `variant` enums stuffed into a "god" screen); route phases with a linear early-return chain in that component’s body (wrap with the layout shell at the call site; do not use `renderPhase()`). Prefer early exits in conditionals generally. See `react-single-responsibility-screens.mdc`.
- Control flow: use `if` / `else` with early exits (`return`, `continue`) as much as possible, and avoid `switch` / `case` statements. See `prefer-if-early-return.mdc`.
- React state: do not pile unrelated `useState` into one component — extract subtrees that do not depend on some of that state. Mutually exclusive flags (`isLoading` / `isError` / `isSuccess`, or overlays that cannot be open together) should be one status union. See `react-state-colocation.mdc`. Callbacks that only pick a value on that union are one `onAction`, not parallel `onOpenX` / `onClose` props. See `no-duplicate-action-props.mdc`.
- Few states per component: keep each component to a small number of states. Values that always change together are one state holding an object; state whose next value depends on the current one in several ways uses `useReducer`. See `react-state-colocation.mdc`.
- Reuse before copy: use or extend an existing component (a prop for the real difference, or a shared smaller piece) instead of copying it and changing a few lines. See `reuse-before-copy.mdc`.
- Formatting: run Prettier on the exact files you edit (`pnpm exec prettier --write <paths>`); do not run a full-repo format unless asked. Before finishing any change, run `pnpm exec prettier --check .` and fix the files it reports — CI fails on formatting, and `pnpm run build` doesn't run Prettier. Match `.prettierrc.json`. See `prettier-format.mdc`.
- Data fixes: never hardcode per-character mappings, exception lists, keyword overrides and the like in code; they belong in the data build, not in this repo, unless the user explicitly says to hardcode that case. See `no-hardcoded-data-fixes.mdc`.
- PRs: run Prettier, commit remaining changes, then push and create the PR. See `pr-before-create.mdc`.
- Fade-ins: content that appears or swaps because of a toggle, switch or tab fades in (`animate-fade-in-fast` on a wrapper keyed by the control's value) so it isn't jarring. See `fade-in-swapped-content.mdc`.
- Warnings: warning and error text is bold yellow via `cnWarningText` (or `cnWarningTextColor`) from `@/lib/generic-cn`, never inline yellow classes and never thin red; red stays for destructive buttons, dots and borders. See `warnings-bold-yellow.mdc`.
- Buttons: text buttons never use the default shadcn `Button`; use `PracticeButton`, the dotted `TextActionButton`, an inline `NoticeAction`, or a pill. See `text-buttons-not-shadcn.mdc`.
- Dialogs: buttons go in `DialogActions` (right-aligned, main action rightmost; stacked full width on phones, main action on top; Cancel is a `ghost` PracticeButton). See `dialog-buttons.mdc`.
- Notices: messages users must read use `UserNotice` (⚠️ + normal text color, inline underlined actions); logged-out states use `LoginNotice`. See `user-notices.mdc`.
- Plans: write implementation plans, design notes and handoffs as Markdown, not HTML. HTML is only for visual mockups. See `plans-in-markdown.mdc`.
- Tailwind: colocate `className` strings; do not extract `_CN` (or similar) constants unless the same string is reused in multiple places. See `inline-tailwind-classes.mdc`.

## Cursor Cloud specific instructions

Kanji Heatmap is a client-side React + Vite single-page app (no backend of its own). Kanji data is served as static JSON from `public/json`. Standard commands live in `package.json` and setup/data docs live in `README.md` — refer to those rather than duplicating them.

### Running the app

- `pnpm run dev` — Vite dev server on port **5174**. All core features (kanji grid, search, filtering, detail views, study notes, games) work here.
- `pnpm run dev:cf` — Vite on port **5173** with the `@cloudflare/vite-plugin` enabled. Use this port when developing.
- The dev server binds to localhost only. Use `--host` if you need to reach it from outside the VM.

### Cloudflare Pages Functions caveat (non-obvious)

- The API proxies in `functions/api/` (Jisho, Jotoba, KanjiAPI, Google Handwriting) are **Cloudflare Pages Functions**. They are NOT served by `@cloudflare/vite-plugin` in either dev script, so `GET /api/jisho` etc. return 404 during local dev. These features also require outbound access to external services (`jisho.org`, Jotoba, Google) that may be blocked in the VM. Treat them as optional — the rest of the app is fully functional without them.

### Checks

- Lint/typecheck/test/build commands are in `package.json` (`lint`, `typecheck`, `test`, `build`). CI (`.github/workflows/ci.yml`) additionally runs `pnpm format:check`.
- The production build must be run with `CF_PAGES=1 pnpm build` (matching CI); this env var disables the Cloudflare vite plugin so the build matches the real Cloudflare Pages environment.
- E2E tests (`pnpm test:e2e`) need Chromium: run `pnpm exec playwright install chromium` first (browser binaries are not installed by `pnpm install`).
