# CLAUDE.md - ACR Automotive Context

> **Claude Code Initialization**: Read this file to understand project structure and development patterns.

## 🔄 Session Setup

**Before starting any work:**

1. **Read `docs/PLANNING.md`** - Technical architecture, tech stack, and implementation strategy
2. **Run `bd ready`** - Check for pending tasks from previous sessions

**Pre-commit hooks (configured):**

- lint-staged (ESLint + Prettier) on staged files
- Beads sync (flushes task database to git)

## 🔗 Beads Task Management

This project uses **beads (bd)** for persistent task tracking across sessions. Tasks survive context resets and are stored in `.beads/`.

**Session start:**
```bash
bd ready              # See available (unblocked) tasks
bd list               # See all tasks
```

**After plan approval - create tasks from plan steps:**
```bash
bd new "Step 1: Description"
bd new "Step 2: Description"
bd dep add <step2-id> <step1-id>  # Step 2 depends on step 1
```

**During work:**
```bash
bd update <id> --status in_progress  # Mark task started
bd new "Discovered: edge case X"     # File new work as discovered
bd dep add <new-id> <blocking-id>    # Add dependencies
```

**Completing work:**
```bash
bd close <id> --reason "Completed: brief description"
```

**When plans change:**
- Add new tasks: `bd new "New requirement"`
- Close obsolete tasks: `bd close <id> --reason "No longer needed"`
- Update scope: `bd update <id> --body "Updated description"`

**Key principle:** Beads is a persistence layer, not automation. Claude must explicitly create/update/close tasks. The value is state survives across sessions.

## 📁 Key File Locations

### Documentation

- `docs/PLANNING.md` - Architecture & tech stack
- `docs/database/DATABASE.md` - Complete database reference & workflows ⭐
- `docs/TASKS.md` - Development roadmap
- `docs/ENHANCEMENTS.md` - Future improvements
- `docs/TESTING.md` - Testing strategy
- `README.md` - Project overview & setup
- `SCRIPTS.md` - NPM scripts organized by workflow

### Technical References

- `supabase/migrations/` - Schema migrations (pull-based workflow)
- `archive/migrations/` - Historical schema files (learning reference)
- `src/components/acr/README.md` - Design system documentation
- `scripts/` - Database bootstrap and utility scripts

## 🎯 Project Context

**ACR Automotive**: Production-ready auto parts cross-reference search platform
**Status**: ✅ Deployed to production with complete parts catalog
**Current Phase**: Spanish translation and final polish

## 🧱 Core Development Standards

### Code Quality

- **File size limit**: 500 lines max - split into modules if exceeded
- **TypeScript strict**: No `any` types, prefer proper type definitions
- **Component ownership**: Use shadcn/ui pattern - copy components, don't import externally

### Architecture Patterns

- **Next.js App Router**: Follow proper layout.tsx, page.tsx, route.ts conventions
- **Database**: Supabase with type-safe operations and Zod validation
- **State Management**: TanStack Query + React Context (no Zustand)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + ACR design system (`src/components/acr/`)

### Development Workflow

- **Task tracking**: Use `bd ready` for available tasks, update with `bd update`/`bd close`
- **Documentation**: Update relevant docs when making architectural changes
- **Testing**: Focus on core business logic (Excel parsing, search, data integrity)
- **Internationalization**: All UI text must use translation keys

## 🔧 Technical Notes

- **Database**: 9-table design (parts, vehicle_applications, cross_references, part_images, part_360_frames, site_settings, tenants, import_history, user_profiles)
- **Storage**: Buckets configured in `supabase/config.toml` (NOT in migrations - migrations only capture PostgreSQL schema)
- **Performance target**: Sub-300ms search response times
- **Mobile focus**: Tablet-optimized for parts counter staff
- **Authentication**: Supabase Auth with 2-role RBAC (admin, data_manager)

## 🗄️ Database Workflow (IMPORTANT)

**Schema Management**: Pull-based workflow

1. Remote TEST database is source of truth
2. Apply changes to remote TEST first
3. Pull schema: `npx supabase db diff --linked -f description`
4. Commit migration file to git
5. Team applies: `npm run supabase:reset`

**Daily Development**:

- Local Docker Supabase for development
- Seed data from `tests/fixtures/seed-data.sql`
- Snapshot system for quick backup/restore

**Key Commands**:

- `npm run db:save-snapshot` - Save current data (before experiments)
- `npm run db:restore-snapshot` - Restore from snapshot
- `npm run supabase:reset` - Apply migrations (wipes data!)
- `npm run db:import-seed` - Load seed data
- `npm run staging:import` - Get latest from remote TEST

See `docs/database/DATABASE.md` → "Database Development Workflows" for complete guide.

## 🚨 Critical Rules

- **Never assume context** - ask questions if uncertain about requirements
- **Verify file paths** before referencing them in code
- **Follow established patterns** from PLANNING.md
- **One task at a time** for better code quality
- **Data integrity first** - validate all inputs with Zod schemas

## 🤖 Subagent Protocol

When offloading work to subagents (Task tool), always:

1. **Notify the user first** - explain what's being delegated
2. **State the reason** - why subagents vs direct work
3. **List the tasks** - what each agent will handle

**Use subagents for:**

- Exploring unfamiliar parts of the codebase
- 2+ independent tasks that can run in parallel
- Complex research/investigation tasks

**Use direct work for:**

- Sequential tasks with dependencies
- Simple edits with known file paths
- Following a detailed written plan

---

_For detailed information, always reference the specific documentation files listed above. This file provides context structure, not implementation details._
