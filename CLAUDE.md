# Repo notes for Claude Code

- Do not add, change or delete automated tests (unit or e2e) unless the
  user explicitly asks for it in that conversation. This applies to every
  agent and subagent. Running existing tests is fine. Same rule as
  `AGENTS.md` and `.cursor/rules/tests-only-when-asked.mdc`.
- Before finishing any change, run `pnpm exec prettier --check .` (or
  `pnpm run format:check`) and fix any reported files with
  `pnpm exec prettier --write <file>`. CI/build fails on formatting issues,
  and it's easy to forget since `pnpm run build` doesn't run prettier itself.
- Never hardcode data fixes in code: per-character mappings, exception
  lists, keyword overrides and the like (e.g. `{ 剝: "剥" }`). Put them in a
  data file, normally `raw-data/<area>/ours.json`, and have the script read
  it. Hardcoding is allowed only when the user explicitly says so for that
  specific case.
