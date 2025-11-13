# NPM Scripts Reference

> Quick reference for all npm scripts in this project. Run any script with `npm run <script-name>`

## 📖 Table of Contents

- [Development](#-development)
- [Supabase Local Database](#-supabase-local-database)
- [Database Snapshots](#-database-snapshots)
- [Staging Operations](#-staging-operations)
- [Production Operations](#-production-operations)
- [Common Workflows](#-common-workflows)

---

## 🚀 Development

### `npm run dev`
Start Next.js development server
- Opens at `http://localhost:3000`
- Hot reload enabled
- Use this for day-to-day development

### `npm run build`
Build production bundle
- Optimizes for production
- Generates `.next/` output
- Run before deploying

### `npm start`
Start production server
- Requires `npm run build` first
- Serves optimized bundle
- Use for local production testing

### `npm run lint`
Run ESLint checks
- Checks code style
- Reports errors and warnings

### `npm run type-check`
Run TypeScript type checking
- No output files generated
- Validates type safety
- Good to run before commits

### `npm test`
Run full test suite
- Runs all unit & integration tests
- Creates test snapshot automatically
- Restores dev data after tests complete
- Takes ~30-40 seconds

---

## 🗄️ Supabase Local Database

> Local Supabase runs on `http://localhost:54321`

### `npm run supabase:start`
Start local Supabase instance
- Docker required
- First run downloads containers (~2GB)
- Creates local database from migrations
- Service role key in `.env.test.local`

### `npm run supabase:stop`
Stop local Supabase instance
- Preserves database state
- Containers remain for fast restart

### `npm run supabase:reset`
⚠️ Reset database to empty state
- Drops all tables
- Re-runs migrations
- **Deletes all data**
- Follow with `npm run db:restore-snapshot` to restore data

### `npm run supabase:status`
Check Supabase service status
- Shows which services are running
- Displays connection URLs

---

## 💾 Database Management

> Multiple ways to populate and manage your local database

### `npm run db:import-seed`
📦 Import seed data from SQL file
- Imports `fixtures/seed-data.sql` into local database
- Uses team's shared baseline data
- Faster than staging:import (no remote fetch)
- Cross-platform (works on Windows, Mac, Linux)

**Use when:**
- First time setup
- You already have `fixtures/seed-data.sql`
- Don't need fresh data from staging

### `npm run db:save-snapshot`
📸 Save current database to file
- Backs up all parts, vehicles, cross-references
- Saves to `.snapshots/dev-snapshot.json`
- Safe to run anytime
- Does NOT commit to git (`.gitignore`)

**Use when:**
- Before experimenting with data
- After importing production data
- Creating a known good state

### `npm run db:restore-snapshot`
🔄 Restore database from saved snapshot
- Clears current data
- Restores from `.snapshots/dev-snapshot.json`
- Preserves test infrastructure
- Fast (~1 second)

**Use when:**
- After `supabase:reset`
- Reverting experiments
- Returning to known state

---

## 🎭 Staging Operations

### `npm run staging:export`
🌐 Export staging data to SQL file
- Connects to remote staging database
- Downloads all parts, vehicles, cross-refs
- Saves to `fixtures/seed-data.sql`
- Requires staging credentials in `.env.staging`
- Does NOT import into local database

**Use when:**
- Want to update team's shared seed data
- Need fresh data from staging

### `npm run staging:import`
🌐📥 Export from staging AND import to local
- Does everything `staging:export` does
- PLUS automatically imports into your local database
- One-command solution
- Cross-platform (works on Windows, Mac, Linux)

**Use when:**
- Want latest staging data in your local database
- Setting up from scratch with fresh data

### `npm run staging:clear`
⚠️ Clear all data from staging database
- Dangerous - use with caution
- Wipes parts, vehicles, cross-refs

### `npm run test:generate-baseline`
Generate baseline test data
- Creates test fixtures
- Used by test suite

---

## 🏭 Production Operations

### `npm run bootstrap`
📦 Import production parts catalog
- Imports from Excel files
- **Targets production database**
- Requires production credentials
- Use when setting up new production instance

### `npm run bootstrap:test`
Same as bootstrap but for test environment
- Safe for testing import process
- Uses test database

### `npm run check-prod`
🔍 Verify production database health
- Checks data integrity
- Reports statistics
- Read-only operation

### `npm run clear-prod`
🔥 **DANGEROUS** - Wipe production database
- Deletes ALL production data
- Requires confirmation
- **Use extreme caution**

### `npm run types:generate`
Generate TypeScript types from test database
- Updates type definitions
- Based on Supabase schema
- Run after schema changes

### `npm run types:generate:prod`
Generate TypeScript types from production database
- Same as above but for production
- Requires production access

---

## 🔄 Common Workflows

### First Time Setup (Staging Data)
```bash
npm run supabase:start          # Start local Supabase
npm run staging:import           # Get latest from staging + import
npm run db:save-snapshot         # Save as your baseline
```

### First Time Setup (Existing SQL File)
```bash
npm run supabase:start          # Start local Supabase
npm run db:import-seed           # Import fixtures/seed-data.sql
npm run db:save-snapshot         # Save as your baseline
```

### Daily Development
```bash
npm run supabase:start   # Start database
npm run dev              # Start Next.js
```

### After Pulling Changes
```bash
npm run supabase:reset            # Apply new migrations
npm run db:restore-snapshot       # Restore your data
```

### Before Experimenting
```bash
npm run db:save-snapshot          # Backup current state
# ... make changes ...
npm run db:restore-snapshot       # Revert if needed
```

### Setting Up Fresh Dev Environment
```bash
npm run supabase:start            # Start Supabase
npm run bootstrap:test            # Import data (or use production bootstrap)
npm run db:save-snapshot          # Save as baseline
```

### Running Tests
```bash
npm test                          # Runs all tests + auto snapshot/restore
```

### Production Data → Dev
```bash
npm run bootstrap                 # Import production catalog
npm run db:save-snapshot          # Save for future use
```

### Complete Fresh Start
```bash
npm run supabase:reset            # Empty database
npm run db:restore-snapshot       # Restore saved data
# OR
npm run bootstrap:test            # Re-import from Excel
```

---

## 💡 Tips

- **Always save a snapshot** before major experiments
- **`supabase:reset`** = Schema reset (structure)
- **`db:restore-snapshot`** = Data restore (content)
- Test snapshots are automatic - handled by test suite
- Dev snapshots are manual - you control when to save/restore
- Snapshots are local-only (gitignored)

---

## 🆘 Troubleshooting

**Database won't start?**
```bash
npm run supabase:stop
npm run supabase:start
```

**Lost your data?**
```bash
npm run db:restore-snapshot       # If you saved a snapshot
npm run bootstrap:test            # Otherwise, re-import
```

**Tests failing?**
```bash
npm run supabase:reset            # Clean schema
npm test                          # Tests handle their own snapshots
```

**Want to save current state?**
```bash
npm run db:save-snapshot          # Always safe to run
```

---

For more details on database snapshots, see [scripts/db/README.md](scripts/db/README.md)