# CLAUDE.md - ACR Automotive

**Always announce when using a skill or subagent** (e.g., "Using skill: frontend-design").

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

**Plan Traceability:** When creating tasks from a plan file, add the plan reference:
```bash
bd update <id> --notes="Plan: ~/.claude/plans/<plan-file>.md"
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
- Clean restart: `supabase stop --no-backup && supabase start`, then re-seed: `npm.cmd run db:import-seed`
- Docker container name conflicts: `docker rm -f <id>` or `supabase stop --no-backup` first
- Seed creates: 865 parts, 1000 vehicle_apps, 1000 cross_refs, 15 aliases

## Pre-commit Hooks

- lint-staged (ESLint + Prettier)
- Beads sync (flushes task database to git)
