---
title: "Test Data Management"
---

# Test Data Management

Complete guide to test data generation, organization, and maintenance for the ACR Automotive import/export pipeline.

---

## 📁 File Structure

```
fixtures/excel/
├── unit/                          # Unit test fixtures (8 files, ~8KB each)
│   ├── valid-add-new-parts.xlsx
│   ├── valid-update-existing.xlsx
│   ├── error-duplicate-skus.xlsx
│   ├── error-invalid-formats.xlsx
│   ├── error-max-length-exceeded.xlsx
│   ├── error-missing-required-fields.xlsx
│   ├── error-orphaned-references.xlsx
│   └── warning-data-changes.xlsx
│
└── scenarios/                     # Integration test scenarios (~165KB each)
    ├── 01-quarterly-update.xlsx         # Realistic quarterly (50 adds, 3 updates, 2 deletes)
    ├── 02-seasonal-refresh.xlsx         # Seasonal refresh (10 adds, 20 updates, 5 deletes)
    ├── 03-minor-corrections.xlsx        # Minor corrections (0 adds, 3 updates, 0 deletes)
    ├── 04-all-warnings.xlsx             # Triggers W1-W10 warnings
    ├── error-e1-missing-ids.xlsx        # E1: Missing hidden ID columns
    ├── error-e2-duplicate-sku.xlsx      # E2: Duplicate ACR_SKU
    ├── error-e3-empty-fields.xlsx       # E3: Empty required fields
    ├── error-e5-orphaned-fk.xlsx        # E5: Orphaned foreign keys
    └── error-e6-invalid-year-range.xlsx # E6: Invalid year range

tmp/
├── baseline-export.xlsx           # Emergency restore backup (gitignored)
└── test-export.xlsx               # Generated test baseline (gitignored)
```

---

## 🎯 Quick Start

### Generate All Test Data

```bash
npm run test:generate
```

Generates both unit fixtures and integration scenarios.

### Generate Specific Types

```bash
npm run test:generate:unit        # Unit fixtures only
npm run test:generate:scenarios   # Integration scenarios only
```

### Regenerate Test Baseline

```bash
npm run test:generate-baseline    # Export local Docker database → fixtures/baseline-export.xlsx
```

---

## 🔄 Schema Awareness

**Key Feature:** Test generation is fully schema-aware!

When you add new columns to the database:

1. **Update shared constants:**

   ```typescript
   // src/services/excel/shared/constants.ts
   export const PARTS_COLUMNS = [
     { header: "ACR_SKU", key: "acr_sku", width: 15 },
     { header: "Part_Type", key: "part_type", width: 20 },
     { header: "New_Column", key: "new_column", width: 15 }, // ← Add here
     // ...
   ];
   ```

2. **Regenerate Supabase types:**

   ```bash
   npm run types:generate           # Reads TEST database schema
   ```

3. **Regenerate test data:**

   ```bash
   npm run test:generate
   ```

4. **Test files automatically include new column!** ✅

**Single Source of Truth:**

- Column definitions: `src/services/excel/shared/constants.ts`
- TypeScript types: `src/lib/supabase/types.ts` (auto-generated)
- Test generation: `scripts/test/generate-all-test-data.ts` (imports from both)

---

## 📦 Unit Test Fixtures

**Purpose:** Small, focused test files for specific validation scenarios

**Location:** `fixtures/excel/unit/`

**Size:** ~8KB each (5-10 rows)

**Used By:**

- Unit tests (Jest/Vitest)
- Validation engine tests
- Quick smoke tests

### File Descriptions

| File                                 | Purpose                                | Tests                            |
| ------------------------------------ | -------------------------------------- | -------------------------------- |
| `valid-add-new-parts.xlsx`           | Happy path: Add 5 new parts            | Import service, basic validation |
| `valid-update-existing.xlsx`         | Happy path: Update 3 parts             | Update operations, diff engine   |
| `error-duplicate-skus.xlsx`          | E2: Duplicate ACR_SKU                  | Duplicate detection              |
| `error-missing-required-fields.xlsx` | E3: Empty ACR_SKU, Part_Type           | Required field validation        |
| `error-orphaned-references.xlsx`     | E5: Orphaned foreign keys              | FK constraint validation         |
| `error-invalid-formats.xlsx`         | E4, E6, E8: Invalid UUIDs, year ranges | Format validation                |
| `error-max-length-exceeded.xlsx`     | E7: String exceeds 100 chars           | Length validation                |
| `warning-data-changes.xlsx`          | W1-W10: Data modifications             | Warning detection                |

### Regeneration

**When to regenerate:**

- After schema changes (new columns)
- When adding new validation rules
- When error codes change

**How to regenerate:**

```bash
npm run test:generate:unit
```

---

## 🔄 Integration Test Scenarios

**Purpose:** Large, realistic test files simulating actual import workflows

**Location:** `fixtures/excel/scenarios/`

**Size:** ~165KB each (865 parts + vehicle apps + cross-refs)

**Used By:**

- Integration tests
- E2E import pipeline tests
- Manual UI testing
- Performance testing

### Scenario Descriptions

#### **Valid Import Scenarios**

**01-quarterly-update.xlsx**

- **Changes:** 50 adds, 3 updates, 2 deletes
- **Purpose:** Realistic quarterly inventory update (Humberto's workflow)
- **Tests:** Large batch adds, mixed operations

**02-seasonal-refresh.xlsx**

- **Changes:** 10 adds, 20 updates, 5 deletes
- **Purpose:** Seasonal product refresh with price/spec updates
- **Tests:** Update-heavy operations

**03-minor-corrections.xlsx**

- **Changes:** 0 adds, 3 updates, 0 deletes
- **Purpose:** Small data corrections (typos, spec updates)
- **Tests:** Update-only operations

**04-all-warnings.xlsx**

- **Changes:** Modifications triggering W1-W10
- **Purpose:** Verify all warning types display in UI
- **Tests:** Warning detection, UI acknowledgment flow

#### **Error Test Scenarios**

**error-e1-missing-ids.xlsx**

- **Error:** Missing hidden `_id`, `_part_id`, `_acr_part_id` columns
- **Expected:** E1 error blocks import in Step 2

**error-e2-duplicate-sku.xlsx**

- **Error:** Two parts with same ACR_SKU
- **Expected:** E2 error blocks import in Step 2

**error-e3-empty-fields.xlsx**

- **Error:** Empty ACR_SKU or Part_Type
- **Expected:** E3 error blocks import in Step 2

**error-e5-orphaned-fk.xlsx**

- **Error:** Vehicle application references non-existent part
- **Expected:** E5 error blocks import in Step 2

**error-e6-invalid-year-range.xlsx**

- **Error:** start_year > end_year
- **Expected:** E6 error blocks import in Step 2

### Regeneration

**When to regenerate:**

- After test baseline changes (new data in TEST database)
- When scenario definitions change
- After schema changes

**How to regenerate:**

```bash
# First, export fresh baseline from local Docker database
npm run test:generate-baseline

# Then regenerate scenarios
npm run test:generate:scenarios
```

---

## 🗄️ Baseline Files

### `baseline-export.xlsx` (Generated Baseline)

**Source:** Local Docker database export

**Purpose:** Source data for scenario generation and import pipeline testing

**Location:** `fixtures/baseline-export.xlsx` (tracked in git)

**Regenerate:**

```bash
npm run test:generate-baseline
```

**Contains:**

- All parts from local Docker database
- All vehicle applications
- All cross-references
- Hidden ID columns (\_id, \_part_id, \_acr_part_id)

**When to regenerate:**

- After major TEST database changes
- Before creating new scenarios
- After migrations applied to TEST

### `baseline-export.xlsx` (Emergency Restore)

**Source:** Production baseline snapshot (manual)

**Purpose:** Emergency database restore after catastrophic data loss

**Location:** `tmp/` (gitignored)

**Update:** Manual (rare)

**Usage:**

```bash
# Reset test database to 865-part baseline
npm run test:reset-db
```

**When to update:**

- After successful production deployment
- After major data imports verified
- Periodically (monthly backup)

---

## 🔧 Scripts Reference

### Test Data Generation

| Script                                | Command                           | Purpose                                   |
| ------------------------------------- | --------------------------------- | ----------------------------------------- |
| `generate-all-test-data.ts`           | `npm run test:generate`           | Generate all test data (unit + scenarios) |
| `generate-all-test-data.ts unit`      | `npm run test:generate:unit`      | Generate unit fixtures only               |
| `generate-all-test-data.ts scenarios` | `npm run test:generate:scenarios` | Generate integration scenarios only       |

### Baseline Management

| Script                 | Command                          | Purpose                                                       |
| ---------------------- | -------------------------------- | ------------------------------------------------------------- |
| `generate-baseline.ts` | `npm run test:generate-baseline` | Export local Docker database to fixtures/baseline-export.xlsx |
| `test-export-api.ts`   | `npm run test:export-api`        | Test /api/admin/export endpoint (requires dev server)         |
| `reset-test-db.ts`     | `npm run test:reset-db`          | Reset database to baseline from baseline-export.xlsx          |

### Verification

| Script               | Command                                            | Purpose                               |
| -------------------- | -------------------------------------------------- | ------------------------------------- |
| `check-import.ts`    | `NODE_ENV=test npx tsx scripts/check-import.ts`    | Check import history in TEST database |
| `verify-baseline.ts` | `NODE_ENV=test npx tsx scripts/verify-baseline.ts` | Verify database state after rollback  |

---

## 🧪 Testing Workflow

### Daily Development

```bash
# 1. Make code changes (validation rules, schema, etc.)

# 2. Regenerate types if schema changed
npm run types:generate

# 3. Regenerate test data if needed
npm run test:generate

# 4. Run tests
npm test
```

### After Schema Changes

```bash
# 1. Write migration
# src/lib/supabase/migrations/009_*.sql

# 2. Apply to TEST database (Supabase dashboard)

# 3. Regenerate types from TEST
npm run types:generate

# 4. Update shared constants
# src/services/excel/shared/constants.ts

# 5. Regenerate test data
npm run test:generate

# 6. Run tests to verify
npm test

# 7. Deploy to PROD only after verification
```

### Before Major Testing

```bash
# 1. Export fresh baseline from local Docker database
npm run test:generate-baseline

# 2. Regenerate all scenarios
npm run test:generate:scenarios

# 3. Run full test suite
npm run test:full-pipeline
```

---

## 🧹 Database Cleanup Best Practices

### Overview

Integration tests that modify the database must clean up after themselves to ensure **test isolation**. Without cleanup, tests leave residual data that affects subsequent test runs, causing flakiness and false positives/negatives.

### Current Cleanup Status

| Test File                      | Database Impact                   | Cleanup Status | Priority |
| ------------------------------ | --------------------------------- | -------------- | -------- |
| `rollback-edge-cases.test.ts`  | Creates imports & snapshots       | ❌ NONE        | HIGH     |
| `concurrent-import.test.ts`    | Creates parts, imports, history   | ❌ NONE        | HIGH     |
| `large-dataset.test.ts`        | Disabled (would create 10k parts) | N/A            | LOW      |
| `test-full-import-pipeline.ts` | Full import + rollback            | ⚠️ PARTIAL     | MEDIUM   |
| Unit tests                     | No database access                | ✅ N/A         | N/A      |
| Fixture validation tests       | Read-only                         | ✅ N/A         | N/A      |

### Why Cleanup Matters

**Without cleanup**:

- Tests contaminate each other (test A creates data, test B fails unexpectedly)
- Database grows unbounded (100 test runs = 500 imports)
- False positives (test passes only because of previous test's data)
- False negatives (test fails because duplicate data already exists)
- Cannot run tests in parallel (race conditions)

**With cleanup**:

- Each test starts with known state (predictable)
- Tests can run in any order (no dependencies)
- Tests can run in parallel (isolated)
- Database stays clean (audit-friendly)

### Recommended Pattern: afterEach Hook

Use this pattern for all integration tests that execute imports:

```typescript
import { RollbackService } from "@/services/excel/rollback/RollbackService";

describe("Import Integration Test", () => {
  // Track all imports for cleanup
  const importTracker = {
    ids: [] as string[],

    track(importId: string) {
      this.ids.push(importId);
    },

    async cleanup() {
      const rollbackService = new RollbackService();
      for (const importId of this.ids) {
        try {
          await rollbackService.rollbackToImport(importId);
          console.log(`✅ Cleaned up import ${importId}`);
        } catch (error: any) {
          // Import may already be rolled back
          console.warn(`⚠️  Cleanup warning: ${error.message}`);
        }
      }
      this.ids = [];
    },
  };

  // Cleanup after each test
  afterEach(async () => {
    await importTracker.cleanup();
  });

  // Safety net cleanup
  afterAll(async () => {
    await importTracker.cleanup();
  });

  it("should import data successfully", async () => {
    const result = await importService.executeImport(parsed, diff, metadata);

    // CRITICAL: Track for cleanup
    importTracker.track(result.importId);

    // Test assertions...
    expect(result.summary.totalChanges).toBeGreaterThan(0);

    // Cleanup happens automatically in afterEach
  });
});
```

### Pattern: Cleanup on Test Failure

Ensure cleanup even if test throws error:

```typescript
it("should handle errors gracefully", async () => {
  let importId: string | null = null;

  try {
    const result = await importService.executeImport(data);
    importId = result.importId;

    // Test assertions...
    expect(result.summary.errors).toBeGreaterThan(0);
  } catch (error) {
    // Test failed - cleanup before re-throwing
    if (importId) {
      await rollbackService.rollbackToImport(importId);
    }
    throw error;
  } finally {
    // Always cleanup (success or failure)
    if (importId) {
      await rollbackService.rollbackToImport(importId);
    }
  }
});
```

### Pattern: Concurrent Import Cleanup

For tests that execute multiple imports in parallel:

```typescript
describe("Concurrent Import Test", () => {
  const createdImports: string[] = [];

  afterEach(async () => {
    if (createdImports.length > 0) {
      const rollbackService = new RollbackService();
      console.log(`🧹 Cleaning up ${createdImports.length} imports...`);

      for (const importId of createdImports) {
        try {
          await rollbackService.rollbackToImport(importId);
        } catch (error: any) {
          console.warn(`⚠️  ${importId}: ${error.message}`);
        }
      }

      createdImports.length = 0;
      console.log("✅ Cleanup complete");
    }
  });

  it("should handle concurrent imports", async () => {
    const results = await Promise.allSettled([
      importService1.executeImport(data1),
      importService2.executeImport(data2),
    ]);

    // Track successful imports
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.importId) {
        createdImports.push(result.value.importId);
      }
    });

    // Test assertions...
  });
});
```

### Best Practices Checklist

Before merging integration tests:

- [ ] Test tracks all import IDs created during execution
- [ ] `afterEach` hook cleans up database changes
- [ ] `afterAll` hook provides safety net for missed cleanup
- [ ] Cleanup handles errors gracefully (try/catch with warnings)
- [ ] Cleanup activity logged for debugging (`console.log`)
- [ ] Test passes when run in isolation (`npm test -- single-test.test.ts`)
- [ ] Test passes when run after other tests (no contamination)
- [ ] Test passes when run multiple times in a row (idempotent)

### Common Mistakes to Avoid

❌ **Don't manually delete records**:

```typescript
// BAD - Fragile, doesn't handle cascades
await supabase.from("parts").delete().eq("acr_sku", "TEST-001");
```

✅ **Do use RollbackService**:

```typescript
// GOOD - Atomic, handles cascades, restores exact state
await rollbackService.rollbackToImport(importId);
```

❌ **Don't assume cleanup will run**:

```typescript
// BAD - If test fails before this line, no cleanup
const result = await importService.executeImport(data);
// ... many lines of code ...
await rollbackService.rollbackToImport(result.importId); // Never reached if error
```

✅ **Do use afterEach hooks**:

```typescript
// GOOD - Cleanup guaranteed even if test fails
afterEach(async () => {
  await importTracker.cleanup();
});
```

❌ **Don't fail test if cleanup fails**:

```typescript
// BAD - Test marked as failed even though test logic passed
await rollbackService.rollbackToImport(importId); // Throws if already rolled back
```

✅ **Do catch cleanup errors**:

```typescript
// GOOD - Cleanup errors logged but don't fail test
try {
  await rollbackService.rollbackToImport(importId);
} catch (error) {
  console.warn("Cleanup failed:", error.message);
}
```

### Debugging Cleanup Issues

If tests are flaky or failing inconsistently:

1. **Check for leftover data**:

   ```bash
   # Query test database for residual imports
   psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM import_history;"
   ```

2. **Run test in isolation**:

   ```bash
   # If passes alone but fails in suite, cleanup issue likely
   npx jest tests/integration/specific-test.test.ts
   ```

3. **Check cleanup logs**:

   ```bash
   # Run tests with verbose logging
   npm test 2>&1 | grep "Cleaned up import"
   ```

4. **Verify rollback works**:
   ```bash
   # Manually test rollback service
   npm run test:atomic
   ```

### Manual Database Reset

If database becomes polluted during development:

```bash
# Nuclear option - delete all test data (use with caution!)
psql $TEST_DATABASE_URL <<EOF
  DELETE FROM import_history;
  DELETE FROM cross_references WHERE tenant_id IS NULL;
  DELETE FROM vehicle_applications WHERE tenant_id IS NULL;
  DELETE FROM parts WHERE tenant_id IS NULL;
EOF

# Verify clean slate
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM import_history;" # Should be 0
```

**WARNING**: Only use manual reset during development. Production should never require manual cleanup if tests use proper hooks.

---

## 🚨 Emergency Procedures

### Database Corruption

If TEST database is corrupted or data loss occurs:

```bash
# 1. Restore from baseline
npm run test:reset-db

# 2. Verify restoration
NODE_ENV=test tsx scripts/verify-baseline.ts

# 3. Confirm counts match baseline (865 parts)
```

### Missing Test Files

If test files are accidentally deleted:

```bash
# Regenerate all test data
npm run test:generate
```

### Baseline Out of Sync

If baseline-export.xlsx is stale:

```bash
# 1. Export fresh baseline
npm run test:generate-baseline

# 2. Regenerate scenarios
npm run test:generate:scenarios
```

---

## 📊 File Manifest

### Checked into Git

- ✅ `fixtures/excel/unit/` (8 files) - Unit test fixtures
- ✅ `fixtures/excel/scenarios/` (9 files) - Integration scenarios

### Gitignored (Generated)

- ❌ `tmp/test-export.xlsx` - Generated baseline
- ❌ `tmp/baseline-export.xlsx` - Emergency backup

### Why Scenarios are in Git

**Rationale:**

- Integration scenarios are **reference test data** used across team
- Versioned with code - test changes tracked in PR reviews
- CI/CD can run integration tests without regenerating
- New developers get working test data immediately

**Why tmp/ is Gitignored:**

- Baselines are **generated from database** and specific to environment
- Large files (170KB+) - don't bloat repository
- Each developer generates their own from their TEST database
- Regenerated frequently during development

---

## 🔍 Troubleshooting

### "Baseline file not found"

**Error:** `❌ Error: Baseline file not found: fixtures/baseline-export.xlsx`

**Solution:**

```bash
npm run test:generate-baseline
```

### "Types don't match database schema"

**Error:** TypeScript errors about missing/wrong columns

**Solution:**

```bash
npm run types:generate
```

### "Test files have wrong columns"

**Error:** Test fixtures missing new columns

**Solution:**

```bash
# 1. Update constants
# Edit: src/services/excel/shared/constants.ts

# 2. Regenerate test data
npm run test:generate
```

### "Schema validation failing"

**Error:** Import validation errors on test files

**Solution:**

```bash
# 1. Check if constants match database
# Compare: src/services/excel/shared/constants.ts vs schema.sql

# 2. Regenerate types
npm run types:generate

# 3. Regenerate test data
npm run test:generate
```

---

## 📚 See Also

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Main testing documentation
- [UNIT_TEST_COVERAGE.md](./UNIT_TEST_COVERAGE.md) - Coverage tracking
- [src/services/excel/shared/constants.ts](../../src/services/excel/shared/constants.ts) - Column definitions
- [src/lib/supabase/types.ts](../../src/lib/supabase/types.ts) - Generated database types

---

**Last Updated:** October 30, 2025
**Maintained By:** Development Team
