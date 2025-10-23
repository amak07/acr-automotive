# Excel Format Specification - ACR Data Management

**Project**: ACR Automotive - Category 1 Data Management System
**Version**: 1.0
**Last Updated**: October 2025

---

## Overview

This document defines the exact Excel format used for ACR's bulk export/import system. All exported files follow this specification. Users must export first, modify the exported file, then re-import.

**Key Principles**:
- ✅ **Export-only workflow** - No blank templates allowed
- ✅ **Hidden ID columns** - UUIDs for ID-based matching
- ✅ **3-sheet structure** - Parts, Vehicle_Applications, Cross_References
- ✅ **Multi-tenant ready** - Hidden tenant_id column (future-proof)

---

## File Structure

### Workbook Metadata

| Property | Value |
|----------|-------|
| File Format | `.xlsx` (Excel 2007+) |
| Encoding | UTF-8 |
| Sheet Count | 3 (required) |
| Max File Size | 50 MB |
| Max Rows | 1,048,576 per sheet (Excel limit) |

### Sheet Names (Exact Match Required)

1. `Parts` - Main parts catalog
2. `Vehicle_Applications` - Vehicle compatibility data
3. `Cross_References` - Competitor cross-reference data

**Note**: Sheet names are case-sensitive and must match exactly.

---

## Sheet 1: Parts

### Column Structure

| Column | Field Name | Type | Required | Hidden | Max Length | Notes |
|--------|------------|------|----------|--------|------------|-------|
| A | `_id` | UUID | Yes* | ✅ Yes | 36 | Primary key (hidden column) |
| B | `_tenant_id` | UUID | No | ✅ Yes | 36 | Multi-tenant ID (future, hidden) |
| C | `acr_sku` | String | Yes | No | 50 | ACR part number (semi-immutable) |
| D | `brand` | String | Yes | No | 100 | Brand name |
| E | `category_1` | String | Yes | No | 100 | Primary category |
| F | `category_2` | String | No | No | 100 | Secondary category |
| G | `category_3` | String | No | No | 100 | Tertiary category |
| H | `description` | String | No | No | 1000 | Part description |
| I | `price` | Number | No | No | - | Price (≥ 0, 2 decimals) |
| J | `stock_quantity` | Integer | No | No | - | Stock count (≥ 0) |
| K | `discontinued` | Boolean | No | No | - | TRUE/FALSE |
| L | `notes` | String | No | No | 1000 | Internal notes |
| M | `has_360_viewer` | Boolean | No | No | - | TRUE/FALSE (read-only) |
| N | `viewer_360_frame_count` | Integer | No | No | - | Frame count (12-48, read-only) |

**\* _id is required for updates/deletes, omitted for new rows (adds)**

### Example Data (Parts)

```
| _id                                  | _tenant_id | acr_sku    | brand      | category_1    | category_2 | category_3 | description              | price  | stock_quantity | discontinued | notes        | has_360_viewer | viewer_360_frame_count |
|--------------------------------------|------------|------------|------------|---------------|------------|------------|--------------------------|--------|----------------|--------------|--------------|----------------|------------------------|
| 550e8400-e29b-41d4-a716-446655440000 |            | ACR-001    | ACR Brand  | Brake System  | Rotors     |            | Front brake rotor 12"    | 45.99  | 150            | FALSE        |              | FALSE          | 0                      |
| 660e8400-e29b-41d4-a716-446655440001 |            | ACR-002    | ACR Brand  | Suspension    | Shocks     |            | Rear shock absorber      | 89.50  | 75             | FALSE        |              | TRUE           | 24                     |
|                                      |            | ACR-NEW    | ACR Brand  | Engine        | Filters    | Oil        | High-flow oil filter     | 12.99  | 500            | FALSE        |              | FALSE          | 0                      |
```

**Notes**:
- Row 1 (headers) is required
- Row 2: Existing part (has `_id`) → Will update if modified
- Row 3: Existing part (has `_id`) → Will update if modified
- Row 4: New part (no `_id`) → Will create new record

### Hidden Columns (A-B)

Hidden columns are set using Excel's column width property:

```typescript
// SheetJS implementation
worksheet['!cols'] = [
  { hidden: true },  // Column A (_id)
  { hidden: true },  // Column B (_tenant_id)
  { wch: 15 },       // Column C (acr_sku)
  { wch: 20 },       // Column D (brand)
  // ... rest of columns
];
```

**User Experience**:
- Columns A-B are invisible in Excel by default
- Users can unhide manually (View → Unhide Columns)
- IDs are preserved when user edits visible columns

---

## Sheet 2: Vehicle_Applications

### Column Structure

| Column | Field Name | Type | Required | Hidden | Max Length | Notes |
|--------|------------|------|----------|--------|------------|-------|
| A | `_id` | UUID | Yes* | ✅ Yes | 36 | Primary key (hidden) |
| B | `_tenant_id` | UUID | No | ✅ Yes | 36 | Multi-tenant ID (hidden) |
| C | `_part_id` | UUID | Yes | ✅ Yes | 36 | Foreign key to Parts._id (hidden) |
| D | `make` | String | Yes | No | 100 | Vehicle make (e.g., "Ford") |
| E | `model` | String | Yes | No | 100 | Vehicle model (e.g., "F-150") |
| F | `year_start` | Integer | Yes | No | - | Start year (1900-2100) |
| G | `year_end` | Integer | No | No | - | End year (≥ year_start) |
| H | `engine` | String | No | No | 100 | Engine spec (e.g., "5.0L V8") |
| I | `notes` | String | No | No | 500 | Application notes |

**\* _id is required for updates/deletes, omitted for new rows (adds)**

### Example Data (Vehicle_Applications)

```
| _id                                  | _tenant_id | _part_id                             | make  | model  | year_start | year_end | engine   | notes                          |
|--------------------------------------|------------|--------------------------------------|-------|--------|------------|----------|----------|--------------------------------|
| 770e8400-e29b-41d4-a716-446655440000 |            | 550e8400-e29b-41d4-a716-446655440000 | Ford  | F-150  | 2015       | 2020     | 5.0L V8  | Fits all trim levels           |
| 880e8400-e29b-41d4-a716-446655440001 |            | 550e8400-e29b-41d4-a716-446655440000 | Ford  | F-150  | 2021       |          | 3.5L V6  | EcoBoost models only           |
|                                      |            | 660e8400-e29b-41d4-a716-446655440001 | Chevy | Tahoe  | 2018       | 2023     |          | All engines compatible         |
```

**Notes**:
- `_part_id` must reference a valid `_id` from Parts sheet
- If `_part_id` is invalid, validation error: `ORPHANED_FOREIGN_KEY`
- New rows (no `_id`) will auto-generate UUIDs

---

## Sheet 3: Cross_References

### Column Structure

| Column | Field Name | Type | Required | Hidden | Max Length | Notes |
|--------|------------|------|----------|--------|------------|-------|
| A | `_id` | UUID | Yes* | ✅ Yes | 36 | Primary key (hidden) |
| B | `_tenant_id` | UUID | No | ✅ Yes | 36 | Multi-tenant ID (hidden) |
| C | `_part_id` | UUID | Yes | ✅ Yes | 36 | Foreign key to Parts._id (hidden) |
| D | `competitor_brand` | String | Yes | No | 100 | Competitor brand name |
| E | `competitor_sku` | String | Yes | No | 50 | Competitor part number |
| F | `notes` | String | No | No | 500 | Cross-reference notes |

**\* _id is required for updates/deletes, omitted for new rows (adds)**

### Example Data (Cross_References)

```
| _id                                  | _tenant_id | _part_id                             | competitor_brand | competitor_sku | notes                              |
|--------------------------------------|------------|--------------------------------------|------------------|----------------|------------------------------------|
| 990e8400-e29b-41d4-a716-446655440000 |            | 550e8400-e29b-41d4-a716-446655440000 | Brembo           | 09.9772.11     | Direct replacement                 |
| aa0e8400-e29b-41d4-a716-446655440001 |            | 550e8400-e29b-41d4-a716-446655440000 | Wagner           | BD125931       | Budget alternative                 |
|                                      |            | 660e8400-e29b-41d4-a716-446655440001 | Monroe           | 181622         | OEM equivalent                     |
```

**Notes**:
- `_part_id` must reference a valid `_id` from Parts sheet
- Duplicate `competitor_sku` allowed (different parts may cross-reference same competitor part)

---

## Field Type Specifications

### UUID (Universally Unique Identifier)

**Format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
**Example**: `550e8400-e29b-41d4-a716-446655440000`
**Validation**: Standard UUID v4 format (case-insensitive)

**Usage**:
- `_id` - Primary key
- `_tenant_id` - Tenant identifier (future)
- `_part_id` - Foreign key reference

**Excel Display**: Text format (prevent scientific notation)

### String

**Encoding**: UTF-8
**Trimming**: Leading/trailing whitespace trimmed on import
**Empty Strings**: Treated as `NULL` in database

**Validation**:
- Max length enforced (see column specs)
- Special characters allowed
- Line breaks preserved in multi-line fields (description, notes)

### Number (Decimal)

**Format**: Decimal number with up to 2 decimal places
**Example**: `45.99`, `1299.50`
**Range**: ≥ 0 (negative values rejected)

**Excel Format**: Number with 2 decimal places
**Validation**: Error if negative or invalid format

### Integer

**Format**: Whole number
**Example**: `150`, `2015`
**Range**: Varies by field (see column specs)

**Excel Format**: Number with 0 decimal places
**Validation**: Error if decimal or out of range

### Boolean

**Format**: `TRUE` or `FALSE` (case-insensitive)
**Accepted Values**: `TRUE`, `FALSE`, `1`, `0`, `Yes`, `No`

**Excel Format**: Boolean cell type
**Database Storage**: PostgreSQL `BOOLEAN`

**Validation**: Error if invalid value

---

## Validation Rules

### Error Rules (23 Total)

Import will be **blocked** if any of these errors are found:

| Code | Severity | Description | Example |
|------|----------|-------------|---------|
| E1 | Error | Missing hidden ID columns | File not exported from ACR system |
| E2 | Error | Duplicate ACR_SKU within file | Two rows with same `acr_sku` |
| E3 | Error | Empty required field | `acr_sku` is blank |
| E4 | Error | Invalid UUID format | `_id` = "invalid-uuid" |
| E5 | Error | Orphaned foreign key | `_part_id` not in Parts sheet |
| E6 | Error | Invalid year range | `year_end` < `year_start` |
| E7 | Error | Negative price | `price` = -10.00 |
| E8 | Error | Negative stock quantity | `stock_quantity` = -5 |
| E9 | Error | Invalid frame count | `viewer_360_frame_count` = 100 (max 48) |
| E10 | Error | String exceeds max length | `description` > 1000 chars |
| E11 | Error | Invalid number format | `price` = "abc" |
| E12 | Error | Year out of range | `year_start` = 1800 (min 1900) |
| E13 | Error | Invalid boolean value | `discontinued` = "maybe" |
| E14 | Error | Required sheet missing | No "Parts" sheet found |
| E15 | Error | Duplicate header columns | Two "acr_sku" columns |
| E16 | Error | Missing required headers | No "brand" column |
| E17 | Error | Invalid sheet name | Sheet named "Parts_" (extra char) |
| E18 | Error | File format invalid | `.csv` file instead of `.xlsx` |
| E19 | Error | File size exceeds limit | File > 50 MB |
| E20 | Error | Malformed Excel file | Corrupted file structure |
| E21 | Error | Referential integrity violation | Delete part with vehicle apps |
| E22 | Error | MIME type mismatch | File extension vs actual format |
| E23 | Error | Encoding error | Invalid UTF-8 characters |

### Warning Rules (12 Total)

Import will **proceed** with warnings (user review recommended):

| Code | Severity | Description | Example |
|------|----------|-------------|---------|
| W1 | Warning | ACR_SKU changed | Changed "ACR-001" → "ACR-001-V2" |
| W2 | Warning | Large price increase (>50%) | Price $50 → $80 (60% increase) |
| W3 | Warning | Stock dropped to zero | `stock_quantity` 100 → 0 |
| W4 | Warning | Part marked discontinued | `discontinued` FALSE → TRUE |
| W5 | Warning | Price decreased significantly | Price $100 → $40 (60% decrease) |
| W6 | Warning | Frame count reduced | `viewer_360_frame_count` 24 → 12 |
| W7 | Warning | Year range narrowed | `year_start` 2015 → 2017 (loses 2015-2016) |
| W8 | Warning | Description significantly shortened | Description 500 chars → 50 chars |
| W9 | Warning | Category changed | `category_1` changed |
| W10 | Warning | Brand changed | `brand` "ACR" → "OEM" |
| W11 | Warning | Cross-reference deleted | Removed competitor mapping |
| W12 | Warning | Vehicle application removed | Deleted vehicle compatibility |

---

## Import Matching Logic

### ID-Based Matching (Only Strategy)

**Rule**: Rows are matched by `_id` column only. No field-based fallback.

**Scenarios**:

1. **Add New Row**
   - Condition: Row has no `_id` or `_id` is empty
   - Action: Insert new record, auto-generate UUID
   - Example: Row 4 in Parts example above

2. **Update Existing Row**
   - Condition: Row has valid `_id` that exists in database
   - Action: Update record with matching `_id`
   - Example: Rows 2-3 in Parts example above

3. **Delete Existing Row**
   - Condition: Database record with `_id` NOT present in uploaded file
   - Action: Delete record from database
   - Example: If database has `_id=abc123` but file doesn't include it

4. **Error: Invalid ID**
   - Condition: Row has `_id` that doesn't exist in database
   - Action: Validation error E4 (Invalid UUID)
   - Example: `_id` = "999e8400-e29b-41d4-a716-446655440000" (not in DB)

**Why ID-Based Only?**
- ✅ Multi-tenant safe (no SKU collisions)
- ✅ Prevents data loss (SKU changes don't lose history)
- ✅ Simpler logic (no ambiguous matches)
- ✅ Export-only workflow enforces ID presence

---

## Export Format Details

### Column Widths

Recommended column widths for readability:

| Sheet | Column | Width | Notes |
|-------|--------|-------|-------|
| Parts | A (_id) | 0 | Hidden |
| Parts | B (_tenant_id) | 0 | Hidden |
| Parts | C (acr_sku) | 15 | |
| Parts | D (brand) | 20 | |
| Parts | E (category_1) | 20 | |
| Parts | F-G (category_2/3) | 20 | |
| Parts | H (description) | 40 | |
| Parts | I (price) | 12 | |
| Parts | J (stock_quantity) | 15 | |
| Parts | K (discontinued) | 12 | |
| Parts | L (notes) | 30 | |
| Parts | M-N (360 viewer) | 18 | |

### Cell Formats

| Field Type | Excel Format Code | Example |
|------------|-------------------|---------|
| UUID | `@` (Text) | `550e8400-e29b-41d4-a716-446655440000` |
| String | `@` (Text) | `ACR Brand` |
| Number (Price) | `0.00` | `45.99` |
| Integer | `0` | `150` |
| Boolean | `General` | `TRUE` |

### Header Row Formatting

- **Font**: Bold, 11pt, Calibri
- **Background**: Light gray (`#F2F2F2`)
- **Alignment**: Center horizontal, center vertical
- **Borders**: Bottom border (medium weight)
- **Row Height**: 30px

---

## Multi-Tenant Considerations

### tenant_id Column (Future-Proof)

**Current State**: Column present but always empty
**Future State**: Auto-populated by backend based on user authentication

**User Experience**:
- Users see empty `_tenant_id` column (hidden)
- Backend automatically filters/sets `tenant_id` on import
- Users cannot manually edit `_tenant_id` (validation error if modified)

**Schema**:
```sql
tenant_id UUID DEFAULT NULL
```

**When Multi-Tenancy Activates**:
1. Backend adds authentication check
2. `tenant_id` auto-set on import: `tenantId = getCurrentUserTenant()`
3. Export filters by tenant: `WHERE tenant_id = $1`
4. Validation ensures `_tenant_id` matches user's tenant

**No Migration Required** - Schema already prepared.

---

## Example Complete File

### Parts Sheet

```
_id                                  | _tenant_id | acr_sku | brand     | category_1   | category_2 | category_3 | description           | price  | stock_quantity | discontinued | notes | has_360_viewer | viewer_360_frame_count
550e8400-e29b-41d4-a716-446655440000 |            | ACR-001 | ACR Brand | Brake System | Rotors     |            | Front brake rotor 12" | 45.99  | 150            | FALSE        |       | FALSE          | 0
660e8400-e29b-41d4-a716-446655440001 |            | ACR-002 | ACR Brand | Suspension   | Shocks     |            | Rear shock absorber   | 89.50  | 75             | FALSE        |       | TRUE           | 24
```

### Vehicle_Applications Sheet

```
_id                                  | _tenant_id | _part_id                             | make | model | year_start | year_end | engine  | notes
770e8400-e29b-41d4-a716-446655440000 |            | 550e8400-e29b-41d4-a716-446655440000 | Ford | F-150 | 2015       | 2020     | 5.0L V8 | Fits all trim levels
```

### Cross_References Sheet

```
_id                                  | _tenant_id | _part_id                             | competitor_brand | competitor_sku | notes
990e8400-e29b-41d4-a716-446655440000 |            | 550e8400-e29b-41d4-a716-446655440000 | Brembo           | 09.9772.11     | Direct replacement
```

---

## Common User Workflows

### Workflow 1: Add New Parts

1. **Export** current catalog via admin UI
2. **Open** exported `.xlsx` file in Excel
3. **Add new rows** at bottom of Parts sheet (leave `_id` empty)
4. **Add related rows** in Vehicle_Applications/Cross_References (leave `_id` empty, use correct `_part_id`)
5. **Save** file (keep `.xlsx` format)
6. **Import** via admin UI
7. **Review** validation warnings (if any)
8. **Execute** import

**Result**: New parts created with auto-generated UUIDs

---

### Workflow 2: Update Existing Parts

1. **Export** current catalog
2. **Open** exported file
3. **Modify** visible columns (price, stock, description, etc.)
4. **Do NOT modify** `_id` columns (hidden, but preserved)
5. **Save** file
6. **Import** via admin UI
7. **Review** diff preview (shows updates detected)
8. **Execute** import

**Result**: Existing parts updated, IDs preserved

---

### Workflow 3: Delete Parts

1. **Export** current catalog
2. **Open** exported file
3. **Delete entire rows** for parts to remove
4. **Save** file
5. **Import** via admin UI
6. **Review** diff preview (shows deletes detected)
7. **Confirm** deletions (will cascade to vehicle apps/cross refs)
8. **Execute** import

**Result**: Parts and related data deleted

---

### Workflow 4: Bulk Price Update

1. **Export** current catalog
2. **Open** in Excel
3. **Select** price column (column I)
4. **Apply formula** (e.g., `=I2*1.10` for 10% increase)
5. **Fill down** formula
6. **Copy → Paste Values** to replace formulas
7. **Save** file
8. **Import** via admin UI
9. **Review** warnings (W2 if >50% increase)
10. **Execute** import

**Result**: All prices updated

---

## Import Performance Expectations

| File Size | Row Count | Parse Time | Validation Time | Import Time | Total Time |
|-----------|-----------|------------|-----------------|-------------|------------|
| 1 MB | 1,000 rows | <1s | <2s | <5s | <8s |
| 5 MB | 5,000 rows | <2s | <3s | <10s | <15s |
| 10 MB | 10,000 rows | <3s | <5s | <20s | <28s |
| 50 MB | 50,000 rows | <10s | <15s | <60s | <85s |

**Notes**:
- Times are estimates for single-user environment
- Actual performance depends on server specs
- Validation time increases with complex rules
- Import time dominated by database operations

---

## Troubleshooting

### Error: "Missing hidden ID columns"

**Cause**: File was manually created instead of exported
**Solution**: Export first, then modify exported file

---

### Error: "Orphaned foreign key"

**Cause**: `_part_id` in Vehicle_Applications/Cross_References doesn't match any Parts._id
**Solution**:
1. Check `_part_id` value in error message
2. Verify corresponding row exists in Parts sheet
3. Copy correct `_id` from Parts sheet (unhide column A)

---

### Error: "Duplicate ACR_SKU"

**Cause**: Multiple rows in Parts sheet have same `acr_sku`
**Solution**:
1. Search for duplicate SKU in Excel (Ctrl+F)
2. Remove or modify duplicate row
3. Re-import

---

### Warning: "ACR_SKU changed"

**Cause**: User modified `acr_sku` field for existing part
**Impact**: May break search history, customer references
**Action**: Review carefully, proceed if intentional

---

### Error: "Invalid UUID format"

**Cause**: `_id` column corrupted or manually edited
**Solution**:
1. Re-export fresh file
2. Copy visible data from corrupted file
3. Paste into fresh export (preserves hidden IDs)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 2025 | Initial specification |

---

**End of Excel Format Specification**
