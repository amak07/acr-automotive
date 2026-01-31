# Upload Images Dashboard Design

**Date**: 2026-01-31
**Status**: Ready for Implementation
**Parent Plan**: [Phase 3: Excel Enhancements](../../plans/Phase3_Excel_Enhancements.md)

---

## Overview

Replace the existing bulk image upload feature with a simplified "Upload Images Dashboard" that supports the Mercado Libre-style Excel workflow for image management.

### Purpose

Enable users to:

1. Upload images **without associating them to a part** (standalone)
2. Get the public URL immediately
3. Copy/paste the URL into Excel (Image_URL_Front, Image_URL_Back, etc. columns)
4. Import Excel to link images to parts

### Key Difference from Old Bulk Upload

| Old Bulk Upload                 | New Upload Dashboard        |
| ------------------------------- | --------------------------- |
| Requires selecting a part first | No part selection needed    |
| Complex multi-step wizard       | Simple drag-drop → copy URL |
| SKU pattern matching            | URL-based workflow          |
| Tight coupling to parts         | Standalone image hosting    |

---

## Scope

### Creating

| File                                       | Purpose                  |
| ------------------------------------------ | ------------------------ |
| `src/app/admin/upload-images/page.tsx`     | New dashboard page       |
| `src/app/api/admin/upload-images/route.ts` | Upload API (returns URL) |

### Removing (Bulk Image Upload Feature)

**Pages & Components:**

- `src/app/admin/bulk-image-upload/page.tsx`
- `src/components/features/admin/bulk-image-upload/` (entire directory)
  - `BulkImageUploadPage.tsx`
  - `BulkUploadModal.tsx`
  - `Bulk360UploadModal.tsx`
  - `PartsImageTable.tsx`
  - `index.ts`
  - `stages/StageSelectFiles.tsx`
  - `stages/StageProgress.tsx`
  - `stages/StageReview.tsx`
  - `utils/sku-extractor.ts`
  - `utils/file-classifier.ts`

**API Routes:**

- `src/app/api/admin/bulk-image-upload/analyze/route.ts`
- `src/app/api/admin/bulk-image-upload/execute/route.ts`

**Libraries:**

- `src/lib/bulk-upload/patterns.config.ts`
- `src/lib/bulk-upload/types.ts`

**Scripts & Tests:**

- `scripts/test-bulk-upload-verification.ts`
- `scripts/test/test-bulk-operations.ts` (if image-related)

**Documentation:**

- `docs/features/data-management/BULK_IMAGE_UPLOAD.md`
- Update `docs/admin-guide/managing-images.mdx`
- Update `docs/API_REFERENCE.md`

**Other Cleanup:**

- Remove nav link from `QuickActions.tsx`
- Remove related translation keys from `translations.ts`
- Remove query keys from `queryKeys.ts`

### Keeping

- `/api/admin/bulk/parts|vehicles|cross-references` (Excel operations)
- Part detail page image management
- Supabase Storage bucket (`acr-part-images`)
- `scripts/optimize-images.ts` (general utility)

---

## Implementation Steps

### Step 1: Remove Old Bulk Image Upload Feature

1. Delete all files listed in the removal scope
2. Remove navigation links from `QuickActions.tsx`
3. Remove translation keys from `translations.ts`
4. Remove query keys from `queryKeys.ts`
5. Verify no broken imports with TypeScript build

### Step 2: Create New Upload API

Create `POST /api/admin/upload-images`:

- Accept multipart form data with image file
- Upload to Supabase Storage `acr-part-images` bucket
- Generate unique filename (UUID + original extension)
- Return public URL
- No part association (standalone upload)

### Step 3: Create Upload Dashboard Page

Create `/admin/upload-images` page with:

- Instructional header explaining Excel workflow
- Drag-drop zone for image upload
- Uploaded images list with thumbnails
- Copy URL button (one-click with toast)
- Delete button (remove from storage)
- Session persistence (localStorage)

### Step 4: Update Navigation

- Add link to upload-images in admin quick actions
- Update documentation references

### Step 5: Verify & Test

- Upload image → get URL → copy works
- URL is valid and publicly accessible
- Excel import with pasted URL links image to part correctly
- Old bulk upload pages return 404

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin > Upload Images                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Upload Images for Excel Import                                 │
│  Upload images here, copy the URL, then paste into your Excel   │
│  file's image columns (Image_URL_Front, Image_URL_Back, etc.)   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │      📁 Drag and drop images here, or click to browse     │  │
│  │              Supports: JPG, PNG, WebP (max 5MB)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Uploaded Images (n)                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [thumb]  filename.jpg                                     │  │
│  │          https://xxx.supabase.co/storage/v1/...           │  │
│  │          [📋 Copy URL]                        [🗑️ Delete] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Storage Bucket

Using existing `acr-part-images` bucket in Supabase Storage.

### File Naming

`{uuid}.{extension}` - ensures uniqueness, preserves format.

### URL Format

`https://{project}.supabase.co/storage/v1/object/public/acr-part-images/{filename}`

### Authentication

Page requires admin auth (via `withAdminAuth` HOC).

---

## Success Criteria

- [ ] Old bulk upload feature completely removed (no broken links/imports)
- [ ] New upload dashboard accessible at `/admin/upload-images`
- [ ] Can upload image and get public URL
- [ ] Copy URL button works with clipboard
- [ ] Delete removes image from storage
- [ ] Excel import correctly links images via pasted URLs
- [ ] Documentation updated

---

## Related Documents

- [Phase 3: Excel Enhancements](../../plans/Phase3_Excel_Enhancements.md)
- [Implementation Plan](../../plans/IMPLEMENTATION_PLAN.md) (Phase 3B)
- [Database Reference](../database/DATABASE.md)
