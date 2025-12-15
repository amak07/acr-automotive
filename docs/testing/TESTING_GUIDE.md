# Testing Guide - ACR Automotive

**Last Updated**: October 30, 2025

---

## 📚 Documentation Index

- **[TEST_DATA_MANAGEMENT.md](./TEST_DATA_MANAGEMENT.md)** - Test file generation, organization, and baseline management
- **[UNIT_TEST_COVERAGE.md](./UNIT_TEST_COVERAGE.md)** - Coverage tracking and metrics
- **[UX_TESTING_GUIDE.md](./UX_TESTING_GUIDE.md)** - Manual UX, accessibility, and browser testing
- **This file** - Quick reference and essential test commands

---

## Quick Reference

### Essential Tests (Run These Regularly)

```bash
# 1. Verify migration 008 is applied
npm run test:verify-migration-008

# 2. Test full import/export pipeline (THE MAIN TEST)
npm run test:full-pipeline

# 3. Test validation layer
npm run test:atomic

# 4. Run unit tests
npm test
```

**Expected Time**: ~10 seconds total

---

## Test Categories

### 1. Core System Tests

**Full Import Pipeline** (The Most Important Test)

```bash
npm run test:full-pipeline
```

**What it tests**:

- Parse Excel → Validate → Diff → Import → Rollback
- Atomic transactions (7,716+ changes in single transaction)
- Snapshot creation and restoration
- Import history tracking

**When to run**: Before committing changes, before deploying

**Expected result**: All steps pass, ~7 seconds total

---

**Validation Layer Tests**

```bash
npm run test:atomic              # Run both tests
npm run test:atomic:constraint   # Test duplicate SKU handling
npm run test:atomic:fk           # Test FK violation handling
```

**What it tests**:

- Validation catches duplicate SKUs (E2 error)
- Validation catches orphaned references (E12/E13 errors)
- Database remains unchanged when validation fails

**When to run**: When modifying ValidationEngine

**Expected result**: Both pass, validation prevents bad imports

---

**Migration Verification**

```bash
npm run test:verify-migration-008
```

**What it tests**:

- `execute_atomic_import()` function exists in database
- Function is callable with correct parameters

**When to run**: After applying migration, after database changes

**Expected result**: Function found and callable

---

### 2. Unit Tests (Jest)

```bash
npm test                  # Run all unit tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

**What's tested**:

- ValidationEngine: 100% coverage (23 error codes, 12 warning codes)
- ImportService: Atomic transaction structure, retry logic

**When to run**: During development, before commits

**Expected result**: All tests pass

---

### 3. API Endpoint Tests

**Import/Rollback API Routes**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run API tests
npm run test:api:import
```

**What it tests**:

- POST `/api/admin/import/validate`
- POST `/api/admin/import/preview`
- POST `/api/admin/import/execute`
- GET `/api/admin/import/history`
- GET `/api/admin/rollback/available`
- POST `/api/admin/rollback/execute`

**When to run**: When developing admin UI, before deploying

**Expected result**: All 7 tests pass

---

### 4. Utility Tests

**Read-Only Import Pipeline**

```bash
npm run test:import-pipeline
```

- Safe to run on any database (no writes)
- Tests: Parse → Validate → Diff only
- Useful for testing Excel files without modifying database

**All Fixtures Test**

```bash
npm run test:all-fixtures
```

- Tests all validation fixtures (`fixtures/excel/unit/*.xlsx`)
- Verifies all error codes work correctly

---

### 5. Test Data Generation

**Generate All Test Data**

```bash
npm run test:generate
```

- Generates unit test fixtures (8 files)
- Generates integration scenarios (9 files)
- Schema-aware: automatically adapts to new columns

**Generate Specific Types**

```bash
npm run test:generate:unit        # Unit fixtures only
npm run test:generate:scenarios   # Integration scenarios only
```

**Regenerate Test Baseline**

```bash
npm run test:generate-baseline    # Export local Docker database to fixtures/baseline-export.xlsx
```

**When to regenerate:**

- After schema changes (new columns)
- After TEST database changes
- When validation rules change

**See:** [TEST_DATA_MANAGEMENT.md](./TEST_DATA_MANAGEMENT.md) for complete documentation

---

**Bulk Operations API**

```bash
# Terminal 1: npm run dev
# Terminal 2:
npm run test:bulk
```

- Tests BulkOperationsService API endpoints
- Requires dev server running

---

## Development Workflow

### Before Starting Work

```bash
npm run test:verify-migration-008   # Confirm database ready
```

### During Development

```bash
npm run test:watch                  # Run unit tests in watch mode
npm run test:import-pipeline        # Test changes without DB writes
```

### Before Committing

```bash
npm run type-check                  # TypeScript check
npm test                            # Unit tests
npm run test:full-pipeline          # Integration test
```

### Before Deploying

```bash
npm run test:full                   # Type check + unit tests
npm run test:full-pipeline          # Full integration
npm run test:api:import             # API endpoints (with dev server)
```

---

## Test Database Management

**Export Test Data**

```bash
npm run test:export-test
```

- Exports test database to Excel
- Output: `tmp/test-export.xlsx`

**Reset Test Database**

```bash
npm run test:reset-db
```

- ⚠️ **Destructive**: Clears all data from test database
- Use before fresh import testing

**Generate Test Fixtures**

```bash
npm run test:generate-fixtures
```

- Creates Excel test files for validation testing
- Output: `fixtures/excel/*.xlsx`

---

## Understanding Test Results

### ✅ Success Indicators

**Full Pipeline Test**:

```
✅ Parsed in ~300ms
✅ Validated in ~70ms
✅ Import completed in ~3829ms
✅ Rollback completed in ~1735ms
```

**Validation Tests**:

```
🎉 TEST PASSED: Validation prevented duplicate SKU import!
🎉 TEST PASSED: Validation prevented orphaned reference import!
```

### ❌ Common Failures

**Migration Not Applied**:

```
❌ Migration 008 NOT applied
The execute_atomic_import() function does not exist.
```

**Solution**: Apply migration 008 via Supabase Dashboard SQL Editor

**Dev Server Not Running** (for API tests):

```
Error: fetch failed
```

**Solution**: Start dev server in another terminal (`npm run dev`)

**Wrong Database**:

```
Error: Expected X parts, got Y parts
```

**Solution**: Verify using test database (`.env.test`), not production

---

## What Each Test Proves

| Test                        | Proves                                                                                           | Runtime |
| --------------------------- | ------------------------------------------------------------------------------------------------ | ------- |
| `test:full-pipeline`        | ✅ Atomic transactions work<br>✅ Rollback works<br>✅ Snapshots work<br>✅ Import history works | ~7s     |
| `test:atomic`               | ✅ Validation catches bad data<br>✅ Database protected                                          | ~3s     |
| `test:verify-migration-008` | ✅ Migration applied<br>✅ Function callable                                                     | ~1s     |
| `npm test`                  | ✅ Validation logic correct<br>✅ Import service structure correct                               | ~2s     |
| `test:api:import`           | ✅ API endpoints work<br>✅ Request/response formats correct                                     | ~10s    |

**Total comprehensive test time**: ~23 seconds

---

## Test Files Reference

### Keep (Essential)

- `test-full-import-pipeline.ts` - **Main integration test**
- `test-atomic-constraint-violation.ts` - Duplicate SKU validation
- `test-atomic-fk-violation.ts` - FK violation validation
- `test-api-import-routes.ts` - API endpoint testing
- `verify-migration-008.ts` - Migration verification

### Keep (Utilities)

- `test-import-pipeline.ts` - Read-only testing
- `test-all-fixtures.ts` - Fixture validation
- `export-from-test-db.ts` - Data export
- `reset-test-db.ts` - Database cleanup
- `generate-fixtures.ts` - Fixture generation

### Keep (Legacy/Specific)

- `test-bulk-operations.ts` - BulkOperationsService API
- `test-excel-export.ts` - Export functionality
- `verify-schema.ts` - Schema verification

---

## Troubleshooting

**Tests hang or timeout**:

- Check database connection (`.env.test` configured correctly)
- Verify test database is responsive
- Check for network issues

**Tests fail unexpectedly**:

- Run `npm run test:reset-db` to clean test database
- Verify migration 008 is applied
- Check test database has no stale data

**API tests fail**:

- Ensure dev server is running (`npm run dev`)
- Check server is on port 3000
- Verify no authentication issues

---

## Philosophy

**Our testing strategy**:

1. **One comprehensive integration test** (`test:full-pipeline`) proves the system works end-to-end
2. **Targeted validation tests** prove the safety layer works
3. **Unit tests** verify individual component logic
4. **API tests** ensure frontend/backend contract is correct

**We avoid**:

- Testing the same thing multiple ways
- Over-mocking (prefer real database for integration tests)
- Brittle tests that break with refactoring

**Result**: ~23 seconds of tests that give high confidence with low maintenance

---

## Need Help?

**Tests failing after code changes?**

1. Run `npm run type-check` first (catch TypeScript errors)
2. Run `npm test` (check unit test logic)
3. Run `npm run test:full-pipeline` (integration test)
4. Check error messages carefully - they're descriptive

**Adding new features?**

1. If adding validation rules: Update ValidationEngine unit tests
2. If changing import logic: Verify `test:full-pipeline` still passes
3. If adding API endpoints: Add tests to `test-api-import-routes.ts`

**Before asking for help**:

- Run all tests to identify which area is failing
- Check recent git changes
- Verify test database is clean (`npm run test:reset-db`)
