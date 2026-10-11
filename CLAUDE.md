# Repo notes for Claude Code

The shared rules for every agent live in `AGENTS.md` (which points to
`.cursor/rules/*.mdc` as the source of truth). Keep rules there, not here, so
the copies can't drift. Claude Code loads it through this import:

@AGENTS.md
