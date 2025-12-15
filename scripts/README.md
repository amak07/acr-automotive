# ACR Automotive Production Scripts

Management scripts for ACR Automotive production database operations.

## Folder Structure

```
scripts/
├── db/              # Database operations (production-critical)
├── test/            # Testing utilities and validation scripts
├── dev/             # Development utilities and debugging tools
└── README.md        # This file
```

---

## Database Operations (`db/`)

Production-critical scripts for managing database state.

### `bootstrap-import.ts` - Complete Data Import

Imports all data from Excel files into production database.

**Usage:**

```bash
# Import to production (uses .env)
npm run bootstrap

# Import to staging environment (uses .env.staging)
npm run bootstrap:staging
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
npx tsx scripts/db/check-production.ts
# or
npm run check-prod
```

**Shows:**

- Record counts for all tables
- Sample data preview
- Empty vs populated status

### `clear-production.ts` - Database Reset

**⚠️ WARNING:** Removes ALL production data!

**Usage:**

```bash
npx tsx scripts/db/clear-production.ts
# or
npm run clear-prod
```

**Clears:**

- All parts, cross-references, vehicle applications
- Proper cascade order (children first)
- Prepares for fresh import

### `generate-types.js` - TypeScript Type Generation

Generates TypeScript types from Supabase database schema.

**Usage:**

```bash
npm run types:dev    # Generate for development environment
npm run types:prod   # Generate for production environment
```

---

## Testing Utilities (`test/`)

Scripts for validating functionality and testing operations.

### `test-bulk-operations.ts` - Bulk Operations Test

Tests bulk create, update, and delete operations for all entities.

**Usage:**

```bash
npm run test:bulk
```

**Tests:**

- Bulk part creation, updates, deletion
- Bulk cross-reference operations
- Bulk vehicle application operations
- Error handling and rollback

### `test-excel-export.ts` - Excel Export Test

Validates Excel export functionality and format correctness.

**Usage:**

```bash
npm run test:export
```

**Tests:**

- Export format (PRECIOS and CATALOGACION sheets)
- Data accuracy and completeness
- Excel file structure
- Column mappings

### `test-import-pipeline.ts` - Import Pipeline Test

Tests the complete Excel import pipeline end-to-end.

**Usage:**

```bash
npm run test:import-pipeline
```

**Tests:**

- Excel parsing (PRECIOS and CATALOGACION)
- Validation engine
- Diff engine (change detection)
- Import service orchestration

---

## Development Utilities (`dev/`)

Tools for debugging and analyzing data during development.

### `debug-parser.ts` - Parser Debugging

Debugs Excel parser behavior with detailed logging.

**Usage:**

```bash
npx tsx scripts/dev/debug-parser.ts
```

**Features:**

- Step-by-step parsing visualization
- Error detection and reporting
- Data transformation inspection

### `analyze-export.ts` - Export Analysis

Analyzes exported Excel files for quality and format validation.

**Usage:**

```bash
npx tsx scripts/dev/analyze-export.ts
```

**Analyzes:**

- Export file structure
- Data completeness
- Format compliance
- Column integrity

---

## Production Workflow

### Initial Setup

1. **Database Schema** - Run `schema.sql` in Supabase SQL Editor
2. **Environment** - Configure `.env` with production Supabase credentials
3. **Bootstrap** - Run `npm run bootstrap` to populate database

### Ongoing Management

1. **Check Status** - `npm run check-prod`
2. **Clear Data** - `npm run clear-prod` (if needed)
3. **Re-import** - `npm run bootstrap` (for fresh data)

### Testing & Development

1. **Run Tests** - `npm run test:bulk`, `npm run test:export`, `npm run test:import-pipeline`
2. **Debug Issues** - Use scripts in `dev/` folder
3. **Generate Types** - `npm run types:dev` or `npm run types:prod`

## Safety Features

- ✅ **Environment Separation** - Local (.env.local), Staging (.env.staging), Production (.env.production)
- ✅ **Data Validation** - Skips invalid/problematic data
- ✅ **Transaction Safety** - Rollback on errors
- ✅ **Duplicate Handling** - Automatic deduplication
- ✅ **Error Reporting** - Clear status messages and summaries
