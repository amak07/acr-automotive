# Test Fixtures

This directory contains Excel fixtures for comprehensive testing of the import/rollback pipeline.

## Seed Data

**File:** `seed-data.sql`

Provides deterministic test data with known UUIDs for UPDATE/DELETE testing.

**Contents:**

- 10 Parts (UUIDs: `00000000-0000-0000-0000-000000000001` through `...0010`)
- 30 Vehicle Applications (UUIDs: `10000000-0000-0000-0000-000000000001` through `...0030`)
- 50 Cross References (UUIDs: `20000000-0000-0000-0000-000000000001` through `...0050`)

**Setup:**

1. Open Supabase Dashboard → SQL Editor
2. Copy/paste `seed-data.sql` content
3. Run the query
4. Verify output shows "Seed data loaded successfully"

**Or use CLI:**

```bash
npm run test:reset-db
```

## Excel Fixtures

### Happy Path Scenarios

#### 1. `valid-add-new-parts.xlsx`

**Purpose:** Test pure ADD operations
**Content:**

- 5 new parts (no `_id` column)
- 10 vehicle applications referencing new parts
- 15 cross references referencing new parts

**Expected Result:**

- ✅ Validation: PASS (0 errors, 0 warnings)
- ✅ Diff: 5 parts ADD, 10 vehicle apps ADD, 15 cross refs ADD

#### 2. `valid-update-existing.xlsx`

**Purpose:** Test pure UPDATE operations
**Content:**

- 3 existing parts with `_id` from seed data
- Modified specifications only

**Expected Result:**

- ✅ Validation: PASS (0 errors, may have warnings)
- ⚠️ Warnings: W7_SPECIFICATIONS_SHORTENED (if specs changed)
- ✅ Diff: 3 parts UPDATE

#### 3. `valid-mixed-operations.xlsx`

**Purpose:** Test realistic bulk import with mixed operations
**Content:**

- 2 new parts + 2 updated parts (from seed)
- 5 new vehicle apps + 3 updated
- 10 new cross refs + 5 updated

**Expected Result:**

- ✅ Validation: PASS
- ✅ Diff: Mixed ADD/UPDATE operations

### Validation Error Scenarios

#### 4. `error-missing-required-fields.xlsx`

**Purpose:** Trigger E3_EMPTY_REQUIRED_FIELD errors
**Content:**

- Parts sheet: Row with missing `ACR_SKU`, row with missing `Part Type`
- Vehicle apps sheet: Row with missing `Make`
- Cross refs sheet: Row with missing `Competitor Brand`

**Expected Result:**

- ❌ Validation: FAIL
- ❌ Errors: 5× E3_EMPTY_REQUIRED_FIELD
- ❌ Import: BLOCKED

#### 5. `error-duplicate-skus.xlsx`

**Purpose:** Trigger E2_DUPLICATE_ACR_SKU error
**Content:**

- Parts sheet: Two rows with same `ACR_SKU`

**Expected Result:**

- ❌ Validation: FAIL
- ❌ Errors: 1× E2_DUPLICATE_ACR_SKU
- ❌ Import: BLOCKED

#### 6. `error-orphaned-references.xlsx`

**Purpose:** Trigger E5_ORPHANED_FOREIGN_KEY errors
**Content:**

- Vehicle app referencing non-existent part SKU
- Cross ref referencing non-existent part SKU

**Expected Result:**

- ❌ Validation: FAIL
- ❌ Errors: 2× E5_ORPHANED_FOREIGN_KEY
- ❌ Import: BLOCKED

#### 7. `error-invalid-formats.xlsx`

**Purpose:** Trigger format validation errors
**Content:**

- Invalid UUID format (E4)
- Inverted year range: start_year > end_year (E6)
- Year out of range: < 1900 or > current+2 (E8)

**Expected Result:**

- ❌ Validation: FAIL
- ❌ Errors: E4, E6, E8 (multiple instances)
- ❌ Import: BLOCKED

#### 8. `error-max-length-exceeded.xlsx`

**Purpose:** Trigger E7_STRING_EXCEEDS_MAX_LENGTH errors
**Content:**

- `ACR_SKU` with 51 characters (max: 50)
- `Make` with 51 characters (max: 50)

**Expected Result:**

- ❌ Validation: FAIL
- ❌ Errors: 2× E7_STRING_EXCEEDS_MAX_LENGTH
- ❌ Import: BLOCKED

### Warning Scenarios

#### 9. `warning-data-changes.xlsx`

**Purpose:** Trigger W1-W10 warning codes
**Content:**

- Part with changed `ACR_SKU` (W1)
- Part with changed `Part Type` (W3)
- Part with changed `Position Type` (W4)
- Part with shortened `Specifications` (W7)
- Vehicle app with changed `Make` (W8)
- Vehicle app with changed `Model` (W9)
- Vehicle app with narrowed year range (W2)

**Expected Result:**

- ✅ Validation: PASS (warnings don't block)
- ⚠️ Warnings: 7 total (W1, W2, W3, W4, W7, W8, W9)
- ✅ Import: ALLOWED with user confirmation

### Performance Testing

#### 10. `performance-large-dataset.xlsx`

**Purpose:** Performance benchmarking
**Content:**

- 1,000 parts (500 new, 500 updates)
- 5,000 vehicle applications (3,000 new, 2,000 updates)
- 10,000 cross references (8,000 new, 2,000 updates)

**Expected Result:**

- ✅ Parse time: < 5 seconds
- ✅ Validation time: < 10 seconds
- ✅ Diff time: < 5 seconds
- ✅ Import execution: < 60 seconds
- ✅ Total: < 80 seconds for full pipeline

## Building Fixtures

Fixtures will be generated programmatically using the `ExcelJS` library.

**Script:** `scripts/test/generate-fixtures.ts`

**Usage:**

```bash
npm run test:generate-fixtures
```

This will create all 10 Excel files in `fixtures/excel/` directory.

## Test Usage

```typescript
// Load fixture in tests
import { loadFixture } from "../helpers/fixture-loader";

const file = loadFixture("valid-add-new-parts.xlsx");
const parser = new ExcelImportService();
const parsed = await parser.parseFile(file);
```

## Maintenance

- Fixtures are **version controlled** (committed to git)
- Regenerate fixtures when schema changes
- Keep fixtures small and focused (easier to debug)
- Document expected outcomes in this README
