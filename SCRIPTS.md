# ACR Automotive - NPM Scripts Guide

> Workflow-oriented guide to all npm scripts. Find what you need quickly!

## 🎯 Quick Start - Choose Your Workflow

**I'm starting fresh** → [First-Time Setup](#first-time-setup-workflow)
**I'm developing daily** → [Daily Development](#daily-development-workflow)
**I need to change the schema** → [Schema Changes](#schema-change-workflow)
**I need fresh data** → [Data Management](#data-management-workflows)
**I'm running tests** → [Testing](#testing-workflow)
**Production access** → [Production Operations](#production-operations)

---

## 📖 Table of Contents

- [Database Workflows](#-database-workflows)
  - [First-Time Setup](#first-time-setup-workflow)
  - [Daily Development](#daily-development-workflow)
  - [Schema Changes](#schema-change-workflow)
  - [Data Management](#data-management-workflows)
  - [Testing](#testing-workflow)
- [Script Reference](#-script-reference)
  - [Development Scripts](#development-scripts)
  - [Supabase Management](#supabase-management)
  - [Database Snapshots](#database-snapshots-local-data-backup)
  - [Staging Operations](#staging-operations-remote-test-database)
  - [Production Operations](#production-operations-dangerous)
  - [Type Generation](#type-generation)
- [Common Operations](#-common-operations-quick-reference)
- [Troubleshooting](#-troubleshooting-recipes)

---

## 🔄 Database Workflows

### First-Time Setup Workflow

**Goal**: Get from zero to working local database with seed data

#### Option A: Import from Seed File (Recommended - Fast)

Best for: New developers, or when `fixtures/seed-data.sql` already exists

```bash
# 1. Start local Supabase Docker stack
npm run supabase:start

# 2. Load seed data (865 parts + vehicles + cross-refs)
npm run db:import-seed

# 3. Save as your baseline for future restores
npm run db:save-snapshot

# 4. Start developing!
npm run dev
```

**Time**: ~30 seconds

#### Option B: Pull from Staging (Fresh Data)

Best for: When you need the absolute latest data from remote TEST database

```bash
# 1. Start local Supabase
npm run supabase:start

# 2. Export from staging + import to local (one command)
npm run staging:import

# 3. Save as baseline
npm run db:save-snapshot

# 4. Start developing
npm run dev
```

**Time**: ~60 seconds (network dependent)

---

### Daily Development Workflow

**Goal**: Normal day-to-day coding

```bash
# Morning: Start your environment
npm run supabase:start   # Start database (if not running)
npm run dev              # Start Next.js dev server

# During development: (optional checks)
npm run type-check       # Validate TypeScript
npm run lint            # Check code style

# Before committing:
npm run type-check       # Ensure no type errors
# (Pre-commit hooks will run automatically when configured)
```

**Tips**:

- Supabase Studio available at: `http://localhost:54323`
- Database direct access: `postgresql://postgres:postgres@localhost:54322/postgres`

---

### Schema Change Workflow

**Goal**: Add a new column, table, or modify existing schema

**Important**: This project uses a **PULL-BASED** workflow where remote TEST database is the source of truth!

```bash
# 1. Apply change to REMOTE TEST database FIRST
#    - Go to Supabase Dashboard (remote TEST project)
#    - Navigate to SQL Editor
#    - Write and execute your schema change
#    - Test thoroughly in the cloud environment

# 2. Pull the schema diff to create migration file
npx supabase db diff --linked -f add_new_column
#   This creates: supabase/migrations/YYYYMMDDHHMMSS_add_new_column.sql

# 3. Apply migration to your local database
npm run supabase:reset         # Drops DB, re-applies all migrations
npm run db:restore-snapshot    # Restores your local data

# 4. Test locally
npm run dev

# 5. Commit the migration file
git add supabase/migrations/*.sql
git commit -m "feat: add new column to parts table"
git push

# 6. Team members will pull and apply:
#    git pull
#    npm run supabase:reset
#    npm run db:restore-snapshot
```

**Why remote first?**

- Catches Supabase-specific features/limitations
- Ensures RLS policies work in cloud
- Team stays synchronized
- Auto-generates migration SQL (less error-prone)

**See also**: `supabase/migrations/README.md` for detailed migration guide

---

### Data Management Workflows

#### Save Current State (Before Experiments)

```bash
npm run db:save-snapshot
```

**Use before**:

- Testing destructive operations
- Experimenting with data changes
- Trying new features that modify data

**Saves to**: `.snapshots/dev-snapshot.json` (gitignored)

---

#### Restore After Breaking Things

```bash
npm run db:restore-snapshot
```

**Restores from**: `.snapshots/dev-snapshot.json`

**Time**: ~1 second

---

#### Get Fresh Data from Staging

```bash
# Export staging data to SQL file
npm run staging:export         # Creates/updates fixtures/seed-data.sql

# Reset local database with fresh schema
npm run supabase:reset        # Wipes data, applies migrations

# Import the fresh seed data
npm run db:import-seed         # Loads fixtures/seed-data.sql

# Save as new baseline
npm run db:save-snapshot
```

**Use when**:

- Staging data has changed significantly
- You need to update team's shared seed file
- Testing with production-like data

---

#### Complete Reset (Nuclear Option)

```bash
# Wipe everything and start fresh
npm run supabase:reset         # Fresh schema from migrations
npm run db:import-seed          # Load seed data
npm run db:save-snapshot        # Save as baseline
```

**Use when**:

- Local database is corrupted
- Migration issues
- Want clean slate

---

### Testing Workflow

**Goal**: Run the test suite

```bash
npm test
```

**What happens automatically**:

1. Creates test database snapshot (if needed)
2. Runs all unit & integration tests
3. Restores dev database data after tests complete

**Test database**:

- Separate Docker PostgreSQL container (port 5433)
- NOT Supabase (faster, no network dependency)
- Uses `fixtures/seed-data.sql` for seeding

**Time**: ~30-40 seconds

---

## 📚 Script Reference

### Development Scripts

#### `npm run dev`

Start Next.js development server

- Opens at `http://localhost:3000`
- Hot reload enabled
- **Use for**: Day-to-day development

#### `npm run build`

Build production bundle

- Optimizes for production
- Generates `.next/` output
- **Use before**: Deploying or testing production build

#### `npm start`

Start production server

- **Requires**: `npm run build` first
- Serves optimized bundle
- **Use for**: Local production testing

#### `npm run lint`

Run ESLint checks

- Checks code style
- Reports errors and warnings
- **Use before**: Committing (or via pre-commit hook)

#### `npm run type-check`

Run TypeScript type checking

- No output files generated
- Validates type safety across entire codebase
- **Use before**: Committing, after schema changes

---

### Supabase Management

#### `npm run supabase:start`

Start local Supabase Docker stack

**What it does**:

- Starts PostgreSQL database
- Starts Supabase Studio (web UI)
- Starts Auth, Storage, Realtime services
- Applies all migrations from `supabase/migrations/`
- **Does NOT** auto-seed data (see `db:import-seed`)

**First run**: Downloads ~2GB of Docker images

**Access**:

- API: `http://localhost:54321`
- Studio: `http://localhost:54323`
- Database: `postgresql://postgres:postgres@localhost:54322/postgres`

#### `npm run supabase:stop`

Stop local Supabase instance

- **Preserves**: Database state (data remains)
- **Keeps**: Docker containers for fast restart

#### `npm run supabase:reset`

⚠️ **DESTRUCTIVE** - Reset database to empty state

**What it does**:

1. Drops all tables and data
2. Re-runs ALL migrations from `supabase/migrations/`
3. Creates fresh empty schema
4. **Deletes all your local data**

**After running**: Follow with `npm run db:restore-snapshot` or `npm run db:import-seed`

**Use when**:

- Applying new migrations from team
- Fixing corrupted local schema
- Testing migration process

#### `npm run supabase:status`

Check Supabase service status

- Shows which services are running
- Displays connection URLs and ports
- Shows API keys

---

### Database Snapshots (Local Data Backup)

#### `npm run db:save-snapshot`

📸 Save current database to JSON file

**What it does**:

- Exports all parts, vehicle_applications, cross_references
- Saves to `.snapshots/dev-snapshot.json`
- **Does NOT** commit to git (gitignored)
- Safe to run anytime

**Use when**:

- Before experimenting with data
- After importing production/staging data
- Creating a known good state

**Time**: ~2 seconds

#### `npm run db:restore-snapshot`

🔄 Restore database from saved snapshot

**What it does**:

- Deletes current data (in FK order: cross_refs → vehicles → parts)
- Inserts data from `.snapshots/dev-snapshot.json`
- Preserves schema/structure

**Requires**: Previously saved snapshot (via `db:save-snapshot`)

**Use when**:

- After `supabase:reset`
- Reverting experiments
- Returning to known state

**Time**: ~1 second

#### `npm run db:import-seed`

📦 Import seed data from SQL file

**What it does**:

- Imports `fixtures/seed-data.sql` into local database
- Uses direct PostgreSQL connection (cross-platform, no `psql` needed)
- **Replaces** existing data

**Seed file contains**:

- 865 parts from ACR catalog
- 1000 vehicle applications
- 1000 cross-references

**Use when**:

- First time setup
- After `supabase:reset`
- Want team's shared baseline data

**Time**: ~5 seconds

**Note**: This is cross-platform (works on Windows, Mac, Linux) - no `psql` dependency

---

### Staging Operations (Remote TEST Database)

⚠️ **These operate on REMOTE Supabase, not local!**

#### `npm run staging:export`

🌐 Export staging data to SQL file

**What it does**:

- Connects to remote TEST database (Supabase cloud)
- Downloads all parts, vehicles, cross-refs
- Saves to `fixtures/seed-data.sql`
- **Does NOT** import into local database

**Requires**: Staging credentials in `.env.staging`

**Use when**:

- Want to update team's shared seed data
- Staging has new parts/data you want to capture
- Creating new baseline for team

**Time**: ~10 seconds (network dependent)

#### `npm run staging:import`

🌐📥 Export from staging AND import to local

**What it does**:

1. Everything `staging:export` does
2. **PLUS** automatically imports into your local database

**One-command solution for**: Getting latest staging data into local dev

**Use when**:

- Want latest staging data in your local database
- Setting up from scratch with fresh data

**Time**: ~15 seconds

#### `npm run staging:clear`

⚠️🔥 **DANGEROUS** - Clear all data from staging database

**What it does**:

- Deletes ALL data from remote TEST database
- Wipes parts, vehicles, cross-refs

**Use with extreme caution**: This affects the shared staging environment!

#### `npm run test:generate-baseline`

Generate baseline test data from staging

- Creates test fixtures
- Used by test suite for consistent test data

---

### Production Operations (DANGEROUS)

🔥 **These operate on PRODUCTION database!**

#### `npm run check-prod`

🔍 Verify production database health

**What it does**:

- Checks data integrity
- Reports statistics (part count, vehicle count, etc.)
- **Read-only operation** (safe)

**Requires**: Production credentials in `.env.production`

#### `npm run clear-prod`

🔥🔥🔥 **EXTREMELY DANGEROUS** - Wipe production database

**What it does**:

- Deletes ALL production data
- Requires confirmation prompts

**NEVER run this unless**:

- You have complete backup
- You understand the consequences
- You have explicit approval

#### `npm run bootstrap`

📦 Import production parts catalog from Excel

**What it does**:

- Reads Excel files from `archive/original-client-files/`
- Parses PRECIOS.xlsx + CATALOGACION.xlsx
- Imports into **production** database

**Status**: ✅ COMPLETED (one-time migration)

**Use when**: Setting up new production instance

#### `npm run bootstrap:test`

Same as `bootstrap` but targets test environment

- Safe for testing import process
- Uses test database credentials

---

### Type Generation

#### `npm run types:generate`

Generate TypeScript types from TEST database schema

**What it does**:

- Connects to remote TEST database
- Reads schema (tables, columns, types)
- Generates TypeScript definitions in `src/lib/supabase/types.ts`

**Use when**:

- After schema changes to remote TEST
- Types are out of sync with database
- New tables/columns added

**Requires**: TEST database credentials

#### `npm run types:generate:prod`

Generate TypeScript types from PRODUCTION database schema

- Same as above but for production
- Requires production access

---

## 🚀 Common Operations Quick Reference

| I want to...                     | Command                                                 | Time |
| -------------------------------- | ------------------------------------------------------- | ---- |
| Start developing                 | `npm run supabase:start && npm run dev`                 | 10s  |
| Save my current data             | `npm run db:save-snapshot`                              | 2s   |
| Restore after breaking something | `npm run db:restore-snapshot`                           | 1s   |
| Get latest data from staging     | `npm run staging:import`                                | 15s  |
| Apply new schema migrations      | `npm run supabase:reset && npm run db:restore-snapshot` | 10s  |
| Check if schema is outdated      | `npx supabase db diff --linked`                         | 5s   |
| Start completely fresh           | `npm run supabase:reset && npm run db:import-seed`      | 15s  |
| Run tests                        | `npm test`                                              | 40s  |
| Check production stats           | `npm run check-prod`                                    | 5s   |
| Update TypeScript types          | `npm run types:generate`                                | 5s   |

---

## 🆘 Troubleshooting Recipes

### Database won't start

**Problem**: `supabase:start` fails or hangs

**Solution**:

```bash
npm run supabase:stop
docker ps -a                   # Check for stuck containers
docker rm $(docker ps -aq)    # Remove all stopped containers (if needed)
npm run supabase:start
```

---

### Lost my data after reset

**Problem**: Ran `supabase:reset` and lost local data

**Solution**:

```bash
# If you saved a snapshot:
npm run db:restore-snapshot

# Otherwise, use team seed file:
npm run db:import-seed

# Or pull from staging:
npm run staging:import
```

---

### Schema migration failed

**Problem**: Migration errors during `supabase:reset`

**Solution**:

```bash
# Nuclear option - complete fresh start
npm run supabase:stop
rm -rf .supabase               # Delete local Supabase state
npm run supabase:start         # Fresh start, re-applies migrations
npm run db:import-seed         # Restore data
```

---

### My local schema differs from team

**Problem**: Pull latest code, migrations fail or schema is different

**Solution**:

```bash
git pull                       # Get latest migrations
npm run supabase:reset         # Apply all migrations (including new ones)
npm run db:restore-snapshot    # Restore your local data
```

**Check for drift**:

```bash
npx supabase db diff --linked  # Should show no differences
```

---

### Tests are failing

**Problem**: `npm test` fails

**Solution**:

```bash
# Clean reset
npm run supabase:reset         # Fresh schema
npm test                       # Tests handle their own snapshots
```

---

### Types don't match database

**Problem**: TypeScript errors about database types

**Solution**:

```bash
npm run types:generate         # Regenerate from TEST database
npm run type-check             # Verify types are correct
```

---

### Supabase Studio won't load

**Problem**: `http://localhost:54323` doesn't open

**Solution**:

```bash
npm run supabase:status        # Check if Studio is running
# Look for: "Studio URL: http://localhost:54323"

# If not running:
npm run supabase:stop
npm run supabase:start
```

---

### "Connection refused" when importing seed data

**Problem**: `db:import-seed` fails with connection error

**Solution**:

```bash
# Ensure Supabase is running
npm run supabase:status

# Check database port 54322 is available
npm run supabase:start

# Try import again
npm run db:import-seed
```

---

## 💡 Tips & Best Practices

### Snapshots

- **Always save a snapshot** before major experiments
- Snapshots are gitignored - they're personal backups
- `db:save-snapshot` is safe to run anytime (non-destructive)

### Schema vs Data

- **`supabase:reset`** = Schema reset (structure only, wipes data)
- **`db:restore-snapshot`** = Data restore (content only, preserves structure)
- They complement each other!

### Testing

- Test snapshots are automatic (handled by test suite)
- Dev snapshots are manual (you control when to save/restore)

### Data Flow

```
Remote TEST DB (staging)
  ↓ npm run staging:export
fixtures/seed-data.sql
  ↓ npm run db:import-seed
Local Docker Supabase
  ↓ npm run db:save-snapshot
.snapshots/dev-snapshot.json
  ↓ npm run db:restore-snapshot
Local Docker Supabase
```

### Schema Management

- **Remote TEST is source of truth**
- Apply changes to remote TEST first
- Pull schema: `npx supabase db diff --linked -f description`
- Team applies: `npm run supabase:reset`

---

## 📚 Related Documentation

- **Database workflows**: `docs/database/DATABASE.md` - Complete database reference
- **Migration guide**: `supabase/migrations/README.md` - Pull-based workflow details
- **Architecture**: `docs/PLANNING.md` - System design & tech stack
- **Testing**: `docs/TESTING.md` - Test suite documentation
- **Historical schemas**: `archive/migrations/` - For learning/RAG system

---

**Quick Links**:

- Local Supabase Studio: http://localhost:54323
- Next.js Dev Server: http://localhost:3000
- Project Repository: (your-repo-url-here)
