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

## Git Worktrees

Worktree for E2E test hardening lives at `../acr-search-tests` (branch `test/search-e2e-cleanup`).

**Setup from scratch:**
```bash
git worktree add ../acr-search-tests test/search-e2e-cleanup
cd ../acr-search-tests
npm install
cp ../acr-automotive/.env.local .
```

**Running tests (uses port 3001 to avoid conflicts):**
```bash
# Ensure local Supabase is running first
npx playwright test
```

**Known gotchas:**
- **Dual lockfile detection (Next.js 15.4+):** Turbopack walks up directories for lockfiles. Keep worktree at sibling level (`../`), not inside the project.
- **SWC binary corruption:** If you see "not a valid Win32 application", run `rm -rf node_modules && npm install`.
- **Port conflicts:** Worktree playwright.config.ts is set to port 3001. Don't change it back to 3000.
- **Local Supabase required:** .env.local points to localhost:54321. Tests will fail without it.

## E2E Testing (Playwright)

- Auth setup: `tests/e2e/auth.setup.ts` logs in as admin, saves storageState
- Test files use `test.describe.configure({ mode: "serial" })` when they share DB state
- DB isolation: `createE2ESnapshot()` / `restoreE2ESnapshot()` in beforeAll/afterAll
- Reset to clean state: `npm.cmd run db:import-seed`

**Test IDs:** When E2E tests can't reliably find UI elements (ambiguous selectors, responsive duplicates), **ask the user before adding `data-testid` attributes** to production components. Don't spend time chasing fragile CSS/aria selectors — flag the issue, propose test IDs, and wait for approval.

**Locator priority:** `getByTestId` > `getByRole` with name > `getByLabel` > CSS selectors. Never use `.first()` / `.nth()` as a permanent fix for ambiguous selectors.

## Pre-commit Hooks

- lint-staged (ESLint + Prettier)
- Beads sync (flushes task database to git)

## Landing the Plane (Session Completion)

When ending a work session, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**0. Code review** (before committing)

Launch a `superpowers:code-reviewer` subagent with this prompt template:

```
## Code Review Request

**What was implemented:** {DESCRIPTION}
**Plan/Requirements:** {PLAN_FILE_OR_SUMMARY}
**Base SHA:** {BASE_SHA}
**Head SHA:** {HEAD_SHA} (or "uncommitted changes")

Review the full diff and assess:

### 1. Objective Alignment
- Do the changes match the stated plan/requirements?
- Was anything added that wasn't in scope?
- Was anything from the plan skipped or partially done?

### 2. Production Code Safety
- List every non-test file modified and explain WHY it was changed
- Are production changes minimal (no logic/behavior changes beyond what's needed)?
- Could any production change affect users who aren't running tests?

### 3. Regression Detection
- For every piece of MODIFIED code: does the new version preserve 100% of the old behavior?
- For every piece of DELETED code: was it truly unused, or did something depend on it?
- For every REFACTORED function/assertion: compare old vs new — flag any semantic drift

### 4. Test Integrity
- Do modified tests still test the same thing, or did their meaning change?
- Are there tests that now pass for the wrong reason (e.g., weaker assertion, different route)?
- Do new tests actually verify what they claim to verify?

### 5. Action Items
- List issues as Critical (must fix), Important (should fix), or Suggestion (nice to have)
- For each issue, cite the exact file and line number
```

Fix all Critical and Important issues before proceeding. Push back on the reviewer with reasoning if you disagree.

**1. File issues for remaining work**
```bash
bd create --title="Follow-up: ..." --type=task --priority=2
```

**2. Run quality gates** (if code changed)
```bash
npx.cmd playwright test          # E2E tests (or from worktree)
./node_modules/.bin/tsc.cmd --noEmit  # Type check
```

**3. Update beads**
```bash
bd close <id1> <id2> ... --reason="done"   # Close finished work
bd sync                                     # Flush to .beads/issues.jsonl
```

**4. Clean up resources**
- Stop background dev servers (port 3000/3001)
- Remove worktrees: `git worktree remove ../worktree-name --force`
- Verify removal: `git worktree list`
- Prune stale branches if merged

**5. Commit and push** (MANDATORY)
```bash
git add <files>                  # Stage changes (including .beads/issues.jsonl)
git commit -m "..."              # Commit
git pull --rebase                # Sync with remote
git push                         # Push — work is NOT done until this succeeds
git status                       # MUST show "up to date with origin"
```

**Critical rules:**
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds
- If worktree was used, push BOTH the worktree branch AND the main branch
