# Testing Infrastructure Documentation

> **Last Updated**: October 30, 2025 (Session 21)
> **Status**: Testing infrastructure consolidated and operational

## Table of Contents

1. [Overview](#overview)
2. [Master Test Command](#master-test-command)
3. [Test Categories](#test-categories)
4. [Test File Generation](#test-file-generation)
5. [Running Tests](#running-tests)
6. [Known Issues](#known-issues)
7. [Test Architecture](#test-architecture)
8. [UX Testing](#ux-testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

ACR Automotive uses a comprehensive testing strategy that combines:
- **Jest unit tests** - Traditional Jest tests for business logic
- **Integration tests** - Custom scripts for database operations
- **Fixture tests** - Validation rule testing with Excel fixtures
- **Pipeline tests** - End-to-end import/export/rollback testing

All tests are run via a single master command: `npm test`

---

## Master Test Command

### `npm test`

The master test suite runs ALL tests in sequence:

```bash
npm test
```

**Execution Order:**
1. **TypeScript type checking** (`npm run type-check`)
2. **Jest unit tests** (6 test suites, ~69 tests)
3. **Fixture validation tests** (`npm run test:all-fixtures` - 7 fixtures)
4. **Full import pipeline test** (`npm run test:full-pipeline` - E2E with rollback)
5. **Atomic transaction tests** (`npm run test:atomic` - constraint + FK violation)

**Expected Duration:** ~30-60 seconds (depending on database operations)

**Exit Behavior:**
- Stops at first failure (type errors, Jest failures, etc.)
- Returns non-zero exit code on any failure
- CI-friendly for automated testing

---

## Test Categories

### 1. Jest Unit Tests (`npm run test:unit`)

**Location:** `tests/unit/` and `src/lib/excel/__tests__/`

**Test Files:**
- `tests/unit/excel/diff-engine.test.ts` - Diff detection logic (ADD/UPDATE/DELETE)
- `tests/unit/excel/export-service.test.ts` - Excel export formatting and structure
- `tests/unit/excel/import-service-atomic.test.ts` - Transaction atomicity
- `tests/unit/excel/validation-engine.test.ts` - Validation rules (E1-E19, W1-W10)
- `src/lib/excel/__tests__/catalogacion-parser.test.ts` - Legacy parser
- `src/lib/excel/__tests__/precios-parser.test.ts` - Legacy parser

**Run Individual Suite:**
```bash
npx jest tests/unit/excel/diff-engine.test.ts
npx jest tests/unit/excel/export-service.test.ts --watch
```

**Current Status:**
- ✅ 63/69 tests passing
- ❌ 6 tests failing (see Known Issues below)

### 2. Fixture Validation Tests (`npm run test:all-fixtures`)

**Location:** `scripts/test/test-all-fixtures.ts`

**Purpose:** Validates that test fixtures produce expected validation errors/warnings

**Fixtures Tested (7 total):**
1. ✅ `valid-add-new-parts.xlsx` - Valid new parts (ADD operations)
2. ✅ `valid-update-existing.xlsx` - Valid updates (E4 errors expected without DB seed)
3. ✅ `error-missing-required-fields.xlsx` - E3 errors (2 expected)
4. ✅ `error-duplicate-skus.xlsx` - E2 errors (1 expected)
5. ✅ `error-orphaned-references.xlsx` - E4 + E5 errors (5 expected)
6. ✅ `error-invalid-formats.xlsx` - E4 + E5 + E6 + E8 errors (9 expected)
7. ✅ `error-max-length-exceeded.xlsx` - E7 errors (1 expected)

**Current Status:** ✅ All 7 fixtures passing with accurate expectations

**Important:** Test expectations are ALWAYS accurate. If a test fails, fix the fixture generation code, not the expectations.

### 3. Full Import Pipeline Test (`npm run test:full-pipeline`)

**Location:** `scripts/test/test-full-import-pipeline.ts`

**Purpose:** End-to-end test of complete import workflow

**Test Sequence:**
1. Parse Excel file with `ExcelImportService`
2. Validate data with `ValidationEngine`
3. Generate diff with `DiffEngine`
4. Execute import with `ImportService` (creates snapshot)
5. Verify snapshot was created
6. Test rollback with `RollbackService`
7. Verify rollback restored data

**Database Impact:** ⚠️ **MODIFIES DATABASE** - Use `.env.test` only!

**Current Status:** ✅ Passing (6.5s execution time)

### 4. Atomic Transaction Tests (`npm run test:atomic`)

**Location:**
- `scripts/test/test-atomic-constraint-violation.ts`
- `scripts/test/test-atomic-fk-violation.ts`

**Purpose:** Verify transaction rollback on constraint/FK violations

**Tests:**
- Constraint violation test - Ensures duplicate key violations rollback entire transaction
- FK violation test - Ensures orphaned foreign key violations rollback entire transaction

**Database Impact:** ⚠️ **MODIFIES DATABASE** - Use `.env.test` only!

**Current Status:** ✅ Both tests passing

### 5. Integration Test Scenarios

**Location:** `fixtures/excel/scenarios/` (generated files, not tests)

**Purpose:** Large realistic test files for manual E2E testing in Import Wizard UI

**Scenario Files (9 total):**
- `01-quarterly-update.xlsx` - 100 parts with updates
- `02-seasonal-refresh.xlsx` - 50 adds, 30 updates, 20 deletes
- `03-minor-corrections.xlsx` - 10 small updates
- `04-all-warnings.xlsx` - Triggers W1-W10 warnings
- `error-e1-missing-ids.xlsx` - Missing hidden ID columns
- `error-e2-duplicate-sku.xlsx` - Duplicate ACR_SKU
- `error-e3-empty-fields.xlsx` - Missing required fields
- `error-e5-orphaned-fk.xlsx` - Orphaned foreign keys
- `error-e6-invalid-year-range.xlsx` - Year range errors

**Usage:** Manual testing in browser with Import Wizard UI

---

## Test File Generation

### Generate All Test Data

```bash
# Generate both unit fixtures AND integration scenarios
npm run test:generate
```

### Generate Unit Fixtures Only

```bash
# Creates 8 files in fixtures/excel/unit/
npm run test:generate:unit
```

**Generated Files:**
1. `valid-add-new-parts.xlsx` - 5 new parts
2. `valid-update-existing.xlsx` - 3 parts with existing IDs
3. `error-duplicate-skus.xlsx` - Duplicate SKU errors
4. `error-missing-required-fields.xlsx` - Missing ACR_SKU and Part_Type
5. `error-orphaned-references.xlsx` - Invalid foreign keys
6. `error-invalid-formats.xlsx` - Invalid UUIDs, year ranges
7. `error-max-length-exceeded.xlsx` - String length violations
8. `warning-data-changes.xlsx` - Data change warnings (not tested - needs DB seed)

### Generate Integration Scenarios Only

```bash
# Creates 9 files in fixtures/excel/scenarios/
npm run test:generate:scenarios
```

**Requirements:** Needs baseline export file from production/test database

**Baseline Generation:**
```bash
# Generate baseline export (prerequisite for scenarios)
npm run test:export-baseline
```

---

## Running Tests

### Quick Reference

```bash
# Master test suite (runs everything)
npm test

# Individual test categories
npm run test:unit                    # Jest only
npm run type-check                   # TypeScript validation
npm run test:all-fixtures            # Fixture validation
npm run test:full-pipeline           # E2E import/rollback
npm run test:atomic                  # Transaction tests

# Jest with watch mode
npm run test:watch

# Jest with coverage
npm run test:coverage

# Other utility tests
npm run test:import-pipeline         # Parse/validate/diff only (no DB writes)
npm run test:bulk                    # Bulk operations test
npm run test:export-api              # Export API test
npm run test:api:import              # Import API routes test
```

### Environment Setup

**Test Database Required:**

Create `.env.test` with test database credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
```

**⚠️ CRITICAL:** Never point `.env.test` at production database!

### Database Reset

```bash
# Reset test database to clean state
npm run test:reset-db
```

**WARNING:** This drops and recreates all tables!

---

## Known Issues

### Jest Test Failures (6 failing, 63 passing)

**Status:** Pre-existing failures from business logic changes, not test infrastructure issues

#### 1. DiffEngine Tests (2 failures)

**Issue:** `acr_sku` not being detected in change tracking

**Failing Tests:**
- `should detect ALL vehicle field changes` - Missing `acr_sku` in changes array
  - Expected: `["_part_id", "acr_sku", "make", "model", "start_year", "end_year"]`
  - Received: `["_part_id", "make", "model", "start_year", "end_year"]`

- `should detect ALL cross reference field changes` - Missing `acr_sku` in changes array
  - Expected: `["_acr_part_id", "acr_sku", "competitor_brand", "competitor_sku"]`
  - Received: `["_acr_part_id", "competitor_brand", "competitor_sku"]`

**Root Cause:** DiffEngine may be treating `acr_sku` as a derived field (joined from parts table) and not tracking changes to it in vehicle_applications and cross_references sheets.

**Impact:** Medium - Change detection works but doesn't report `acr_sku` field changes

**Fix Required:** Update DiffEngine to include `acr_sku` in field comparison for vehicle apps and cross refs

#### 2. ValidationEngine Tests (4 failures)

**Issue:** Test fixtures missing vehicle_applications and cross_references data

**Failing Tests:**
- `should detect missing required fields across all sheets`
  - Expected vehicle errors > 0, got 0
  - Expected cross ref errors > 0, got 0
  - Root cause: Test fixture only has parts data, no vehicle/cross ref data

- `should detect orphaned references to non-existent parts`
  - Expected cross ref orphans > 0, got 0
  - Root cause: Test fixture missing cross ref data

- `should detect data changes and generate warnings`
  - Expected valid=true (warnings don't block), got valid=false
  - Root cause: Fixture has E4 UUID errors because IDs don't exist in database

- `should correctly set valid=true when only warnings exist`
  - Expected valid=true, got valid=false
  - Same root cause as above

**Root Cause:** Test fixtures were created before validation rules were finalized. Tests expect multi-sheet validation but fixtures only test single sheets.

**Impact:** Low - Actual validation engine works correctly, tests just need better fixtures

**Fix Required:**
1. Create comprehensive test fixtures with all three sheets
2. Mock database data for warning tests
3. Update test expectations to match actual validation behavior

---

## Test Architecture

### File Structure

```
acr-automotive/
├── tests/
│   └── unit/
│       └── excel/
│           ├── diff-engine.test.ts          # Jest unit tests
│           ├── export-service.test.ts       # Jest unit tests
│           ├── import-service-atomic.test.ts # Jest unit tests
│           └── validation-engine.test.ts    # Jest unit tests
├── scripts/
│   └── test/
│       ├── generate-all-test-data.ts        # 🔧 Fixture/scenario generator
│       ├── generate-test-baseline.ts        # Baseline export for scenarios
│       ├── test-all-fixtures.ts             # Fixture validation tests
│       ├── test-full-import-pipeline.ts     # E2E pipeline test
│       ├── test-import-pipeline.ts          # Read-only pipeline test
│       ├── test-atomic-constraint-violation.ts
│       ├── test-atomic-fk-violation.ts
│       ├── test-bulk-operations.ts
│       ├── test-export-api.ts
│       ├── test-api-import-routes.ts
│       ├── reset-test-db.ts
│       └── helpers/
│           └── fixture-loader.ts            # Helper functions
└── fixtures/
    └── excel/
        ├── unit/                            # Small focused test files (8 files)
        │   ├── valid-add-new-parts.xlsx
        │   ├── valid-update-existing.xlsx
        │   ├── error-duplicate-skus.xlsx
        │   ├── error-missing-required-fields.xlsx
        │   ├── error-orphaned-references.xlsx
        │   ├── error-invalid-formats.xlsx
        │   ├── error-max-length-exceeded.xlsx
        │   └── warning-data-changes.xlsx
        └── scenarios/                       # Large realistic files (9 files)
            ├── 01-quarterly-update.xlsx
            ├── 02-seasonal-refresh.xlsx
            ├── 03-minor-corrections.xlsx
            ├── 04-all-warnings.xlsx
            ├── error-e1-missing-ids.xlsx
            ├── error-e2-duplicate-sku.xlsx
            ├── error-e3-empty-fields.xlsx
            ├── error-e5-orphaned-fk.xlsx
            └── error-e6-invalid-year-range.xlsx
```

### Schema-Aware Test Generation

**Key Principle:** Test fixtures import column definitions from shared constants to ensure they match the production schema exactly.

**Source of Truth:** `src/services/excel/shared/constants.ts`

```typescript
import {
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS,
  SHEET_NAMES
} from '@/services/excel/shared';
```

**Benefits:**
- Fixtures automatically reflect schema changes
- No duplicate column definitions
- Hidden ID columns handled correctly
- Column widths, headers, and formatting match production

### Type System Updates (October 30, 2025)

**ParsedSheet Structure:**
```typescript
export interface ParsedSheet<T> {
  sheetName: string;
  data: T[];
  rowCount: number;
  hasHiddenIds: boolean;
}
```

**ParsedExcelFile Structure:**
```typescript
export interface ParsedExcelFile {
  parts: ParsedSheet<ExcelPartRow>;
  vehicleApplications: ParsedSheet<ExcelVehicleAppRow>;
  crossReferences: ParsedSheet<ExcelCrossRefRow>;
  metadata: {
    uploadedAt: Date;
    fileName: string;
    fileSize: number;
  };
}
```

**Important:** Old tests used per-sheet `metadata` property. This was refactored to file-level metadata on Oct 30, 2025. All tests have been updated.

---

## UX Testing

Manual testing procedures for user experience, accessibility, and browser compatibility.

**See**: **[UX_TESTING_GUIDE.md](./testing/UX_TESTING_GUIDE.md)** for complete manual testing procedures.

### When to Run

- **Pre-release**: Before production deploy (2-4 hours full validation)
- **After UI changes**: Wizard modifications (30-minute smoke test)
- **Quarterly**: Accessibility compliance audit (1 hour)

### What's Tested

**Automated tests** (262 passing) cover business logic, UI components, and database operations.

**Manual UX tests** complement automated tests by validating:
- Real browser behavior (iPad Safari, Chrome, Firefox, etc.)
- Accessibility (keyboard navigation, screen readers)
- Error message clarity for non-technical users
- Performance perception (progress indicators, loading feedback)

**Priority**: iPad Safari is **primary device** for parts counter staff - must work flawlessly.

---

## Troubleshooting

### TypeScript Errors

**Symptom:** `npm test` fails at type-check step

**Solution:**
```bash
# Clear cache and recheck
rm -rf .next tsconfig.tsbuildinfo
npm run type-check
```

**Common Issues:**
- Translation keys missing from `translation-keys.ts`
- Optional callbacks called without `?.` operator
- Buffer type mismatches (use `as any` for ExcelJS compatibility)
- `null` vs `undefined` in optional fields (use `undefined`)

### Jest Failures

**Symptom:** Tests pass locally but fail in CI

**Common Causes:**
- Database not seeded with baseline data
- Environment variables not set (`.env.test` missing)
- Timezone differences (use UTC in tests)
- File path differences (Windows vs Linux)

**Debug Commands:**
```bash
# Run specific test file
npx jest tests/unit/excel/diff-engine.test.ts

# Run with verbose output
npx jest --verbose

# Run with test name pattern
npx jest -t "should detect ADD operations"
```

### Fixture Generation Errors

**Symptom:** Duplicate headers or misaligned data in generated fixtures

**Root Cause:** `addWorksheet` function manually adding ID columns when they're already in column definitions

**Fix Applied (Oct 30, 2025):** Refactored to use column definitions directly

**Verification:**
```bash
# Regenerate all fixtures
npm run test:generate

# Verify structure
npx xlsx fixtures/excel/unit/valid-add-new-parts.xlsx
```

### Database Connection Issues

**Symptom:** Tests timeout or fail with "fetch failed" errors

**Checklist:**
1. ✅ `.env.test` exists with valid credentials
2. ✅ Test database is accessible (not behind firewall)
3. ✅ Service role key has correct permissions
4. ✅ Database schema is up to date (run migrations)

**Reset Database:**
```bash
npm run test:reset-db
```

### Test Expectation Mismatches

**Philosophy:** Expectations should ALWAYS be accurate. If a test fails, fix the code/fixture, not the expectation.

**Example:**
```typescript
// ❌ WRONG: Changing expectation to match broken code
expect(result.errors.length).toBe(5); // Changed from 2 to 5 because test failed

// ✅ CORRECT: Fix the fixture generation code
// Investigation: Why are we getting 5 errors instead of 2?
// Root cause: Duplicate headers causing data misalignment
// Fix: Refactor addWorksheet function to use column definitions
```

---

## Recent Changes Log

### Session 21 (October 30, 2025)

**Completed:**
1. ✅ Fixed duplicate headers bug in test fixture generation
   - Refactored `addWorksheet` to use column definitions directly
   - Removed manual ID column insertion logic
   - Updated E1 error scenario to filter hidden columns explicitly

2. ✅ Added type safety to ValidationEngine
   - Fixed 7 locations where `.trim()` called without type checking
   - Prevents runtime errors when Excel fields aren't strings

3. ✅ Updated fixture test expectations to be accurate
   - All 7 unit fixture tests now passing
   - Error counts verified correct: 2, 1, 5, 9, 1

4. ✅ Fixed TypeScript errors in test files
   - Updated ParsedSheet structure (removed per-sheet metadata)
   - Added file-level metadata to ParsedExcelFile
   - Fixed 72 structural changes across 19 test cases in diff-engine.test.ts

5. ✅ Created master test suite
   - `npm test` now runs all tests sequentially
   - Added `npm run test:unit` for Jest-only execution
   - Type-check → Jest → Fixtures → Pipeline → Atomic

6. ✅ Fixed Import Wizard TypeScript errors
   - Added `admin.import.buttons.done` translation key
   - Fixed optional callback invocation with `?.` operator

**Files Modified:**
- `scripts/test/generate-all-test-data.ts`
- `src/services/excel/validation/ValidationEngine.ts`
- `scripts/test/test-all-fixtures.ts`
- `scripts/test/helpers/fixture-loader.ts`
- `tests/unit/excel/diff-engine.test.ts` (72 changes)
- `tests/unit/excel/export-service.test.ts` (Buffer type casts)
- `src/lib/i18n/translations.ts`
- `src/lib/i18n/translation-keys.ts`
- `src/components/features/admin/import/steps/ImportStep4Confirmation.tsx`
- `package.json` (master test command)

**Current Test Status:**
- Jest: 63/69 passing (6 known failures documented above)
- Fixtures: 7/7 passing ✅
- Pipeline: Passing ✅
- Atomic: Passing ✅
- Type-check: Passing ✅

---

## Future Improvements

### Short Term

1. **Fix DiffEngine acr_sku tracking** - Include acr_sku in change detection for vehicle apps and cross refs
2. **Improve ValidationEngine test fixtures** - Add multi-sheet test data
3. **Mock database for warning tests** - Allow testing W1-W10 codes without DB seed
4. **Add test coverage reporting** - Track coverage metrics over time

### Medium Term

1. **Snapshot testing** - Add snapshot tests for Excel export format
2. **Performance benchmarks** - Track import/export/diff performance
3. **Visual regression testing** - Test Import Wizard UI with Playwright
4. **API integration tests** - Test all import/export API routes

### Long Term

1. **Automated E2E tests** - Full user flow testing in production-like environment
2. **Load testing** - Test with 10K+ part imports
3. **Parallel test execution** - Speed up test suite with Jest workers
4. **Test data factories** - Generate realistic test data programmatically

---

## Contributing

When adding new tests:

1. **Use schema-aware fixtures** - Import from `src/services/excel/shared/constants.ts`
2. **Document test intent** - Clear descriptions of what and why
3. **Update expectations accurately** - Never fudge numbers to make tests pass
4. **Test both happy and error paths** - Don't just test success cases
5. **Keep tests focused** - One concept per test
6. **Update this documentation** - Keep it current with changes

---

**Questions or Issues?**

See [PLANNING.md](./PLANNING.md) for architecture details or [TASKS.md](./TASKS.md) for development roadmap.
