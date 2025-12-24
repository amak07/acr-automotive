---
title: "Excel Import Service - Technical Documentation"
---

# Excel Import Service - Technical Documentation

**Phase**: 8.2 - Excel Import + Rollback System
**Status**: Parser, Validation, and Diff engines complete and tested
**Last Updated**: 2025-10-24

---

## Overview

The Excel Import Service enables Humberto to export catalog data, make bulk changes in Excel using power-user tools, and re-import with full validation, change tracking, and rollback capabilities.

### Key Features

- **ID-Based Matching**: Uses hidden `_id` columns to track records across export/import cycles
- **Export-Only Workflow**: Users must export first to get IDs before importing (no blind uploads)
- **3-Sheet Normalized Format**: Parts, Vehicle Applications, Cross References
- **Comprehensive Validation**: 19 error rules (block import) + 10 warning rules (user confirmation)
- **Field-Level Change Detection**: Tracks exactly what changed in each record
- **Snapshot System**: Point-in-time backups before each import for rollback

---

## Architecture

### Component Structure

```
src/services/excel/
├── shared/
│   ├── constants.ts      # Single source of truth for sheet names, headers, column widths
│   └── types.ts          # Shared TypeScript types
├── import/
│   └── ExcelImportService.ts    # Parse uploaded Excel files
├── validation/
│   ├── types.ts                 # Error/warning enums
│   └── ValidationEngine.ts      # Validate parsed data
└── diff/
    ├── types.ts                 # Diff operation types
    └── DiffEngine.ts            # Detect changes between file and database
```

### Data Flow

```
1. User uploads Excel file
   ↓
2. ExcelImportService parses file (including hidden ID columns)
   ↓
3. ValidationEngine validates against database rules
   - Errors: Block import
   - Warnings: Show for user confirmation
   ↓
4. DiffEngine generates change preview
   - ADD: New records (no _id)
   - UPDATE: Existing records with changes (_id exists)
   - DELETE: Records in DB but not in file
   - UNCHANGED: No changes detected
   ↓
5. User reviews changes in UI wizard
   ↓
6. ImportService (TODO):
   - Creates snapshot of current data
   - Applies changes in transaction
   - Records snapshot metadata
   ↓
7. User can rollback to any previous snapshot
```

---

## Completed Components

### 1. ExcelImportService

**File**: `src/services/excel/import/ExcelImportService.ts`
**Purpose**: Parse uploaded Excel files with ExcelJS

**Key Features**:

- Reads all 3 sheets (Parts, Vehicle Applications, Cross References)
- Parses hidden ID columns (`_id`, `_part_id`, `_acr_part_id`)
- Detects if file is an exported file (has hidden IDs) or invalid upload
- Handles empty cells correctly (null/undefined normalization)
- File validation (extension, size, MIME type)

**Methods**:

- `parseFile(file: File): Promise<ParsedExcelFile>` - Main entry point
- `validateFileFormat(file: File): void` - Pre-parse validation
- `parseSheet<T>(worksheet, sheetName): ParsedSheet<T>` - Generic sheet parser

**Performance**: ~300ms to parse 9,593 records (877 parts, 2,304 vehicles, 6,412 cross-refs)

---

### 2. ValidationEngine

**File**: `src/services/excel/validation/ValidationEngine.ts`
**Purpose**: Validate parsed data against database schema and business rules

**Error Rules** (19 total - block import):

- E1: Missing required hidden columns
- E2: Missing required field (ACR_SKU, Part_Type, Make, Model, etc.)
- E3: Empty ACR_SKU
- E4: Duplicate ACR_SKU in sheet
- E5: Invalid UUID format
- E6: Year range invalid (start_year > end_year)
- E7: String exceeds maximum length
- E8: Year out of valid range (1900 to current+2)
- E9: Invalid number format
- E10: Required sheet missing
- E11: Orphaned vehicle application (\_part_id not found)
- E12: Orphaned cross reference (\_acr_part_id not found)
- E13: Part_Type required for parts
- E14: Competitor_Brand required for cross-refs
- E15: Competitor_SKU required for cross-refs
- E16: Start_Year required for vehicle apps
- E17: End_Year required for vehicle apps
- E18: UUID in Excel doesn't exist in database (UPDATE attempt on deleted record)
- E19: PENDING part referenced by vehicle applications or cross-references

**Warning Rules** (10 total - user confirms):

- W1: ACR_SKU changed (can break existing references)
- W2: Year range narrowed (data loss)
- W3: Part_Type changed (affects categorization)
- W4: Position_Type changed
- W5: Cross-reference deleted (missing from file)
- W6: Vehicle application deleted (missing from file)
- W7: Specifications shortened significantly (>50% reduction)
- W8: Vehicle make changed
- W9: Vehicle model changed
- W10: Competitor brand changed

**Methods**:

- `validate(parsed, existingData): Promise<ValidationResult>` - Main validator
- `normalizeOptional(value): string | null` - Treats null/undefined/empty as equivalent

**Performance**: ~75ms to validate 9,593 records

---

### 3. DiffEngine

**File**: `src/services/excel/diff/DiffEngine.ts`
**Purpose**: Generate change preview by comparing file to database

**Diff Operations**:

- **ADD**: Row has no `_id` or `_id` is empty → INSERT new record
- **UPDATE**: Row has `_id` that exists in DB and data changed → UPDATE record
- **DELETE**: Record exists in DB but not in file → DELETE record
- **UNCHANGED**: Row has `_id` and data matches DB → No operation

**Change Detection**:

- ID-based matching only (no field-based fallback)
- Field-level change tracking (knows exactly which fields changed)
- Properly handles null/undefined/empty string equivalence for optional fields

**Methods**:

- `generateDiff(parsed, existingData): DiffResult` - Main diff generator
- `normalizeOptional(value): string | null` - Same normalization as validator

**Performance**: ~7ms to diff 9,593 records

---

## Critical Fixes Applied

### 1. Export Service Bug

**Problem**: Hidden ID columns were empty in exported files
**Cause**: Export service used property names `id`, `part_id` instead of Excel column keys `_id`, `_part_id`
**Fix**: Updated ExcelExportService to map database fields to correct column keys

### 2. Header Parsing Bug

**Problem**: Headers like `ACR_SKU` became `a_c_r__s_k_u`
**Cause**: Over-complicated conversion logic treating each capital as needing underscore
**Fix**: Simplified `headerToPropertyName()` to just lowercase and normalize underscores

### 3. Null/Undefined False Positives

**Problem**: 132 false warnings + 209 false updates detected
**Cause**: Database stores `null`, parser leaves fields `undefined`
**Fix**: Added `normalizeOptional()` helper in both ValidationEngine and DiffEngine

---

## Shared Constants

**File**: `src/services/excel/shared/constants.ts`

### Why Shared?

- Single source of truth prevents drift between export and import
- Ensures column headers, property names, and widths stay synchronized
- Changes to format only need to be made in one place

### What's Shared?

- `SHEET_NAMES` - Sheet names ('Parts', 'Vehicle Applications', 'Cross References')
- `COLUMN_HEADERS` - Excel column headers (e.g., 'ACR_SKU', 'Part_Type')
- `PROPERTY_NAMES` - JavaScript property names (e.g., 'acr_sku', 'part_type')
- `COLUMN_WIDTHS` - Excel column widths in characters
- `HIDDEN_ID_COLUMNS` - List of hidden ID columns ('\_id', '\_part_id', '\_acr_part_id')
- `FILE_VALIDATION` - Valid extensions (.xlsx, .xls), MIME types, max size (50MB)
- `PARTS_COLUMNS` - Full column definitions for Parts sheet
- `VEHICLE_APPLICATIONS_COLUMNS` - Full column definitions for Vehicle Apps sheet
- `CROSS_REFERENCES_COLUMNS` - Full column definitions for Cross Refs sheet

---

## Testing

### Test Scripts

1. **Export Test**: `npm run test:export`
   - Validates export format
   - Checks hidden columns
   - Verifies data integrity
   - Tests all 3 sheets

2. **Import Pipeline Test**: `npm run test:import-pipeline`
   - End-to-end test: Parse → Validate → Diff
   - Uses real exported data
   - Validates against live database
   - Shows detailed results

3. **Debug Parser**: `npx tsx scripts/debug-parser.ts`
   - Inspects raw parsed data
   - Useful for troubleshooting parser issues

### Test Results (2025-10-24)

```
✅ Export: 8/8 tests passed
   - 877 parts with hidden _id column
   - 2304 vehicle applications with hidden _id and _part_id
   - 6412 cross references with hidden _id and _acr_part_id

✅ Import Pipeline: All components working
   - Parse: 298ms (9,593 records)
   - Validation: 77ms (0 errors, 0 warnings)
   - Diff: 7ms (6,716 changes detected)
   - Total: ~1,100ms
```

---

## TODO: Remaining Components

### 1. ImportService (Phase 8.2)

- Create snapshot before import
- Apply changes in transaction (ADD/UPDATE/DELETE)
- Handle foreign key relationships (parts → vehicles → cross-refs)
- Record snapshot metadata (timestamp, user, record counts)
- Rollback on error

### 2. RollbackService (Phase 8.2)

- List available snapshots
- Restore to specific snapshot
- Enforce sequential rollback (can't skip snapshots)
- Validate snapshot integrity before restore
- Clean up old snapshots (configurable retention)

### 3. Import Wizard UI (Phase 8.2)

- Step 1: Upload file
- Step 2: Validation results (show errors/warnings)
- Step 3: Change preview (diff results with counts)
- Step 4: Confirm import (user reviews and approves)
- Progress indicator during import
- Success/error feedback

### 4. Rollback Manager UI (Phase 8.2)

- List snapshots with metadata (timestamp, user, changes)
- Preview snapshot contents
- Restore to snapshot (with confirmation)
- Delete old snapshots
- Admin settings (retention policy)

---

## Design Decisions

### Why ID-Based Matching?

- **Reliability**: Field-based matching is error-prone (user might change ACR_SKU)
- **Performance**: Direct ID lookup is O(1) vs fuzzy matching
- **Clarity**: User sees exactly which records will be updated vs added
- **Foreign Keys**: IDs required for vehicle apps and cross-refs anyway

### Why Export-Only Workflow?

- **Safety**: Users can't accidentally create duplicates
- **Tracking**: Every imported record has history via export file
- **UUIDs**: Hidden IDs ensure referential integrity across related records

### Why Snapshots Instead of Change Log?

- **Simplicity**: Single snapshot restore vs replaying many change operations
- **Speed**: Fast restore (just copy snapshot data back)
- **Reliability**: No chance of corrupted change log
- **Storage**: PostgreSQL handles snapshot storage efficiently

### Why Normalize Null/Undefined/Empty?

- **Database Reality**: NULL is database standard for "no value"
- **Excel Reality**: Empty cells become undefined in JavaScript
- **User Experience**: Don't warn about meaningless differences
- **Compatibility**: Works with both old (null) and new (undefined) data

---

## Performance Characteristics

### Current Performance (9,593 records)

- **Parse**: ~300ms (31 records/ms)
- **Validate**: ~75ms (127 records/ms)
- **Diff**: ~7ms (1,370 records/ms)
- **Total**: ~1,100ms

### Expected Performance at Scale

- **50,000 records**: ~5 seconds (acceptable)
- **100,000 records**: ~10 seconds (still acceptable for bulk import)

### Optimization Opportunities (if needed)

1. Streaming parser (process rows as they're read)
2. Web Workers for validation/diff (parallel processing)
3. Database batch operations (bulk INSERT/UPDATE)
4. Incremental snapshots (only changed data)

---

## Related Documentation

- [EXCEL_EXPORT.md](./EXCEL_EXPORT.md) - Excel export service documentation
- [BULK_OPERATIONS.md](./BULK_OPERATIONS.md) - Bulk operations API
- [../../PLANNING.md](../../PLANNING.md) - Overall project architecture
- [../../TASKS.md](../../TASKS.md) - Current development roadmap

---

## Development Log

### 2025-10-24 - Session 2 (2.5 hours)

- ✅ Built shared constants module (single source of truth)
- ✅ Built ExcelImportService with hidden column support
- ✅ Built ValidationEngine (19 errors, 10 warnings)
- ✅ Built DiffEngine with ID-based matching
- ✅ Fixed export service bug (hidden IDs not populated)
- ✅ Fixed parser bug (header name conversion)
- ✅ Fixed null/undefined false positives in validator and diff
- ✅ Created comprehensive test suite
- ✅ All tests passing (parse, validate, diff)
