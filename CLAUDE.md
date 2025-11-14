# CLAUDE.md - ACR Automotive Context

> **Claude Code Initialization**: Read this file to understand project structure and development patterns.

## 🔄 Session Setup

**Before starting any work:**

1. **Read `docs/PLANNING.md`** - Technical architecture, tech stack, and implementation strategy
2. **Check `docs/TASKS.md`** - Current development priorities and session state
3. **Say "session start"** - Automatic time tracking begins (fully automated via hooks!)

**During work session:**

- **Say "session pause"** - Temporarily stop tracking (lunch, breaks, meetings)
- **Say "session continue"** - Resume tracking after pause
- Work on features and tasks as normal

**When ending session:**

1. Say **"session end"** to trigger automatic documentation
2. Claude will generate TASKS.md entry with:
   - Session number and date
   - Start/end times with calculated work duration (excluding pauses!)
   - Pause time breakdown (if any)
   - Work completed summary
   - Git statistics (lines changed, files modified, commits)

**Pre-commit hooks (configured):**

- Run lint-staged (ESLint + Prettier) on staged files
- Ensure code quality before commits
- Auto-format TypeScript, JSON, and Markdown files

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

- **Task tracking**: Update `docs/TASKS.md` when starting/completing work
- **Documentation**: Update relevant docs when making architectural changes
- **Testing**: Focus on core business logic (Excel parsing, search, data integrity)
- **Internationalization**: All UI text must use translation keys

## 🔧 Technical Notes

- **Database**: 8-table design (parts, vehicle_applications, cross_references, part_images, part_360_frames, site_settings, tenants, import_history)
- **Storage**: Buckets configured in `supabase/config.toml` (NOT in migrations - migrations only capture PostgreSQL schema)
- **Performance target**: Sub-300ms search response times
- **Mobile focus**: Tablet-optimized for parts counter staff
- **Authentication**: MVP password protection (production upgrade planned)

## 🗄️ Database Workflow (IMPORTANT)

**Schema Management**: Pull-based workflow

1. Remote TEST database is source of truth
2. Apply changes to remote TEST first
3. Pull schema: `npx supabase db diff --linked -f description`
4. Commit migration file to git
5. Team applies: `npm run supabase:reset`

**Daily Development**:

- Local Docker Supabase for development
- Seed data from `fixtures/seed-data.sql`
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

---

_For detailed information, always reference the specific documentation files listed above. This file provides context structure, not implementation details._
