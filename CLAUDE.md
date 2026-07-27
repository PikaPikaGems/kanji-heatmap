# Repo notes for Claude Code

- Before finishing any change, run `pnpm exec prettier --check .` (or
  `pnpm run format:check`) and fix any reported files with
  `pnpm exec prettier --write <file>`. CI/build fails on formatting issues,
  and it's easy to forget since `pnpm run build` doesn't run prettier itself.
