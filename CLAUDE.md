# CLAUDE.md - ACR Automotive

## Project

ACR Automotive: Production-ready auto parts cross-reference search platform. Deployed to production with complete parts catalog.

## Beads Task Management

Tasks persist across sessions in `.beads/`. Run at session start:

```bash
bd ready                                  # See pending tasks
bd new "description"                      # Create task after plan approval
bd update <id> --status in_progress       # Start working
bd close <id> --reason "done"             # Complete task
```

## Code Quality

Use these skills when relevant:
- `vercel-react-best-practices` - React/Next.js patterns
- `frontend-design` - UI/UX work
- `supabase-postgres-best-practices` - Database queries/schema

## Development

- Local Docker Supabase for development
- Supabase MCP servers configured (local + remote)
- `npm run db:save-snapshot` / `db:restore-snapshot` - Data backup

## Pre-commit Hooks

- lint-staged (ESLint + Prettier)
- Beads sync (flushes task database to git)
