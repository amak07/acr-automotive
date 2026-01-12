---
title: Testing Guide
description: Comprehensive testing reference for ACR Automotive import/export system
---

# ACR Automotive Testing Guide

> **Comprehensive testing reference** for ACR Automotive import/export system
>
> **Last Updated**: 2026-01-09

---

## Quick Start

### Essential Test Commands

```bash
# Run all automated tests
npm test

# Run full import pipeline integration test
npm run test:full-pipeline

# Run validation tests
npm run test:atomic

# Verify database migration
npm run test:verify-migration-008
```

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Suite Overview](#test-suite-overview)
3. [Running Tests](#running-tests)
4. [Test Data Management](#test-data-management)
5. [Database Setup](#database-setup)
6. [Integration Testing](#integration-testing)
7. [UX Testing](#ux-testing)
8. [Test Coverage](#test-coverage)
9. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

Our testing strategy combines:

1. **Unit Tests** - Pure business logic (ValidationEngine, DiffEngine, parsers)
2. **Integration Tests** - Database operations and full pipeline workflows
3. **Component Tests** - UI rendering and user interactions (React Testing Library)
4. **Manual UX Tests** - Real-world usability, accessibility, browser compatibility

**Result**: ~241 automated tests that give high confidence with low maintenance burden (~23 seconds total runtime).

### What We Test

- ✅ One comprehensive integration test (`test:full-pipeline`) proves end-to-end system works
- ✅ Targeted validation tests prove safety layer works (duplicate SKU, orphaned FK detection)
- ✅ Unit tests verify individual component logic (23 error codes, 12 warning codes)
- ✅ Component tests ensure UI works correctly (172 passing React component tests)
- ✅ Manual UX tests validate real-world usability (before production releases)

### What We Avoid

- ❌ Testing the same thing multiple ways
- ❌ Over-mocking (prefer real database for integration tests)
- ❌ Brittle tests that break with refactoring

---

## Test Suite Overview

| Test Suite                     | Tests   | Coverage | Status                 | Runtime  |
| ------------------------------ | ------- | -------- | ---------------------- | -------- |
| ValidationEngine               | 10      | 89.4%    | ✅ Complete            | ~1s      |
| DiffEngine                     | 19      | 97.32%   | ✅ Complete            | ~1s      |
| ExcelExportService             | 24      | 92.56%   | ✅ Complete            | ~1s      |
| ImportService (unit)           | 6       | 6.74%    | ⚠️ Integration-focused | <1s      |
| Parsers (Catalogacion/Precios) | 10      | ~80%     | ✅ Complete            | <1s      |
| Import UI Components           | 172     | 100%     | ✅ Complete            | ~3s      |
| Full Import Pipeline           | 1       | N/A      | ✅ Complete            | ~7s      |
| Atomic Transaction Tests       | 2       | N/A      | ✅ Complete            | ~3s      |
| **Total**                      | **241** | **~90%** | **✅**                 | **~23s** |

---

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm test

# Watch mode (during development)
npm run test:watch

# With coverage report
npm run test:coverage

# Specific test file
npm test -- diff-engine.test.ts
```

### Integration Tests

```bash
# Full pipeline test (THE MAIN TEST)
npm run test:full-pipeline

# Atomic transaction tests
npm run test:atomic
npm run test:atomic:constraint    # Duplicate SKU validation
npm run test:atomic:fk             # FK violation validation

# Migration verification
npm run test:verify-migration-008
```

### Component Tests

```bash
# All UI component tests (included in npm test)
npm test -- ImportStep1Upload.test.tsx
npm test -- ImportStep2Validation.test.tsx
npm test -- ImportStep3Preview.test.tsx
npm test -- ImportWizard.test.tsx
```

### Before Committing

```bash
npm run type-check           # TypeScript validation
npm test                     # Unit + component tests
npm run test:full-pipeline   # Integration test
```

### Before Deploying

```bash
npm run test:full            # Type check + all tests
npm run test:full-pipeline   # Full integration
```

---

## Test Data Management

### Test Fixture Organization

```
fixtures/excel/
├── unit/                          # Unit test fixtures (8 files, ~8KB each)
│   ├── valid-add-new-parts.xlsx
│   ├── valid-update-existing.xlsx
│   ├── error-duplicate-skus.xlsx
│   ├── error-missing-required-fields.xlsx
│   └── ... (4 more error test files)
│
└── scenarios/                     # Integration test scenarios (~165KB each)
    ├── 01-quarterly-update.xlsx   # 50 adds, 3 updates, 2 deletes
    ├── 02-seasonal-refresh.xlsx   # 10 adds, 20 updates, 5 deletes
    └── ... (7 more scenario files)

tmp/
└── baseline-export.xlsx           # Emergency restore backup
```

### Generate Test Data

```bash
# Generate all test data (unit + scenarios)
npm run test:generate

# Generate specific types
npm run test:generate:unit        # Unit fixtures only
npm run test:generate:scenarios   # Integration scenarios only

# Regenerate test baseline
npm run test:generate-baseline    # Export local Docker DB → fixtures/
```

### When to Regenerate

- After schema changes (new columns added to database)
- After TEST database changes
- When validation rules change
- Before major testing sessions

### Schema-Aware Test Generation

Test generation is fully schema-aware! When you add new columns:

1. Update shared constants: `src/services/excel/shared/constants.ts`
2. Regenerate Supabase types: `npm run types:generate`
3. Regenerate test data: `npm run test:generate`
4. Test files automatically include new columns ✅

---

## Database Setup

### Architecture

```
Local Development (npm run dev)
├─ Next.js: http://localhost:3000
└─ Database: Local Supabase (Docker)
   → Shared instance for both dev and test

Automated Tests (npm test)
└─ Database: Same local Supabase instance
   → Fast, isolated, repeatable
```

### Environment Configuration

**`.env.local`** - Used by both dev and tests:

```bash
# Local Docker Supabase (shared instance)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### Database Commands

```bash
# Start local Supabase (Docker)
npm run supabase:start

# Reset database (apply migrations)
npm run supabase:reset

# Stop Supabase
npm run supabase:stop

# Seed database with test data
docker exec -i supabase_db_acr-automotive psql -U postgres -d postgres < fixtures/seed-data.sql
```

### Database Workflow

**Development**:

```bash
npm run supabase:start  # Start local Supabase
npm run dev             # Next.js dev server
# Database persists between sessions
```

**Testing**:

```bash
npm test                # Resets DB, runs tests, leaves empty
npm run supabase:reset  # Restore dev data after testing
```

---

## Integration Testing

### Full Import Pipeline Test

**Purpose**: End-to-end validation (Parse → Validate → Diff → Import → Rollback)

```bash
npm run test:full-pipeline
```

**What it tests**:

- Parse 865 parts from Excel (PRECIOS + CATALOGACION sheets)
- Validate data integrity (23 error codes, 12 warning codes)
- Generate diff (ADD/UPDATE/DELETE operations)
- Execute atomic import (12,569 records in ~3.8s)
- Create snapshot (JSONB snapshot for rollback)
- Execute rollback (restore exact database state in ~1.7s)

**Expected Output**:

```
✅ Import completed in 3,807ms
   - 865 parts (865 adds)
   - 2,304 vehicle applications (2,304 adds)
   - 9,400 cross-references (9,400 adds)

✅ Snapshot created (865 parts, 2,304 apps, 9,400 refs)

✅ Rollback completed in 1,726ms
   - Exact state restoration verified
```

### Atomic Transaction Tests

**Constraint Violation Test**:

```bash
npm run test:atomic:constraint
```

Tests duplicate SKU validation prevents database corruption.

**Foreign Key Violation Test**:

```bash
npm run test:atomic:fk
```

Tests orphaned reference detection prevents orphaned data.

**Expected Behavior**: Both tests should PASS by preventing bad imports via validation layer.

---

## UX Testing

### Manual Testing Checklist (Pre-Release)

Run these tests before each production deployment (~2-4 hours):

#### Import Wizard Flow

- [ ] Happy path: Upload → Validate → Review → Confirm → Success
- [ ] Error path: Invalid file → Clear error message → Re-upload works
- [ ] Warning path: Data changes → Acknowledge warnings → Import succeeds

#### File Upload

- [ ] Drag-and-drop works (visual feedback on hover)
- [ ] File size validation (10MB limit, clear error message)
- [ ] File type validation (.xlsx only, helpful error for .csv/.xls)
- [ ] Large file progress (1000+ parts show progress indicator)

#### Validation & Diff

- [ ] Error messages include row/column/value (not just error code)
- [ ] Warnings show before/after values
- [ ] Cascade delete warnings require acknowledgment
- [ ] Pagination works (20 items → Load More → Show All)

#### Accessibility (WCAG 2.1 AA)

- [ ] Keyboard navigation (Tab through wizard, Enter to advance)
- [ ] Screen reader announces errors/warnings
- [ ] Focus visible on all interactive elements
- [ ] Color contrast ≥ 4.5:1 for all text

#### Browser Compatibility

- [ ] Chrome Desktop: All features work
- [ ] Firefox Desktop: Smoke test
- [ ] Safari Desktop: Smoke test
- [ ] **iPad Safari**: Full feature test ← **CRITICAL** (primary device)
- [ ] iOS Safari: Smoke test

**Pass Criteria**: All checklist items ✅

---

## Test Coverage

### Unit Test Coverage

| Component             | Coverage | Status                                         |
| --------------------- | -------- | ---------------------------------------------- |
| ValidationEngine      | 89.4%    | ✅ Complete (23 error codes, 12 warning codes) |
| DiffEngine            | 97.32%   | ✅ Complete (ID-based change detection)        |
| ExcelExportService    | 92.56%   | ✅ Complete (3-sheet export)                   |
| ImportStep2Validation | 100%     | ✅ Complete (56 tests)                         |
| ImportStep3Preview    | 100%     | ✅ Complete (49 tests)                         |
| ImportWizard          | 100%     | ✅ Complete (31 tests)                         |
| ImportStep1Upload     | 100%     | ✅ Complete (36 tests)                         |

### Integration Test Coverage

- ✅ Full import pipeline (7,716+ changes in single transaction)
- ✅ Atomic constraint violation (duplicate SKU) rollback
- ✅ Foreign key violation rollback
- ✅ Snapshot creation and restoration
- ✅ Import history tracking

### Not Currently Tested

1. **BulkOperationsService** (0% coverage)
   - Priority: Medium (separate from import system)

2. **Concurrent Import Prevention**
   - Priority: Medium (before production)

3. **Multi-Tenant Isolation**
   - Priority: High (if multi-tenant enabled)

---

## Troubleshooting

### Tests Hang or Timeout

**Cause**: Database connection issues or `.env.local` not loading

**Solution**:

```bash
# Verify database is running
docker ps | grep supabase

# Restart Supabase
npm run supabase:stop
npm run supabase:start

# Check .env.local exists and has correct values
cat .env.local
```

### Tests Fail Unexpectedly

**Cause**: Database has stale data or migrations not applied

**Solution**:

```bash
# Reset database to clean state
npm run supabase:reset

# Verify migration 008 applied
npm run test:verify-migration-008
```

### API Tests Fail

**Cause**: Dev server not running

**Solution**:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run API tests
npm run test:api:import
```

### Full Pipeline Test Skips

**Cause**: Database empty, file contains UUIDs

**Solution**:

```bash
# Seed database before running test
npm run supabase:reset

# Re-run test
npm run test:full-pipeline
```

### Browser "Page Unresponsive" During Manual Testing

**Cause**: File too large (>5000 parts)

**Solution**: Split file into smaller batches (<1000 parts per file)

---

## Test Infrastructure Summary

| Infrastructure Component | Status     | Notes                        |
| ------------------------ | ---------- | ---------------------------- |
| Jest Test Runner         | ✅ Active  | 241 tests passing            |
| React Testing Library    | ✅ Active  | 172 component tests          |
| Local Docker Supabase    | ✅ Active  | Shared dev/test instance     |
| Test Fixtures (17 files) | ✅ Active  | Schema-aware generation      |
| Test Mocking Utilities   | ✅ Active  | validation-mocks, diff-mocks |
| CI/CD Integration        | ⏭️ Planned | Add to deployment pipeline   |

---

## Key Files

### Test Files

- `tests/unit/excel/*.test.ts` - Unit tests (ValidationEngine, DiffEngine, etc.)
- `tests/integration/*.test.ts` - Integration tests
- `src/components/**/__tests__/*.test.tsx` - Component tests
- `scripts/test/*.ts` - Integration test scripts

### Test Utilities

- `tests/utils/component-mocks/validation-mocks.ts` - Mock validation data
- `tests/utils/component-mocks/diff-mocks.ts` - Mock diff data
- `tests/utils/component-mocks/locale-mock.tsx` - Mock locale provider

### Configuration

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup/environment loading

### Test Data

- `fixtures/excel/unit/*.xlsx` - Unit test fixtures (8 files)
- `fixtures/excel/scenarios/*.xlsx` - Integration test scenarios (9 files)
- `fixtures/seed-data.sql` - Production baseline snapshot (865 parts)

---

## Next Steps

1. ✅ **All core tests implemented** (241 passing)
2. ⏭️ Add BulkOperationsService tests (Medium priority)
3. ⏭️ CI/CD integration (Add test automation to deployment pipeline)
4. ⏭️ Manual testing with all 17 fixtures (Pre-production validation)

---

**Maintained By**: Development Team
**Contact**: See [PLANNING.md](./PLANNING.md) for architecture questions
