# ACR Automotive: System Enhancement Implementation Plan

**Based on**: Humberto's 9 requirements for production system improvements
**Created**: 2026-01-27
**Status**: ✅ Ready for Implementation (All clarifications received)
**Estimated Duration**: 10-14 working days

---

## Executive Summary

This plan addresses 9 interconnected system enhancements for ACR Automotive's production platform. Based on thorough exploration of the codebase and Humberto's clarifications, the work is organized into **4 focused phases** addressing authentication, database optimization, Excel enhancements, and UI improvements.

### Requirements Summary

| #   | Requirement                                          | Status         | Implementation Phase | Effort   |
| --- | ---------------------------------------------------- | -------------- | -------------------- | -------- |
| 1   | Search / Finder improvements                         | 🔄 In Progress | Phase 4A             | 1-2 days |
| 2   | User Management (roles, auth, password change)       | ✅ Done        | Phase 1              | 3-4 days |
| 3   | Database review & optimization                       | ✅ Done        | Phase 2B             | 1 day    |
| 4a  | Excel - Image URL management (ML-style workflow)     | ✅ Done        | Phase 3B             | 2-3 days |
| 4b  | Excel - Cross-reference brands (11 explicit columns) | ✅ Done        | Phase 3A             | 1-2 days |
| 4c  | Excel - ACR brand handling                           | ⏭️ Skip        | N/A                  | Skipped  |
| 5   | Export / Delete issues (partial delete bug)          | ✅ Done        | Phase 2A             | 1 day    |
| 6   | Images & SKUs linking                                | 🔄 In Progress | Phase 4C             | 0.5 day  |
| 7   | Parts & Cross-references merge                       | 🔄 In Progress | Phase 4B             | 0.5 day  |
| 8   | Mobile / Tablet optimization (floating buttons)      | 🔄 In Progress | Phase 4D             | 0.5 day  |
| 9   | System updates visibility (cache reduction)          | ⏭️ Skip        | N/A                  | Skipped  |

**Total Estimated Effort**: 10-14 working days

---

## Key Decisions & Clarifications

### From Humberto's Feedback

✅ **Delete Issue (Req #5)**: Confirmed bug - partial delete leaves ID orphan. All data removed except part ID, causing empty rows in export and search results.

✅ **User Roles (Req #2)**: Two roles needed:

- **Admin**: Full system access (users, settings, everything)
- **Data Manager**: Parts CRUD, images, Excel import/export (no user management)

⏭️ **Real-time Updates (Req #9)**: Skipped - current 5-minute cache time is acceptable.

⏭️ **ACR Brand Handling (Req #4c)**: Skipped - data quality issue, not technical requirement.

✅ **Image URLs (Req #4a)**: Implement Mercado Libre-style workflow:

- 4 columns: Image_URL_Front, Image_URL_Back, Image_URL_Top, Image_URL_Other
- Upload dashboard → Get URL → Copy/paste to Excel → Import links images

✅ **Cross-References (Req #4b)**: Option C implementation:

- 11 explicit brand columns in Parts sheet (National_SKUs, ATV_SKUs, etc.)
- Semicolon-separated values (e.g., "ABC-123;DEF-456;GHI-789")
- **Sync to Excel**: Excel is source of truth - missing SKUs deleted
- **Empty column behavior**: Blank column deletes all cross-refs for that brand
- **Duplicate SKUs**: Allowed across brands (data quality issue)

✅ **360 Viewer (Req #4a)**: Status tracking workflow:

- User uploads via dashboard → Marks "Uploaded" in Excel → System confirms on next export

✅ **Floating Buttons (Req #8)**: Positioning issue on tablets - need to adjust offset to avoid search grid interference.

### Architecture Insights

**Already Implemented** (don't rebuild):

- ✅ SKU normalization (Migration 009) - 6-stage search algorithm
- ✅ Multi-tenancy infrastructure (tenant_id columns, tenants table) - ready but not active
- ✅ Atomic Excel imports with rollback (Migration 008)
- ✅ Image management (has_product_images auto-maintained, view_type categorization)
- ✅ Pull-based migration workflow (Remote TEST → Pull diff → Local)

**Needs Upgrade**:

- ⚠️ Authentication: MVP single-password (explicitly marked for upgrade in docs)
- ⚠️ RLS Policies: Wide-open `USING (true)` (explicit security warning in DATABASE.md)
- ⚠️ Search ranking: Works but could be relevance-scored
- ⚠️ Delete logic: Partial delete bug needs investigation

---

## PHASE 1: Authentication & User Management (3-4 days) ✅ COMPLETE

**Requirement #2**: Implement proper user authentication with role-based access control.

### Current State

- Single shared password in `ADMIN_PASSWORD` env variable
- Session storage authentication (browser-only, not persistent)
- No users table, no roles, no audit trail
- Wide-open RLS policies (`USING (true)`)
- No password change functionality
- Multi-tenancy infrastructure exists but unused

### Proposed Solution: Supabase Auth + 2-Role RBAC

#### Database Changes

**Create users table**:

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'data_manager')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Update RLS Policies** (all tables):

```sql
-- Example: Parts table
-- Replace: CREATE POLICY "Admin write" ON parts FOR ALL USING (true);
-- With:
CREATE POLICY "Admin write parts" ON parts
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('admin', 'data_manager')
      AND is_active = true
    )
  );
```

#### Role Permissions

| Feature                   | Admin | Data Manager |
| ------------------------- | ----- | ------------ |
| Parts CRUD                | ✅    | ✅           |
| Images upload/delete      | ✅    | ✅           |
| Excel import/export       | ✅    | ✅           |
| Cross-references CRUD     | ✅    | ✅           |
| Vehicle applications CRUD | ✅    | ✅           |
| User management           | ✅    | ❌           |
| Site settings             | ✅    | ❌           |
| System configuration      | ✅    | ❌           |

#### Authentication Flow

**New API Routes**:

- `POST /api/admin/auth/login` - Sign in with email/password
- `POST /api/admin/auth/logout` - Sign out
- `POST /api/admin/auth/change-password` - Update password
- `GET /api/admin/auth/session` - Check current user

**User Management**:

- New page: `src/app/admin/users/page.tsx`
- Features: List users, invite new user, deactivate user, change role
- Email-based invites with temporary passwords

#### Files to Create

- `supabase/migrations/YYYYMMDD_add_users_and_rbac.sql`
- `src/app/api/admin/auth/login/route.ts`
- `src/app/api/admin/auth/logout/route.ts`
- `src/app/api/admin/auth/change-password/route.ts`
- `src/app/api/admin/auth/session/route.ts`
- `src/app/admin/users/page.tsx`
- `src/components/admin/users/UserList.tsx`
- `src/components/admin/users/InviteUserModal.tsx`
- `src/middleware.ts`

#### Files to Modify

- `src/app/api/admin/auth/route.ts` → Delete (replaced by new routes)
- `src/components/shared/auth/AdminPasswordModal.tsx` (update for Supabase Auth)
- `src/components/shared/auth/withAdminAuth.tsx` (use Supabase session)
- All RLS policies in migrations

#### Testing

- [ ] Login/logout flow
- [ ] Password change with validation
- [ ] Admin can create/deactivate users
- [ ] Data Manager cannot access user management
- [ ] RLS policies enforce role restrictions
- [ ] All existing admin functionality works with new auth

#### Rollback Plan

Keep `ADMIN_PASSWORD` env variable as fallback for 1 week post-deployment

---

## PHASE 2: Database Optimization & Bug Fixes (2-3 days) ✅ COMPLETE

**Requirement #3**: Review and optimize database structure
**Requirement #5**: Fix export/delete issues

### A. Delete Bug Investigation & Fix ✅

**Problem**: Confirmed - partial delete leaves ID orphan in database.

**Symptoms**:

- Delete operation removes all part data (acr_sku, part_type, specifications, etc.)
- Part ID (UUID) remains in database as orphaned row
- Part still appears in public search but shows no data
- Re-export Excel shows part ID with empty data columns

**Root Cause Hypotheses**:

1. **Soft delete pattern** - Setting columns to NULL instead of DELETE
2. **Incomplete DELETE statement** - Clearing columns instead of removing row
3. **UPDATE instead of DELETE** - Code accidentally using UPDATE query

**Investigation Steps**:

1. Find delete logic: `src/app/api/admin/parts/[id]/route.ts` or mutation hook
2. Check if using `.delete()` or `.update()` Supabase method
3. Verify CASCADE deletes configured in database (per DATABASE.md)
4. Test with real part, trace SQL queries

**Expected Correct Behavior**:

```typescript
// src/app/api/admin/parts/[id]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("parts")
    .delete() // ← Should be .delete(), not .update()
    .eq("id", params.id);

  if (error) throw error;

  // Cascade deletes (automatic via ON DELETE CASCADE):
  // - cross_references (acr_part_id = id) ✅
  // - vehicle_applications (part_id = id) ✅
  // - part_images (part_id = id) ✅
  // - part_360_frames (part_id = id) ✅

  return NextResponse.json({ success: true });
}
```

**Testing**:

1. Create test part: ACR-TEST-001 with images, cross-refs, vehicle apps
2. Delete via admin UI
3. Query database: `SELECT * FROM parts WHERE acr_sku = 'ACR-TEST-001'` → 0 rows
4. Verify related records gone (no orphans)
5. Export Excel → verify ACR-TEST-001 not in export
6. Search for ACR-TEST-001 → no results
7. Test batch delete (10 parts) → verify all completely removed

### B. Database Performance Optimization

**Current Performance**: Sub-300ms search (meets target) ✅

**Proposed Optimizations**:

1. **Add missing indexes**:

```sql
-- Cross-references often filtered by brand
CREATE INDEX IF NOT EXISTS idx_cross_refs_brand
  ON cross_references(competitor_brand)
  WHERE competitor_brand IS NOT NULL;

-- Tenant-scoped queries (when multi-tenancy activates)
CREATE INDEX IF NOT EXISTS idx_parts_tenant
  ON parts(tenant_id)
  WHERE tenant_id IS NOT NULL;
```

2. **Update table statistics**:

```sql
ANALYZE parts;
ANALYZE vehicle_applications;
ANALYZE cross_references;
```

3. **Review connection pooling** in Supabase Dashboard

**Files to Create**:

- `supabase/migrations/YYYYMMDD_database_optimization.sql`

**Testing**:

- Benchmark search before/after
- Verify no performance regression

---

## PHASE 3: Excel Enhancements (3-4 days) ✅ COMPLETE

**Requirement #4**: Improve Excel integration

### A. Cross-References in Parts Sheet (1-2 days)

**Goal**: Merge cross-references into Parts sheet with explicit brand columns, eliminating separate Cross References sheet.

**New Excel Structure** (2 sheets):

- **Parts sheet**: ACR_SKU, part_type, ..., National_SKUs, ATV_SKUs, SYD_SKUs, etc.
- **Vehicle Applications sheet**: ACR_SKU, make, model, years... (unchanged)

**Supported Brands** (11 columns):
National, ATV, SYD, TMK, GROB, RACE, OEM, OEM_2, GMB, GSP, FAG

#### 1. Update Excel Export

**Modify** `src/services/export/ExcelExportService.ts`:

```typescript
// Group cross-references by brand, join with semicolons
const groupCrossRefsByBrand = (crossRefs: CrossReference[], brand: string) => {
  return crossRefs
    .filter((cr) => cr.competitor_brand === brand)
    .map((cr) => cr.competitor_sku)
    .join(";");
};

// Add brand columns to Parts sheet
row.National_SKUs =
  groupCrossRefsByBrand(part.cross_references, "National") || "";
row.ATV_SKUs = groupCrossRefsByBrand(part.cross_references, "ATV") || "";
row.SYD_SKUs = groupCrossRefsByBrand(part.cross_references, "SYD") || "";
row.TMK_SKUs = groupCrossRefsByBrand(part.cross_references, "TMK") || "";
row.GROB_SKUs = groupCrossRefsByBrand(part.cross_references, "GROB") || "";
row.RACE_SKUs = groupCrossRefsByBrand(part.cross_references, "RACE") || "";
row.OEM_SKUs = groupCrossRefsByBrand(part.cross_references, "OEM") || "";
row.OEM_2_SKUs = groupCrossRefsByBrand(part.cross_references, "OEM 2") || "";
row.GMB_SKUs = groupCrossRefsByBrand(part.cross_references, "GMB") || "";
row.GSP_SKUs = groupCrossRefsByBrand(part.cross_references, "GSP") || "";
row.FAG_SKUs = groupCrossRefsByBrand(part.cross_references, "FAG") || "";
```

#### 2. Update Excel Import

**Modify** `src/services/excel/import/ExcelImportService.ts`:

```typescript
// Brand mapping
const BRAND_COLUMN_MAP = {
  National_SKUs: "National",
  ATV_SKUs: "ATV",
  SYD_SKUs: "SYD",
  TMK_SKUs: "TMK",
  GROB_SKUs: "GROB",
  RACE_SKUs: "RACE",
  OEM_SKUs: "OEM",
  OEM_2_SKUs: "OEM 2",
  GMB_SKUs: "GMB",
  GSP_SKUs: "GSP",
  FAG_SKUs: "FAG",
} as const;

// Parse cross-references from Excel row
function parseCrossReferences(
  row: ExcelPartRow,
  partId: string
): CrossReference[] {
  const crossRefs: CrossReference[] = [];

  for (const [column, brand] of Object.entries(BRAND_COLUMN_MAP)) {
    const skusString = row[column as keyof ExcelPartRow];
    if (!skusString) continue;

    // Split by semicolon, trim whitespace, filter empty
    const skus = skusString
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sku of skus) {
      crossRefs.push({
        acr_part_id: partId,
        competitor_brand: brand,
        competitor_sku: sku,
      });
    }
  }

  return crossRefs;
}

// SYNC TO EXCEL (Excel is source of truth):
// 1. Delete ALL existing cross-references for this part
await supabase.from("cross_references").delete().eq("acr_part_id", partId);

// 2. Insert new cross-references from Excel
if (newCrossRefs.length > 0) {
  await supabase.from("cross_references").insert(newCrossRefs);
}
```

**Edge Cases Handled**:

- Single SKU: `"ABC-123"` → `['ABC-123']` ✅
- Multiple SKUs: `"ABC-123;DEF-456"` → `['ABC-123', 'DEF-456']` ✅
- Trailing semicolon: `"ABC-123;"` → `['ABC-123']` ✅
- Empty column: `""` → `[]` (deletes all cross-refs for that brand) ✅
- Spaces: `" ABC-123 ; DEF-456 "` → `['ABC-123', 'DEF-456']` ✅

#### 3. Validation Rules

```typescript
function validateCrossReferences(row: ExcelPartRow, rowNumber: number) {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [column, brand] of Object.entries(BRAND_COLUMN_MAP)) {
    const skusString = row[column as keyof ExcelPartRow];
    if (!skusString) continue;

    const skus = skusString
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sku of skus) {
      // Length validation
      if (sku.length > 50) {
        errors.push({
          code: "E15",
          message: `${brand} SKU "${sku}" exceeds 50 characters`,
        });
      }

      // Format validation (alphanumeric + hyphens)
      if (!/^[A-Za-z0-9\-]+$/.test(sku)) {
        warnings.push({
          code: "W13",
          message: `${brand} SKU "${sku}" contains special characters`,
        });
      }
    }

    // Duplicate check within same brand
    const uniqueSkus = new Set(skus);
    if (uniqueSkus.size < skus.length) {
      warnings.push({
        code: "W14",
        message: `${brand}_SKUs contains duplicate SKUs`,
      });
    }
  }

  // ALLOW duplicate SKUs across brands (data quality issue, not technical)
  return { errors, warnings };
}
```

#### 4. Remove Cross References Sheet Logic

**Delete/comment out**:

- `src/services/export/ExcelExportService.ts` - Cross References sheet export
- `src/services/excel/import/ExcelImportService.ts` - Cross References sheet import
- `src/services/excel/shared/constants.ts` - `CROSS_REF_SHEET_COLUMNS`
- `src/services/excel/validation/ValidationEngine.ts` - Cross References sheet validation

#### Files to Modify

- `src/services/excel/shared/constants.ts` - Add 11 brand columns, remove Cross Ref sheet
- `src/services/export/ExcelExportService.ts` - Export cross-refs in brand columns
- `src/services/excel/import/ExcelImportService.ts` - Parse brand columns, sync to DB
- `src/services/excel/validation/ValidationEngine.ts` - Validate brand columns
- `supabase/migrations/20251028000000_add_atomic_import_transaction.sql` - Update for 2-sheet structure

#### Testing

- [ ] Export part with cross-refs → Verify SKUs semicolon-separated in brand columns
- [ ] Import `"National_SKUs: ABC;DEF;GHI"` → Verify 3 National cross-refs created
- [ ] Import empty `"National_SKUs"` → Verify all National cross-refs deleted
- [ ] Import duplicate SKUs in column → Verify warning but allows
- [ ] Import same SKU in multiple brands → Verify allowed (no error)
- [ ] Roundtrip test: export → modify → import → export → verify match

### B. Image URL Management (Mercado Libre Workflow) (2-3 days)

**Goal**: Replicate Mercado Libre's Excel + Upload Dashboard workflow.

#### 1. Update Excel Export (Add 4 Image Columns)

```typescript
// Get images by view_type
const frontImage = part.images.find((img) => img.view_type === "front");
const backImage = part.images.find((img) => img.view_type === "back");
const topImage = part.images.find((img) => img.view_type === "top");
const otherImage = part.images.find((img) => img.view_type === "other");

row.Image_URL_Front = frontImage?.image_url || "";
row.Image_URL_Back = backImage?.image_url || "";
row.Image_URL_Top = topImage?.image_url || "";
row.Image_URL_Other = otherImage?.image_url || "";

// 360 Viewer status
row["360_Viewer_Status"] = part.has_360_viewer ? "Confirmed" : "";
```

#### 2. Create Image Upload Dashboard

**New page**: `src/app/admin/upload-images/page.tsx`

**Features**:

- Drag-and-drop or file picker for images
- Upload to Supabase Storage (`acr-part-images` bucket)
- Display uploaded image URL immediately
- "Copy URL" button for easy copy/paste
- Supports 4 view types: front, back, top, other
- Batch upload support

**UI Mock**:

```
┌────────────────────────────────────────┐
│ Upload Images Dashboard                │
├────────────────────────────────────────┤
│ Drag images here or click to browse   │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │  Drop zone (400x300px)           │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Uploaded Images:                       │
│ ┌─────────────────────────────────┐   │
│ │ front-view.jpg                   │   │
│ │ https://...acr-part-images/...   │   │
│ │ [Copy URL] [Delete]              │   │
│ └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

#### 3. Update Excel Import (Process Image URLs)

```typescript
const imageUrls = {
  front: row.Image_URL_Front,
  back: row.Image_URL_Back,
  top: row.Image_URL_Top,
  other: row.Image_URL_Other,
};

// Validate URLs
for (const [viewType, url] of Object.entries(imageUrls)) {
  if (url && !url.startsWith("https://")) {
    errors.push({
      code: "E14",
      message: `Invalid ${viewType} image URL format`,
    });
  }
}

// Import logic (merge mode):
// 1. For each view_type, check if part already has image with that view_type
// 2. If exists, update image_url
// 3. If not exists, create new part_images row
// 4. Set display_order based on view_type (front=0, top=1, back=2, other=3)
```

#### 4. 360 Viewer Status Handling

**Export**: Show "Confirmed" if `has_360_viewer = true`
**Import**: If user marks "Uploaded", validate 360 frames exist (warn if missing)

#### 5. Add Links to Excel Template

Modify export to include clickable hyperlinks in column headers:

- `Image_URL_Front` → Link to `/admin/upload-images`
- `360_Viewer_Status` → Link to `/admin/360-viewer-upload`

#### Files to Create

- `src/app/admin/upload-images/page.tsx`
- `src/app/admin/upload-images/ImageUploadDashboard.tsx`
- `src/app/api/admin/upload-image/route.ts`

#### Files to Modify

- `src/services/excel/shared/constants.ts` - Add 5 new columns
- `src/services/export/ExcelExportService.ts` - Export image URLs by view_type
- `src/services/excel/import/ExcelImportService.ts` - Parse and import image URLs
- `src/services/excel/validation/ValidationEngine.ts` - Validate URL format

#### Testing

- [ ] Export Excel with images → Verify URLs in correct columns
- [ ] Upload image in dashboard → Copy URL → Paste in Excel → Import → Verify linked
- [ ] Import invalid URLs → Verify validation errors
- [ ] 360 viewer "Uploaded" → "Confirmed" workflow
- [ ] Roundtrip test: export → edit URLs → import → export

---

## PHASE 4: UI/UX & Search Improvements (2-3 days) 🔄 IN PROGRESS

### A. Search Enhancements (1-2 days)

**Current State**:

- 6-stage search algorithm (Migration 009) ✅
- TanStack Query with 5-minute cache ✅
- No autocomplete/suggestions

**Proposed Improvements**:

1. **Add search suggestions (autocomplete)**:

```typescript
// src/components/features/public/search/SearchSuggestions.tsx
// Show as user types (300ms debounce):
// - Recent searches (localStorage)
// - Popular parts (track in database - optional)
// - Matching SKUs (live query)
```

2. **Improve search result ranking**:

```typescript
// src/app/api/public/parts/route.ts
// Enhanced relevance scoring:
// - Exact match: score 100
// - Starts with: score 80
// - Contains: score 60
// - Fuzzy: score based on similarity (60-100)
// Boost: score × 1.2 if has_product_images
```

**Files to Create**:

- `src/components/features/public/search/SearchSuggestions.tsx`

**Files to Modify**:

- `src/app/api/public/parts/route.ts` (relevance scoring)
- `src/components/features/public/search/PublicSearchFilters.tsx` (add autocomplete)

### B. Parts & Cross-References Merge (0.5 day)

**Goal**: Verify cross-references visible in unified part view.

**Current State**:

- Public: Parts list on homepage, cross-refs in detail page ✅
- Cross-refs shown in bottom-right card (`PublicPartDetails.tsx:314`) ✅

**Action**: Verify current implementation satisfactory, or add cross-ref count to search results.

### C. Images & SKUs Verification (0.5 day)

**Current State**: Already working correctly! ✅

- `part_images.part_id` foreign key with CASCADE ✅
- `has_product_images` flag auto-maintained ✅
- Image gallery shows in detail view ✅

**Action**: Verify satisfactory, or clarify what's missing.

### D. Mobile/Tablet Optimization (0.5 day)

**Problem**: Floating contact buttons interfere with search results grid on tablets.

**Current Behavior**:

```tsx
<div className="fixed bottom-4 right-4 z-50">
  {" "}
  {/* Positioned from viewport */}
  {/* Buttons */}
</div>
```

**Solution**: Adjust right offset on tablets:

```tsx
<div
  className={cn(
    "fixed z-50 flex flex-col gap-2",
    "hidden md:flex", // Hidden on mobile ✅
    "bottom-4",
    "right-4 md:right-2 lg:right-4" // Less offset on tablets
  )}
>
  <button className="h-12 w-12 rounded-full bg-acr-red shadow-lg">
    {/* Phone icon */}
  </button>
  <button className="h-12 w-12 rounded-full bg-green-500 shadow-lg">
    {/* WhatsApp icon */}
  </button>
</div>
```

**iPad Testing Checklist**:

- [ ] All admin tables work in 768px-1024px range
- [ ] Touch targets minimum 48px
- [ ] Drag-and-drop image reordering works on touch
- [ ] Modals don't exceed viewport
- [ ] Search filters usable in landscape/portrait
- [ ] Excel import UI accessible on tablet

---

## Implementation Timeline

**Estimated Duration**: 10-14 working days

### Week 1

- **Days 1-3**: Phase 1 (Authentication & User Management)
- **Days 4-5**: Phase 2 (Delete bug fix + Database optimization)

### Week 2

- **Days 1-2**: Phase 3A (Cross-references in Parts sheet)
- **Days 3-4**: Phase 3B (Image URL management + dashboard)
- **Day 5**: Phase 4 (Search, UI, mobile testing)

### Week 3 (Buffer)

- **Days 1-2**: Integration testing, bug fixes
- **Days 3-5**: Documentation, deployment preparation

---

## Critical Dependencies

1. **Phase 1 (Auth) must complete first** - Impacts admin UI in all other phases
2. **Phase 2A (Delete bug fix) before Phase 3** - Ensures data integrity for Excel export testing
3. **Pull-based workflow required**: All database changes go to Remote TEST first, then pull schema diff
4. **Image upload dashboard (Phase 3B) unlocks Excel workflow** - Users need dashboard before using image URL columns

---

## Success Criteria

### Phase 1 (Auth) Success:

- [ ] Users can log in with email/password
- [ ] Admin and Data Manager roles work correctly
- [ ] RLS policies enforce permissions
- [ ] Password change functionality works
- [ ] Admin can create/deactivate users
- [ ] All existing admin features work with new auth

### Phase 2 (Database) Success:

- [ ] Delete bug fixed - deleted parts don't appear in export
- [ ] No orphaned records after delete
- [ ] Search maintains <300ms response time
- [ ] New indexes improve query performance

### Phase 3 (Excel) Success:

- [ ] Cross-refs export in brand columns, semicolon-separated
- [ ] Import correctly parses and syncs cross-refs
- [ ] Empty column deletes all cross-refs for that brand
- [ ] Image URLs work (upload dashboard → Excel → import)
- [ ] 360 viewer status tracking works
- [ ] Export/import roundtrip preserves all data

### Phase 4 (UI/Search) Success:

- [ ] Search suggestions appear within 200ms
- [ ] Relevance scoring improves result quality
- [ ] All admin screens work on iPad
- [ ] Touch targets minimum 48px
- [ ] Floating buttons don't obscure content

---

## Risk Assessment

### High Risk:

1. **Authentication migration** - Could break admin access during deployment
   - **Mitigation**: Keep env variable fallback, gradual rollout
   - **Rollback**: Revert to old auth if issues occur

2. **Delete bug** - Root cause unknown until investigation
   - **Mitigation**: Thorough testing on staging first
   - **Testing**: Create test parts, verify complete deletion

### Medium Risk:

1. **Database migrations in production** - Schema changes could lock tables
   - **Mitigation**: Run during low-traffic hours, test on staging

2. **RLS policy changes** - Could accidentally block legitimate access
   - **Testing**: Comprehensive permission testing for both roles

### Low Risk:

1. Search improvements (additive, doesn't break existing)
2. Mobile optimizations (CSS-only changes)
3. Cross-ref column format (Excel parsing is straightforward)

---

## Rollback Procedures

### Phase 1 (Auth):

```bash
git revert <commit-hash>
npm run supabase:reset  # Remove users table
# Revert to ADMIN_PASSWORD env variable
```

### Phase 2 (Database):

```sql
DROP INDEX IF EXISTS idx_cross_refs_brand;
-- Revert to previous search function version
```

### Phase 3 (Excel):

```bash
git revert <commit-hash>
# Old Excel format still supported (backward compatible)
```

### Phase 4 (Search):

```bash
git revert <commit-hash>
# Falls back to previous search behavior
```

---

## Post-Implementation Tasks

### Documentation Updates:

- [ ] Update `docs/PLANNING.md` with new auth architecture
- [ ] Update `docs/database/DATABASE.md` with new indexes
- [ ] Create `docs/excel/IMPORT_GUIDE.md` for image URLs + cross-refs
- [ ] Update `README.md` with user management instructions

### Monitoring Setup:

- [ ] Set up Sentry error tracking (if not already)
- [ ] Add Supabase usage alerts (API calls, storage, database size)
- [ ] Monitor search query performance (avg response time)

### User Training:

- [ ] Create video tutorial for Excel import with images
- [ ] Document user management procedures (invite, deactivate)
- [ ] Train parts counter staff on new unified part view
- [ ] Create mobile optimization checklist for future features

---

## Key Files Reference

### Critical Files for Implementation:

**Authentication (Phase 1)**:

- `supabase/migrations/YYYYMMDD_add_users_and_rbac.sql` - Core auth migration
- `src/middleware.ts` - Route protection
- `src/app/admin/users/page.tsx` - User management UI
- All RLS policy updates across migrations

**Database (Phase 2)**:

- `supabase/migrations/YYYYMMDD_database_optimization.sql`
- `src/app/api/admin/parts/[id]/route.ts` - Delete bug fix

**Excel (Phase 3)**:

- `src/services/excel/shared/constants.ts` - Brand columns + image columns
- `src/services/excel/validation/ValidationEngine.ts` - Cross-ref validation
- `src/services/export/ExcelExportService.ts` - Export brand columns + image URLs
- `src/services/excel/import/ExcelImportService.ts` - Parse brand columns + image URLs
- `src/app/admin/upload-images/page.tsx` - Image upload dashboard

**UI/Search (Phase 4)**:

- `src/app/api/public/parts/route.ts` - Relevance scoring
- `src/components/features/public/search/SearchSuggestions.tsx` - Autocomplete
- `src/components/shared/FloatingContactButtons.tsx` - Tablet positioning fix

---

**End of Implementation Plan**

For questions or clarifications, refer to:

- `docs/PLANNING.md` - Technical architecture
- `docs/database/DATABASE.md` - Database reference
- `docs/TASKS.md` - Development roadmap
