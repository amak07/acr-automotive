# Database Management Scripts

## Dev Database Snapshot System

The dev snapshot system allows you to save and restore your local development database state.

### Quick Start

1. **Save your current database**:
   ```bash
   npm run db:save-snapshot
   ```
   This creates a snapshot file at `.snapshots/dev-snapshot.json`

2. **Reset the database** (when you need a clean slate):
   ```bash
   npm run supabase:reset
   ```
   This resets the database to empty (from migrations)

3. **Restore your saved data**:
   ```bash
   npm run db:restore-snapshot
   ```
   This restores the database from your saved snapshot

### Use Cases

**Experimenting with data changes:**
```bash
# 1. Save current state
npm run db:save-snapshot

# 2. Make experimental changes...
# (import files, test features, etc.)

# 3. Restore to saved state
npm run db:restore-snapshot
```

**Complete reset workflow:**
```bash
# Reset database and restore from snapshot
npm run supabase:reset && npm run db:restore-snapshot
```

**Fresh start with production data:**
```bash
# 1. Import production data
npm run bootstrap

# 2. Save as your new baseline
npm run db:save-snapshot
```

### What Gets Saved

The snapshot includes:
- All parts
- All vehicle applications
- All cross references

**Note:** Import history is NOT included in snapshots (except test infrastructure snapshots are preserved during restore).

### Files

- `save-dev-snapshot.ts` - Creates snapshot from current database
- `restore-dev-snapshot.ts` - Restores database from snapshot
- `import-seed-sql.ts` - Imports SQL seed data (cross-platform, no psql required)
- `.snapshots/dev-snapshot.json` - Your saved snapshot (gitignored)

### Importing Seed Data

To import the SQL seed file into your local database:

```bash
npm run db:import-seed
```

This command:
- Imports `fixtures/seed-data.sql` into local database
- Works cross-platform (Windows, Mac, Linux)
- Uses direct PostgreSQL connection (no psql required)
- Shows summary of imported records

**Generate seed file from staging:**
```bash
npm run staging:export        # Export only
# OR
npm run staging:import        # Export + import in one command
```

### Difference from Test Snapshots

- **Dev snapshots**: File-based, for local development, manual save/restore
- **Test snapshots**: Database-based, automatic, created/restored during test runs
