# Bulk Image Upload

> **Feature Status**: Complete
> **Last Updated**: December 2024

## Overview

The Bulk Image Upload feature allows administrators to upload entire folders of supplier photos and automatically map them to ACR parts via SKU detection. This significantly speeds up the process of adding product images and 360° viewer frames to the catalog.

### Key Capabilities

- **Folder-based upload**: Drag and drop multiple folders containing images
- **Automatic SKU extraction**: Detects SKU numbers from filenames (e.g., `CTK512016_fro.jpg` → `512016`)
- **Smart classification**: Distinguishes between product images and 360° frames
- **View type detection**: Identifies front, top, bottom, other, and generic views
- **Fuzzy SKU matching**: Uses similarity scoring to match extracted SKUs to database parts
- **Concurrent uploads**: Processes multiple parts in parallel for faster uploads
- **Auto-compression**: Product images >5MB are automatically compressed with Sharp
- **360° frame optimization**: Resizes and compresses frames with Sharp for optimal viewer performance
- **Large batch support**: Handles 500-1000+ files with client-side batching (200 files/batch)
- **Replace-by-viewType**: Only replaces images matching incoming view types, preserving other angles

## Architecture

### File Structure

```
src/
├── app/
│   ├── admin/bulk-image-upload/
│   │   └── page.tsx                    # Route page
│   └── api/admin/bulk-image-upload/
│       ├── analyze/route.ts            # SKU matching API
│       └── execute/route.ts            # Upload execution API
├── components/features/admin/bulk-image-upload/
│   ├── BulkImageUploadPage.tsx         # Main page component
│   ├── BulkUploadModal.tsx             # Upload wizard modal
│   ├── PartsImageTable.tsx             # Parts listing with image stats
│   ├── stages/
│   │   ├── StageSelectFiles.tsx        # File selection with dropzone
│   │   ├── StageReview.tsx             # Review matched parts
│   │   └── StageProgress.tsx           # Upload progress display
│   └── utils/
│       ├── file-classifier.ts          # File type classification
│       └── sku-extractor.ts            # SKU extraction logic
└── lib/bulk-upload/
    ├── types.ts                        # TypeScript interfaces
    └── patterns.config.ts              # Configurable patterns
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  StageSelect    │────▶│   StageReview    │────▶│  StageProgress  │
│  Files          │     │                  │     │                 │
│                 │     │  POST /analyze   │     │  POST /execute  │
│  - Dropzone     │     │  - SKU matching  │     │  - Concurrent   │
│  - Classify     │     │  - Show warnings │     │    uploads      │
│                 │     │  - User confirm  │     │  - Sharp resize │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## User Flow

### Stage 1: Select Files

Users drag and drop folders or select files via file picker:

1. Files are immediately classified client-side
2. Summary shows counts by type (product images, 360° frames, unknown, skipped)
3. Unique SKUs are extracted and counted

### Stage 2: Review Matches

The analyze API matches files to database parts:

1. SKUs extracted from filenames are fuzzy-matched to parts
2. Large batches are processed in chunks of 200 files to avoid "URI too long" errors
3. Matched parts show:
   - Current image count
   - Images to be added
   - 360° frame status
   - Any warnings (e.g., "Will replace existing front view")
4. Unmatched files are displayed for reference
5. User confirms before proceeding

### Stage 3: Upload Progress

Files are uploaded with visual progress:

1. Parts are processed 3 at a time (concurrent uploads)
2. Progress bar shows completion percentage
3. Per-part status updates display current SKU
4. Final summary shows success/failure counts

## API Reference

### POST /api/admin/bulk-image-upload/analyze

Analyzes classified files and matches them to database parts.

**Request Body:**

```typescript
{
  classifiedFiles: {
    filename: string;
    type: "product" | "360-frame" | "skip" | "unknown";
    extractedSku: string | null;
    frameNumber?: number;
    viewType?: "front" | "top" | "bottom" | "other" | "generic";
  }[]
}
```

**Response:**

```typescript
{
  matchedParts: {
    partId: string;
    acrSku: string;
    partType: string;
    currentImageCount: number;
    current360FrameCount: number;
    productImages: ClassifiedFile[];
    frames360: ClassifiedFile[];
    isNew: boolean;
    warnings: string[];
  }[];
  unmatchedFiles: ClassifiedFile[];
  skippedFiles: string[];
  summary: {
    totalFiles: number;
    matchedFiles: number;
    partsToUpdate: number;
    partsNew: number;
  };
}
```

### POST /api/admin/bulk-image-upload/execute

Executes the bulk upload for matched parts.

**Request:** `multipart/form-data`

- `instructions`: JSON string with upload instructions
- `file_*`: Actual image files

**Response:**

```typescript
{
  success: boolean;
  results: {
    partId: string;
    acrSku: string;
    success: boolean;
    imagesUploaded: number;
    frames360Uploaded: number;
    error?: string;
  }[];
  summary: {
    totalParts: number;
    successfulParts: number;
    failedParts: number;
    totalImagesUploaded: number;
    total360FramesUploaded: number;
  };
}
```

## File Classification

### SKU Extraction

SKUs are extracted from filenames using multiple strategies:

```typescript
// Strategy 1: Find 5-8 digit numeric sequence
"CTK512016_fro.jpg" → "512016"
"ACR2303016_01_001.jpg" → "2303016"

// Strategy 2: Strip letter prefix from first segment
"BRAND123456_view.jpg" → "123456"

// Strategy 3: Any 4+ digit sequence (fallback)
"img1234.jpg" → "1234"
```

### 360° Frame Detection

Frames are detected by filename patterns:

| Pattern                  | Example                | Captures                 |
| ------------------------ | ---------------------- | ------------------------ |
| `{SKU}_01_{FRAME}.jpg`   | `CTK512016_01_001.jpg` | SKU: CTK512016, Frame: 1 |
| `{SKU}_360_{FRAME}.jpg`  | `512016_360_015.jpg`   | SKU: 512016, Frame: 15   |
| `{SKU}_frame{FRAME}.jpg` | `512016_frame24.jpg`   | SKU: 512016, Frame: 24   |

### Product View Detection

View types are detected by keywords in filename:

| View Type | Keywords                                       |
| --------- | ---------------------------------------------- |
| front     | fro, front, frente, f, main, principal, hero   |
| top       | top, arriba, t, above, superior                |
| bottom    | bot, bottom, abajo, b, below, inferior         |
| other     | oth, side, lateral, angle, left, right         |
| generic   | (no keyword detected - fallback for valid SKU) |

**Display Order Priority:** front (0) → top (1) → other (2) → bottom (3) → generic (4)

Files without view keywords but with extractable SKUs are classified as `generic` and displayed last.

## Image Processing

### Product Image Optimization

All product images are processed with Sharp before upload:

```typescript
sharp(inputBuffer)
  .resize(1600, 1600, {
    fit: "inside",
    withoutEnlargement: true, // Don't upscale small images
  })
  .jpeg({
    quality: 85,
    progressive: true,
    mozjpeg: true,
  });
```

**Benefits:**

- Handles files up to 10MB input size
- Compresses to well under 5MB output
- Progressive JPEGs for faster perceived loading
- Maintains aspect ratio

### 360° Frame Optimization

All 360° frames are processed with Sharp before upload:

```typescript
sharp(inputBuffer)
  .resize(1200, 1200, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .jpeg({
    quality: 85,
    progressive: true,
    mozjpeg: true,
  });
```

**Benefits:**

- Consistent 1200x1200 dimensions for smooth rotation
- ~60-70% file size reduction
- Progressive JPEGs for faster perceived loading

## Configuration

All patterns and limits are configurable in `src/lib/bulk-upload/patterns.config.ts`:

```typescript
export const VALIDATION = {
  maxProductImages: 10, // Max product images per part
  maxProductImageSize: 5 * 1024 * 1024, // 5MB output limit
  min360Frames: 12, // Minimum for valid 360° viewer
  recommended360Frames: 24, // Recommended frame count
  max360Frames: 48, // Maximum frames
  max360FrameSize: 10 * 1024 * 1024, // 10MB input limit
  skuMatchThreshold: 0.85, // Fuzzy match similarity threshold
  analyzeBatchSize: 200, // Files per analyze batch
};

export const VIEW_DISPLAY_ORDER = {
  front: 0,
  top: 1,
  other: 2,
  bottom: 3,
  generic: 4, // Display last (no specific angle)
};
```

### Adding New Supplier Formats

To support a new supplier's naming convention:

1. **For 360° frames**: Add regex to `FILE_PATTERNS.frame360` array
2. **For view keywords**: Add to appropriate array in `FILE_PATTERNS.productViews`

Example adding a new format:

```typescript
frame360: [
  /^(.+)_01_(\d{2,3})\.(jpg|jpeg|png|webp)$/i, // Existing
  /^(.+)_rot(\d{2,3})\.(jpg|jpeg|png|webp)$/i, // NEW: {SKU}_rot{FRAME}.jpg
];
```

## Upload Behavior

### Replace-by-ViewType Mode (Product Images)

When uploading product images to a part that already has images:

- **Only images matching incoming viewTypes are deleted**
- Images with different viewTypes are preserved
- New images are uploaded with their respective viewTypes
- Display order is recalculated after upload (front → top → other → bottom → generic)

**Example:**

1. Upload NFC folder (all images get `viewType: "generic"`)
2. Upload 360 folder (images get `viewType: "front"`, `"top"`, `"other"`, `"bottom"`)
3. Result: Part has 5 images - front, top, other, bottom from 360 + generic from NFC

### Replace Mode (360° Frames)

When uploading 360° frames to a part that already has a viewer:

- All existing frames are deleted
- New frames are uploaded with sequential numbering (frame-000.jpg, frame-001.jpg, etc.)
- Part's `has_360_viewer` and `viewer_360_frame_count` are updated

### Display Order Recalculation

After uploading images, the `recalculateDisplayOrder()` function ensures proper ordering:

1. Fetches all images for the part
2. Sorts by viewType priority (front=0, top=1, other=2, bottom=3, generic=4)
3. Within same viewType, preserves creation order
4. Updates `display_order` field for each image

This prevents display_order collisions when uploading multiple batches.

## Concurrent Upload Architecture

To handle large uploads without memory issues, files are uploaded per-part with concurrency limits:

```typescript
const UPLOAD_CONCURRENCY = 3;

// Process in batches
for (let i = 0; i < parts.length; i += UPLOAD_CONCURRENCY) {
  const batch = parts.slice(i, i + UPLOAD_CONCURRENCY);
  await Promise.all(batch.map((part) => uploadPart(part)));
}
```

**Why 3?**

- Balances speed vs. server memory pressure
- Stays well under Vercel's 4.5MB request body limit per request
- Prevents browser memory exhaustion on large uploads

### Large Batch Handling

For batches with 200+ files:

1. Client splits files into batches of 200 for the analyze API
2. Results are merged on the client
3. Upload stage processes parts sequentially with concurrency of 3

## Error Handling

### Common Errors

| Error                            | Cause                            | Resolution                               |
| -------------------------------- | -------------------------------- | ---------------------------------------- |
| "No parts matched"               | SKUs not found in database       | Verify SKUs exist, check filename format |
| "Array buffer allocation failed" | Too many files in single request | Fixed by concurrent upload architecture  |
| "Minimum 12 frames required"     | Too few 360° frames              | Upload at least 12 frames per part       |
| "File too large"                 | Input file >10MB                 | Reduce file size before upload           |

### React StrictMode Guard

The upload component includes a guard against React 18 StrictMode double-mounting:

```typescript
const hasStartedRef = useRef(false);

useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;
  startUpload();
}, []);
```

This prevents duplicate uploads during development.

## Database Schema

The `part_images` table includes a `view_type` column for categorization:

```sql
-- part_images table
view_type TEXT  -- 'front', 'top', 'bottom', 'other', 'generic', or NULL
```

This enables replace-by-viewType logic and proper display ordering.

## Testing

### Test Data Setup

Test folders are provided in `public/ACR*/` with sample images:

- 4 product images per SKU (\_fro, \_top, \_bot, \_oth)
- 24 360° frames per SKU (\_01_001 through \_01_024)

### Cleanup Script

A utility script clears test data:

```bash
node scripts/clear-test-images.mjs
```

This deletes:

- Product images from `part_images` table and storage
- 360° frames from `part_360_frames` table and storage
- Resets `has_360_viewer` and `viewer_360_frame_count` on parts

## Performance

### Benchmarks

| Metric                               | Value                 |
| ------------------------------------ | --------------------- |
| Classification (client-side)         | ~1ms per file         |
| SKU matching (server)                | ~100ms per unique SKU |
| 360° frame optimization              | ~200-400ms per frame  |
| Product image compression            | ~100-300ms per image  |
| Product image upload                 | ~100-200ms per image  |
| Full upload (6 parts, 28 files each) | ~45-60 seconds        |
| Large batch (800+ files)             | ~3-5 minutes          |

### Optimization Notes

- SKU matching uses database RPC with similarity scoring
- Sharp processing runs on Node.js (not Edge runtime)
- Files are streamed to Supabase Storage, not buffered in memory
- Client-side batching prevents "URI too long" errors

## UI Components

### Public Part Details Gallery

The thumbnail strip uses horizontal scrolling with 72×72px thumbnails:

- Supports up to 10 images without stretching the card
- `overflow-x-auto` enables horizontal scroll on overflow
- Display order follows viewType priority (front first, generic last)

### Admin Part Images Manager

- Grid layout with drag-and-drop reordering
- Maximum 10 images per part
- Upload button disabled when at capacity

## Future Enhancements

- [ ] Background upload queue for very large batches
- [ ] Upload resume on failure
- [ ] Drag-and-drop reordering in review stage
- [ ] Direct-to-storage uploads (bypass API route)
- [ ] Image preview thumbnails in review stage
- [ ] Undo/rollback for recent uploads
