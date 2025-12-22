---
title: Testing Guide
description: Testing strategy and guidelines for ACR Automotive
---

# Testing Guide

## Running Tests

```bash
npm test
```

That's it. This automatically:

1. ✅ Snapshots current dev database (preserves your data)
2. ✅ Runs all tests (type-check, unit, integration)
3. ✅ Restores dev database automatically (even if tests fail)
4. ✅ Generates clear Pass/Fail report

**Your dev data is always safe** - site_settings, part_images, and any manual changes are preserved!

**Example Output:**

```
🧪 ACR AUTOMOTIVE TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Preparing test environment...
🐳 Checking Docker container...
   ✅ Container started and healthy
📦 Running migrations...
   ✅ Applied 009_add_sku_normalization.sql
🌱 Seeding test data...
   ✅ Seeded 865 parts (realistic snapshot from remote Test DB)

📝 TypeScript Validation...
🧩 Unit Tests...
🔗 Integration Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL TESTS PASSED

Import Service:        ✅ PASS
Export Service:        ✅ PASS (covered in unit tests)
Validation Engine:     ✅ PASS
Atomic Transactions:   ✅ PASS

Total: 6/6 test suites passed (28.3s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Database Architecture

### Shared Local Instance

Both development and testing use the **same local Supabase instance**:

- **API URL:** `http://localhost:54321`
- **Database:** `postgresql://postgres:postgres@localhost:54322/postgres`
- **Studio:** `http://localhost:54323`

### Smart Snapshot System

Tests automatically:

1. **Snapshot** - Captures current state of test-modified tables (parts, vehicle_applications, cross_references, import_history)
2. **Run** - Tests execute freely, modifying database as needed
3. **Restore** - Original state automatically restored after tests complete

**Config/Media tables are never touched:**

- ✅ `site_settings` - Always preserved
- ✅ `part_images` - Always preserved
- ✅ `part_360_frames` - Always preserved
- ✅ `tenants` - Always preserved

## Manual Database Management

```bash
# Start local Supabase (needed before running tests)
npm run supabase:start

# Check status
npm run supabase:status

# Full reset (drops all tables, re-runs migrations, loads seed data)
npm run supabase:reset

# Stop Supabase
npm run supabase:stop
```

## Seeding the Database

The project includes comprehensive seeding capabilities:

### Option 1: Automatic (via supabase:reset)

```bash
npm run supabase:reset
```

Loads 865 parts from `supabase/seed.sql` (production-like snapshot)

### Option 2: Export from Staging

```bash
npm run staging:export
```

Exports current staging database to `fixtures/seed-data.sql`

### Option 3: Bootstrap from Excel

```bash
npm run bootstrap:test
```

Imports from original Excel files in `archive/original-client-files/`

## Prerequisites

- **Docker Desktop** must be installed and running
- **Local Supabase** must be started: `npm run supabase:start`

## Troubleshooting

### "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop application

### Tests failing with connection errors

**Solution:**

```bash
npm run supabase:start  # Ensure Supabase is running
npm test                # Try again
```

### Database state is messy after failed test

**Solution:**
The snapshot system should auto-restore, but if it didn't:

```bash
npm run supabase:reset  # Full reset with seed data
```

### Snapshot/restore failed

If you see restore errors, manually reset:

```bash
npm run supabase:reset
```

This will restore the database to a known good state with seed data.

## What Gets Tested

| Test Suite            | What It Tests                                       | Duration |
| --------------------- | --------------------------------------------------- | -------- |
| Type Check            | TypeScript validation                               | ~2s      |
| Jest Unit Tests       | Business logic (DiffEngine, ValidationEngine, etc.) | ~8s      |
| Fixture Validation    | All error codes E1-E20, W1-W10                      | ~3s      |
| Import Pipeline       | Full import workflow + rollback                     | ~7s      |
| Atomic Tests          | Transaction isolation + constraints                 | ~4s      |
| **Public Search RPC** | **Vehicle search, SKU normalization, performance**  | **~3s**  |
| **Public Search API** | **Image enrichment, pagination, validation**        | **~1s**  |

**Total:** ~30 seconds for complete test suite

### Test Coverage Breakdown

**Core Business Logic** (73 tests):

- ValidationEngine: 13 tests
- DiffEngine: 30+ tests
- ExcelExportService: 30+ tests

**UI Components** (123 tests):

- Import Wizard: 31 tests
- Upload Step: 36 tests
- Validation Step: 56 tests

**Public Search** (35 tests):

- RPC Functions: 25 tests (vehicle search, SKU normalization, performance)
- API Layer: 10 tests (enrichment, pagination, validation)

**Integration Tests**:

- Full import pipeline
- Atomic transaction tests
- Database constraint tests

**Total Test Count:** ~235 tests

## Development Workflow

### Daily Development

```bash
# Morning: Ensure Docker is running
npm run db:test:start  # Optional - test runner starts it automatically

# Work on features
npm run dev  # Uses remote Supabase

# Before commits
npm test     # Run full test suite
```

### When You Make Changes

**Schema changes** (schema.sql or migrations):

```bash
npm run db:test:reset  # Apply new schema
npm test               # Verify tests pass
```

**Seed data changes** (fixtures/seed-data.sql):

```bash
npm run db:test:reset  # Load new seed data
npm test               # Verify tests pass
```

**Need to refresh seed data from remote Test DB?**

```bash
npm run db:export-snapshot  # Export realistic subset from remote
# This updates fixtures/seed-data.sql with latest data
npm run db:test:reset       # Load fresh seed
npm test                    # Verify all tests pass
```

## Advanced Testing

### API Route Testing (Excluded from npm test)

API route tests require a running dev server and are NOT included in `npm test` (which uses local Docker DB). To test API endpoints:

```bash
# Terminal 1: Start dev server with remote Supabase
npm run dev

# Terminal 2: Run API tests manually
tsx scripts/test/test-api-import-routes.ts
tsx scripts/test/test-bulk-operations.ts
tsx scripts/test/test-export-api.ts
```

**Why excluded?** API tests require:

- Next.js dev server running
- HTTP endpoints accessible
- Remote Supabase authentication

Local Docker testing focuses on:

- ✅ Direct service testing (faster, more reliable)
- ✅ Database operations
- ✅ Business logic validation

### Regenerating Test Data

```bash
# Generate baseline export from seeded database
npm run test:generate-baseline

# Export fresh seed data from remote Test DB
npm run db:export-snapshot
```

## Testing Philosophy

### Snapshot-Based Testing

We use snapshot-based test data restoration for speed and consistency:

- **Golden baseline:** 865 parts exported from production
- **Fast resets:** ~2s to restore database state between test runs
- **Reproducible:** Same data every test run, no flakiness

### Fixture-Driven Validation

All validation rules are tested via Excel fixtures:

- **Error fixtures:** Test each error code (E2-E8) with specific scenarios
- **Warning fixtures:** Test each warning code (W1-W10) with data changes
- **Happy path fixtures:** Valid data scenarios for positive testing

### Service-Layer Focus

Tests target business logic directly for speed and reliability:

- ✅ **ValidationEngine, DiffEngine, ImportService** - Core business logic
- ✅ **Database operations** - Direct Supabase client calls
- ✅ **Excel parsing/export** - File format validation
- ⚠️ **API routes** - Require manual testing (dev server dependency)

### One Command Philosophy

**`npm test` does everything:**

- No need to remember multiple test scripts
- Automatic database lifecycle management
- Clear Pass/Fail reporting by service
- Simpler mental model for developers and AI coding agents

---

## Testing Tech Stack

### Test Framework & Tooling

- **Jest** - Unit test runner with built-in coverage reporting
- **@testing-library/react** - UI component testing with accessibility best practices
- **@testing-library/jest-dom** - Enhanced DOM assertions
- **@testing-library/user-event** - User interaction simulation

### Database & Infrastructure

- **Docker Postgres 15** - Local test database (isolated from production)
- **pg** - PostgreSQL client for migrations and seeding
- **Supabase client** - Integration tests using direct database access

### Data & Fixtures

- **ExcelJS** - Generate test fixtures programmatically
- **fixture-loader** - Load Excel fixtures as File objects for parsing tests
- **seedDbState()** - Mock database state for validation tests (no DB required)

### Code Coverage

- **Jest built-in coverage** - `--coverage` flag enabled
- **Target:** >80% coverage for business logic (ValidationEngine, DiffEngine)
- See [UNIT_TEST_COVERAGE.md](./testing/UNIT_TEST_COVERAGE.md) for detailed metrics

---

## Known Limitations

### 1. API Route Tests Not Included in `npm test`

API tests (`test-api-*.ts`) are excluded from the automated test suite because they require:

- ✗ Next.js dev server running (`npm run dev`)
- ✗ HTTP endpoints accessible at localhost:3000
- ✗ Remote Supabase authentication

**Workaround:** Run API tests manually when needed:

```bash
# Terminal 1
npm run dev

# Terminal 2
tsx scripts/test/test-api-import-routes.ts
tsx scripts/test/test-bulk-operations.ts
tsx scripts/test/test-export-api.ts
```

### 2. Docker Required for Local Testing

All automated tests use local Docker Postgres for speed and isolation:

- ✅ **Pros:** Fast, consistent, offline testing
- ✅ **Pros:** No network latency, no Supabase rate limits
- ❌ **Cons:** Requires Docker Desktop installed and running
- ❌ **Cons:** Won't work in CI/CD environments without Docker support (e.g., Vercel builds)

**Solution for CI/CD:** Use GitHub Actions (supports Docker) - see Future Enhancements below.

### 3. UI Component Tests Use Mocked i18n

UI component tests mock the `useLocale` hook to return translation keys directly:

```typescript
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
```

This means tests verify translation **keys** are used, not actual translated text.

### 4. Manual Testing Still Required

Automated tests cover core business logic, but manual testing is needed for:

- End-to-end user workflows (see [UX_TESTING_GUIDE.md](./testing/UX_TESTING_GUIDE.md))
- Visual design and responsive behavior
- Browser compatibility across Chrome/Firefox/Safari
- Accessibility with screen readers

---

## Future Enhancements

### CI/CD Integration

**Current Status:** Tests run locally only (Docker required)

**Planned Improvement:**

- **GitHub Actions workflow** - Run full test suite on push/PR
  - Use GitHub-hosted runners with Docker support
  - Automatic test result comments on pull requests
  - Block merges if tests fail
- **Vercel build integration** - Type checking only (no Docker in Vercel)
  - Run `tsc --noEmit` during Vercel builds
  - Ensure TypeScript errors block deployments
- **Test result reporting** - Save coverage reports as artifacts

**Estimated Effort:** 4-6 hours
**Priority:** Medium
**Blocker:** None - can implement anytime

### Additional Test Coverage

**Planned Additions:**

- **API endpoint integration tests** - Eliminate manual API testing
  - Mock Next.js server environment
  - Test all API routes automatically
- **End-to-end browser tests** - Playwright or Cypress
  - Test complete user workflows in real browser
  - Visual regression testing
- **Performance testing** - Benchmark import/export with large datasets
  - 10,000+ parts import time tracking
  - Memory usage profiling

**Estimated Effort:** 12-16 hours
**Priority:** Low
**Blocker:** Manual testing currently sufficient

### Test Infrastructure Improvements

- **Parallel test execution** - Speed up test suite (currently ~28s)
- **Watch mode improvements** - Better developer experience
- **Test data versioning** - Track golden baseline changes over time

---

## PostgREST Cache Behavior

**Issue:** When RPC functions with `SECURITY DEFINER` write data to PostgreSQL, PostgREST may not immediately see the committed changes due to transaction isolation and schema caching.

### Problem Manifestation

Tests that follow this pattern may fail:

```typescript
// 1. RPC function writes data
const { data, error } = await supabase.rpc('execute_atomic_import', {
  parts_to_add: [{ id: partId, acr_sku: 'ACR-123', ... }]
});

// 2. Immediate SELECT returns null (even though RPC succeeded!)
const { data: part } = await supabase
  .from('parts')
  .select('*')
  .eq('id', partId)
  .single();

// ❌ This assertion fails: part is null
expect(part).toBeDefined();
```

### Root Cause

- **SECURITY DEFINER functions** run with elevated privileges in a separate transaction context
- **PostgREST** maintains a schema cache and may not see committed data immediately
- **Service role key** vs **anon key** - both experience this delay
- **Timing**: The data exists in PostgreSQL but PostgREST's view is stale

### Solution: Retry Pattern

Use the `retryQuery()` helper from [tests/helpers/retry.ts](../tests/helpers/retry.ts):

```typescript
import { retryQuery } from "../helpers/retry";

// After RPC write, use retry for SELECT queries
const { data: part } = await retryQuery<any>(
  async () => await supabase.from("parts").select("*").eq("id", partId).single()
);

expect(part).toBeDefined(); // ✅ Now passes
```

### How It Works

The retry helper implements exponential backoff:

- **Initial delay**: 50ms
- **Max delay**: 200ms per retry
- **Max retries**: 5 attempts
- **Timeout**: 1000ms total
- **Early exit**: Returns immediately when data found

**Performance Impact:** Minimal - most queries succeed on first attempt (0ms delay). Failed first attempts retry within 50-200ms.

### When to Use Retry Pattern

**✅ Use retry for:**

- SELECT queries immediately after RPC functions that INSERT/UPDATE data
- Tests that verify RPC function side effects
- Any read-after-write pattern with RPC functions

**❌ Don't use retry for:**

- Regular SELECT queries (not after RPC writes)
- RPC function calls themselves (they don't need retry)
- DELETE operations (use normal await)
- Tests expecting null results (e.g., testing rollback behavior)

### Example: Atomic Import Tests

The `atomic-import-rpc.test.ts` file demonstrates this pattern extensively:

```typescript
// ✅ GOOD: Using retry after RPC write
const { data, error } = await supabase.rpc('execute_atomic_import', {
  parts_to_add: [...]
});

const { data: part } = await retryQuery<any>(async () =>
  await supabase.from('parts').select('*').eq('id', partId).single()
);

// ✅ GOOD: Testing rollback (expects null, no retry needed)
const { data, error } = await supabase.rpc('execute_atomic_import', {
  parts_to_add: [{ id: 'invalid-uuid', ... }]
});

const { data: part } = await supabase
  .from('parts')
  .select('*')
  .eq('id', partId)
  .single();

expect(part).toBeNull(); // Expects null - no retry needed
```

### Historical Context

This issue was discovered when migrating from plain Docker Postgres to Supabase CLI for local development. The atomic import RPC tests (20 tests) exhibited this pattern:

- **8 tests passed** (only checked RPC return values, didn't query DB after)
- **12 tests failed** (queried DB immediately after RPC writes - SELECT returned null)

After implementing the retry pattern:

- **19 tests passed** ✅
- **1 test failed** (unrelated tenant filtering issue)

### Alternative Approaches (Not Recommended)

1. **Direct Postgres client (`pg`)** - Bypasses PostgREST but requires different connection setup
2. **Remove SECURITY DEFINER** - Reduces function privileges, may cause RLS issues
3. **Reload PostgREST schema** - Not feasible per-test, slows down suite
4. **Change pool mode** - Affects all operations, may have side effects

The retry pattern is the most reliable, performant, and maintainable solution.

---

## More Documentation

- **[LOCAL_DATABASE_SETUP.md](./testing/LOCAL_DATABASE_SETUP.md)** - Detailed Docker database documentation
- **[UNIT_TEST_COVERAGE.md](./testing/UNIT_TEST_COVERAGE.md)** - Test coverage metrics
- **[UX_TESTING_GUIDE.md](./testing/UX_TESTING_GUIDE.md)** - Manual UI testing procedures
- **[TEST_DATA_MANAGEMENT.md](./testing/TEST_DATA_MANAGEMENT.md)** - Fixture management and generation
- **[TESTING_GUIDE.md](./testing/TESTING_GUIDE.md)** - Quick reference for test commands

---

**Questions?** See [LOCAL_DATABASE_SETUP.md](./testing/LOCAL_DATABASE_SETUP.md) for troubleshooting or [PLANNING.md](./PLANNING.md) for architecture details.
