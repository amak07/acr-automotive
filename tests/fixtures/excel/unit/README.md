# Unit Test Fixtures

This directory contains small, focused test fixtures for validating specific import scenarios.

## Test Fixtures

### Valid Operations

**valid-add-new-parts.xlsx**

- Adds 5 new test parts (ACR-TEST-001 through ACR-TEST-005)
- Expected result: +5 adds, 0 updates, 0 deletes
- Can be generated independently: `npx tsx scripts/test/generate-test-parts-with-uuids.ts add`

**valid-update-existing.xlsx**

- Updates 3 existing test parts, keeps 2 unchanged
- Expected result: ~3 updates, 0 adds, 0 deletes
- Expected warning: 1 data change (Position_Type modification)
- **MUST be generated AFTER importing valid-add-new-parts.xlsx**
- Generate with: `npx tsx scripts/test/generate-test-parts-with-uuids.ts update`

### Error Scenarios

**error-duplicate-skus.xlsx**

- Tests E2 error: Duplicate ACR_SKU within import file
- Expected: Validation error, no import

**error-missing-required-fields.xlsx**

- Tests E3 error: Missing required fields (ACR_SKU, Part_Type)
- Expected: Validation errors, no import

**error-invalid-formats.xlsx**

- Tests E4, E6, E8 errors: Invalid UUID format, year ranges, etc.
- Expected: Multiple validation errors, no import

**error-orphaned-references.xlsx**

- Tests E5 error: Vehicle applications referencing non-existent parts
- Expected: Foreign key violation error, no import

**error-max-length-exceeded.xlsx**

- Tests E7 error: Field values exceeding maximum length
- Expected: Validation error, no import

**warning-data-changes.xlsx**

- Tests W1-W10 warnings: Significant data changes (SKU, type, position changes)
- Expected: Warnings displayed, import proceeds after acknowledgment

## Complete Test Workflow

### 1. Setup (Clean Database)

```bash
npm run test:delete-all
```

### 2. Test ADD Operations

```bash
# Generate ADD fixture (already exists, but can regenerate)
npx tsx scripts/test/generate-test-parts-with-uuids.ts add
```

**Import** `valid-add-new-parts.xlsx` through UI:

- ✅ Verify: +5 Added (green pill)
- ✅ Verify: Dashboard shows 5 parts
- ✅ Verify: Detail list shows all 5 parts with green checkmarks
- ✅ Verify: Step 3 indicator turns green after success

### 3. Test UPDATE Operations

```bash
# Generate UPDATE fixture (REQUIRES step 2 to be complete!)
npx tsx scripts/test/generate-test-parts-with-uuids.ts update
```

**Import** `valid-update-existing.xlsx` through UI:

- ✅ Verify: ~3 Updated (blue pill)
- ✅ Verify: 1 data change warning (Position_Type)
- ✅ Verify: Detail list shows 3 updated parts with blue tilde (~) icons
- ✅ Verify: Dashboard still shows 5 parts total

### 4. Test Rollback from Success Page

- Click "Rollback Import" button on success page
- Confirm rollback
- ✅ Verify: Parts revert to original values
- ✅ Verify: Dashboard auto-refreshes without manual reload

### 5. Test Rollback from Settings

```bash
# Re-import the update fixture
npx tsx scripts/test/generate-test-parts-with-uuids.ts update
```

**Import** `valid-update-existing.xlsx` again, then:

- Navigate to Settings → Import History
- Click "Rollback" on newest import
- ✅ Verify: Success toast appears
- ✅ Verify: Dashboard auto-refreshes
- ✅ Verify: Parts reverted to original state

### 6. Test Error Scenarios (Optional)

Import each error fixture:

- ✅ Verify: Appropriate error messages displayed
- ✅ Verify: No data imported when errors present
- ✅ Verify: User can correct and retry

### 7. Reset to Baseline (When Done)

```bash
# Restore 877-part production catalog
npm run test:reset-db
```

## Why UPDATE Fixture Needs Regeneration

The UPDATE fixture (`valid-update-existing.xlsx`) contains **real UUIDs** from your database in the hidden `_id` column. These UUIDs are used to identify which parts to update.

**The Problem:**

- Database generates random UUIDs when parts are created
- We can't predict these UUIDs in advance
- If UUIDs don't match, you get E19 errors

**The Solution:**

1. Import ADD fixture → Database creates parts with real UUIDs
2. Run update script → Queries database, fetches real UUIDs
3. Script creates UPDATE fixture with matching UUIDs
4. Import UPDATE fixture → UUIDs match, updates work correctly

**Quick Reference:**

```bash
# Complete test cycle
npm run test:delete-all
# Import: valid-add-new-parts.xlsx
npx tsx scripts/test/generate-test-parts-with-uuids.ts update
# Import: valid-update-existing.xlsx
# Test rollback, cache invalidation, etc.
npm run test:reset-db  # When done
```

## Maintenance

When adding new columns to the database:

1. Update `src/services/excel/shared/constants.ts` (add to PARTS_COLUMNS)
2. Run `npm run types:generate`
3. Regenerate fixtures: `npx tsx scripts/test/generate-test-parts-with-uuids.ts`
4. Test fixtures are now schema-aware and include new columns
