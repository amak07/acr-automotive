# Phase 3: Excel Enhancements Implementation Plan

**Based on**: IMPLEMENTATION_PLAN.md Phase 3 + EXPORT_FORMAT_ANALYSIS.md + ML Template Analysis v2.0
**Scope**: 3A (Cross-References in Parts Sheet) + 3B (Image URL Management)
**Created**: January 2026

---

## Overview

Phase 3 enhances the Excel import/export system with two major features:

1. **Phase 3A**: Merge cross-references into Parts sheet using 11 brand columns (matching Humberto's "LISTA DE PRECIOS" format)
2. **Phase 3B**: Add 4 image URL columns + create image upload dashboard (ML "Gestor de fotos" pattern)

**Current State**: 3-sheet format (Parts, Vehicle Applications, Cross References)
**Target State**: 2-sheet format (Parts with inline cross-refs + images, Vehicle Applications)

---

## Key ML Template Insights (from Analysis v2.0)

### Dual Workflow System

- **Create workflow**: Blank template → fill new items → upload creates
- **Update workflow**: Download existing data → modify → upload updates
- **Our approach**: "Update workflow" pattern (export → modify → import)

### Deletion Handling - DECIDED

ML requires **EXPLICIT** deletion - items missing from upload are UNTOUCHED.

| Option                    | Behavior                     | Pros                            | Cons                            |
| ------------------------- | ---------------------------- | ------------------------------- | ------------------------------- |
| **A: ML-style ✅ CHOSEN** | Missing cross-refs untouched | Safe, matches ML                | Requires explicit delete action |
| B: Sync-to-Excel          | Missing cross-refs deleted   | Excel is single source of truth | Dangerous - accidental deletes  |

**Decision**: Option A (ML-style) - Use `[DELETE]` marker for explicit deletions.

### Image Upload Workflow

ML uses "Gestor de fotos" web UI:

1. Excel cell contains hyperlink to upload page
2. User uploads images in web UI
3. Gets public URLs
4. Pastes URLs back in Excel
5. Import links images to parts

**Our approach**: Build `/admin/upload-images` dashboard matching this pattern.

---

## Phase 3A: Cross-References in Parts Sheet

### Goal

Replace separate Cross References sheet with 11 brand-specific columns in the Parts sheet, using semicolon-separated SKUs.

### Brand Columns (from Humberto's LISTA DE PRECIOS)

| Column Header | Property Name | Database Brand |
| ------------- | ------------- | -------------- |
| National_SKUs | national_skus | NATIONAL       |
| ATV_SKUs      | atv_skus      | ATV            |
| SYD_SKUs      | syd_skus      | SYD            |
| TMK_SKUs      | tmk_skus      | TMK            |
| GROB_SKUs     | grob_skus     | GROB           |
| RACE_SKUs     | race_skus     | RACE           |
| OEM_SKUs      | oem_skus      | OEM            |
| OEM_2_SKUs    | oem_2_skus    | OEM 2          |
| GMB_SKUs      | gmb_skus      | GMB            |
| GSP_SKUs      | gsp_skus      | GSP            |
| FAG_SKUs      | fag_skus      | FAG            |

### Key Behaviors

- **Export**: Group cross-refs by brand, join with semicolons (e.g., "TM-123;TM-456")
- **Import**: Parse semicolon-separated values, upsert to database
- **Add**: New SKUs in column → create cross_references records
- **Update**: Existing SKUs → update if changed
- **Delete**: Requires explicit `[DELETE]` marker in SKU value (ML-style safety)
- **Empty Column**: No change to existing cross-refs (safe default)
- **Duplicates**: Allowed across brands (warn but don't block)

**Delete Example**: `"TM-123;[DELETE]TM-456;TM-789"` → Keeps TM-123, deletes TM-456, adds TM-789

### Files to Modify

#### 1. `src/services/excel/shared/constants.ts`

- Add 11 brand column definitions to `COLUMN_HEADERS.PARTS`
- Add corresponding entries to `PROPERTY_NAMES.PARTS`
- Add `COLUMN_WIDTHS.PARTS` entries (width: 25)
- Add `BRAND_COLUMN_MAP` constant for brand name mapping
- Update `PARTS_COLUMNS` array with new columns
- Remove/deprecate `CROSS_REFERENCES` sheet definitions

#### 2. `src/services/excel/shared/types.ts`

- Add 11 optional string properties to `ExcelPartRow` interface
- Remove or deprecate `ExcelCrossRefRow` interface

#### 3. `src/services/export/ExcelExportService.ts`

- Add `fetchCrossRefsByPart()` method to group cross-refs by part_id and brand
- Update `addPartsSheet()` to populate brand columns with semicolon-joined SKUs
- Remove `addCrossRefsSheet()` method (or keep for backward compatibility period)

#### 4. `src/services/excel/import/ImportService.ts`

- Add cross-ref parsing logic for brand columns
- Implement ML-style upsert strategy:
  1. Parse brand columns for adds and `[DELETE]` markers
  2. Add new cross-refs
  3. Delete only explicitly marked cross-refs
- Remove Cross References sheet import logic

#### 5. `src/services/excel/validation/ValidationEngine.ts`

- Add validation for brand column format (semicolon-separated)
- Add max length validation per SKU (50 chars)
- Add `[DELETE]` marker validation
- Add duplicate SKU warning (within same brand)
- Remove Cross References sheet validation

#### 6. `src/services/excel/diff/DiffEngine.ts` - MAJOR REFACTOR

Current behavior (lines 348-357):

```typescript
// Find deletes (in database but not in file) - AUTO-DELETE
existingCrossRefs.forEach((existing, id) => {
  if (!processedIds.has(id)) {
    deletes.push({ operation: DiffOperation.DELETE, before: existing });
  }
});
```

**New behavior needed:**

- Remove `diffCrossReferences()` method (Cross References sheet eliminated)
- Add `diffCrossRefsFromBrandColumns(partRow, existingCrossRefs)` method
- Parse brand columns to extract cross-refs with part context
- **Add**: New SKUs in brand column → create cross_references
- **Delete**: Only SKUs prefixed with `[DELETE]` → delete from DB
- **Unchanged**: SKUs in DB but not in brand column → NO ACTION (ML-style safe)

**New helper methods:**

```typescript
parseBrandColumn(value: string): { adds: string[], deletes: string[] }
// "TM-123;[DELETE]TM-456;TM-789" → { adds: ["TM-123", "TM-789"], deletes: ["TM-456"] }
```

---

## Phase 3B: Image URL Management

### Goal

Add 4 image URL columns to Parts sheet + create upload dashboard for the Mercado Libre-style workflow.

### Image Columns

| Column Header     | Property Name     | View Type  |
| ----------------- | ----------------- | ---------- |
| Image_URL_Front   | image_url_front   | front      |
| Image_URL_Back    | image_url_back    | back       |
| Image_URL_Top     | image_url_top     | top        |
| Image_URL_Other   | image_url_other   | other      |
| 360_Viewer_Status | viewer_360_status | (readonly) |

### Key Behaviors

- **Export**: Get image URL by `view_type` from `part_images` table
- **Import**: Validate URLs, upsert by view_type (merge mode, not replace)
- **360 Status**: Export shows "Confirmed" if `has_360_viewer = true`

### Files to Modify

#### 1. `src/services/excel/shared/constants.ts`

- Add 5 image-related columns to `COLUMN_HEADERS.PARTS`
- Add to `PROPERTY_NAMES.PARTS` and `COLUMN_WIDTHS.PARTS`
- Add `IMAGE_VIEW_TYPE_MAP` constant

#### 2. `src/services/excel/shared/types.ts`

- Add 5 optional properties to `ExcelPartRow`

#### 3. `src/services/export/ExcelExportService.ts`

- Add `fetchImagesByPart()` to get images grouped by view_type
- Update `addPartsSheet()` to populate image URL columns
- Add 360 viewer status from `parts.has_360_viewer`

#### 4. `src/services/excel/import/ImportService.ts`

- Add image URL processing logic
- Upsert by view_type (update existing or create new)
- Skip empty URL columns (don't delete existing images)

#### 5. `src/services/excel/validation/ValidationEngine.ts`

- Add URL format validation (https:// prefix)
- Add URL max length check (2000 chars)

### New Files to Create

#### 1. `src/app/admin/upload-images/page.tsx`

Image upload dashboard with:

- Drag-drop zone for image upload
- Upload to Supabase Storage bucket
- Display thumbnail + full URL
- "Copy URL" button for clipboard
- Instructions for Excel workflow

#### 2. `src/app/api/admin/upload-images/route.ts`

- POST: Upload image to `acr-part-images` bucket
- Return public URL
- No part association (standalone upload for Excel workflow)

---

## Implementation Order

### Step 1: Update Constants & Types

1. Add all new column definitions to `constants.ts`
2. Update `ExcelPartRow` interface in `types.ts`
3. Add `BRAND_COLUMN_MAP` and `IMAGE_VIEW_TYPE_MAP`

### Step 2: Update Export Service

1. Add `fetchCrossRefsByPart()` method
2. Add `fetchImagesByPart()` method
3. Update `addPartsSheet()` to use new columns
4. Remove/deprecate Cross References sheet export

### Step 3: Update DiffEngine (MAJOR)

1. Remove `diffCrossReferences()` method
2. Add `diffCrossRefsFromBrandColumns()` method
3. Implement `parseBrandColumn()` helper for `[DELETE]` markers
4. Change delete logic: explicit only, not auto-detect missing

### Step 4: Update Import Service

1. Add cross-ref parsing from brand columns
2. Add image URL processing
3. Remove Cross References sheet import

### Step 5: Update Validation Engine

1. Add brand column validation rules
2. Add `[DELETE]` marker validation
3. Add image URL validation rules
4. Remove Cross References sheet validation

### Step 6: Create Upload Dashboard

1. Create page component with drag-drop
2. Create API route for uploads
3. Add to admin navigation

### Step 7: Testing

1. Export with brand columns + image URLs
2. Import modified Excel
3. Verify cross-ref add/delete with `[DELETE]` marker
4. Verify image URL upsert
5. Roundtrip test (export → modify → import → export)

---

## Backward Compatibility

**Decision**: Clean break (new format only)

- 2-sheet format: Parts (with inline cross-refs + images), Vehicle Applications
- Old 3-sheet files will fail validation with clear error message
- Users must re-export to get new format with brand columns

---

## Verification Checklist

### Phase 3A: Cross-References

- [ ] Export produces 2-sheet file (Parts + Vehicle Applications)
- [ ] Brand columns contain semicolon-separated SKUs
- [ ] Import adds new SKUs correctly
- [ ] Import ignores empty brand columns (no auto-delete)
- [ ] `[DELETE]` marker explicitly removes specified SKUs
- [ ] Validation warns on duplicate SKUs within same brand

### Phase 3B: Image URLs

- [ ] Image URL columns populated from `part_images` by view_type
- [ ] 360_Viewer_Status shows "Confirmed" when applicable
- [x] Upload dashboard works (drag-drop → URL → copy) ✅ 2026-01-31
- [ ] Import upserts images by view_type (merge, not replace)
- [ ] **TODO**: Test Excel import with pasted image URLs links to parts correctly
- [ ] Invalid URLs caught by validation
- [ ] Roundtrip preserves all data accurately

---

## Critical Files Summary

| File                                                | Changes                                                |
| --------------------------------------------------- | ------------------------------------------------------ |
| `src/services/excel/shared/constants.ts`            | Add 16 new columns, brand map, view type map           |
| `src/services/excel/shared/types.ts`                | Extend ExcelPartRow interface                          |
| `src/services/export/ExcelExportService.ts`         | Add cross-ref grouping, image fetching                 |
| `src/services/excel/diff/DiffEngine.ts`             | MAJOR: New cross-ref diff logic with `[DELETE]` marker |
| `src/services/excel/import/ImportService.ts`        | Parse brand columns, process image URLs                |
| `src/services/excel/validation/ValidationEngine.ts` | New validation rules                                   |
| `src/app/admin/upload-images/page.tsx`              | NEW - Upload dashboard                                 |
| `src/app/api/admin/upload-images/route.ts`          | NEW - Upload API                                       |
