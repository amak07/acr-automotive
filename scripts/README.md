# ACR Automotive Production Scripts

Management scripts for ACR Automotive production database operations.

## Available Scripts

### `bootstrap-import.ts` - Complete Data Import
Imports all data from Excel files into production database.

**Usage:**
```bash
# Import to production (uses .env)
npm run bootstrap

# Import to test environment (uses .env.test)
npm run bootstrap:test
```

**What it does:**
1. **PRECIOS Import** - 865 parts + 6,408 cross-references
2. **CATALOGACION Import** - 2,304 vehicle applications + part details
3. **Data Validation** - Handles duplicates, long SKUs, orphaned data
4. **Complete Workflow** - Ready-to-use production database

**Expected Results:**
- 865 parts in production
- 6,408 cross-references (after deduplication)
- 2,304 vehicle applications
- 13 orphaned SKUs (documented)

### `check-production.ts` - Database Status
Checks current production database state.

**Usage:**
```bash
npx tsx scripts/check-production.ts
```

**Shows:**
- Record counts for all tables
- Sample data preview
- Empty vs populated status

### `clear-production.ts` - Database Reset
**⚠️ WARNING:** Removes ALL production data!

**Usage:**
```bash
npx tsx scripts/clear-production.ts
```

**Clears:**
- All parts, cross-references, vehicle applications
- Proper cascade order (children first)
- Prepares for fresh import

## Production Workflow

### Initial Setup
1. **Database Schema** - Run `schema.sql` in Supabase SQL Editor
2. **Environment** - Configure `.env` with production Supabase credentials
3. **Bootstrap** - Run `npm run bootstrap` to populate database

### Ongoing Management
1. **Check Status** - `npx tsx scripts/check-production.ts`
2. **Clear Data** - `npx tsx scripts/clear-production.ts` (if needed)
3. **Re-import** - `npm run bootstrap` (for fresh data)

## Safety Features

- ✅ **Environment Separation** - Production (.env) vs Test (.env.test)
- ✅ **Data Validation** - Skips invalid/problematic data
- ✅ **Transaction Safety** - Rollback on errors
- ✅ **Duplicate Handling** - Automatic deduplication
- ✅ **Error Reporting** - Clear status messages and summaries