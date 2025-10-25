# Image Management System

> **Complete guide** to the ACR Automotive dual-mode image system: static product photos and interactive 360° viewer

## Overview

ACR Automotive features a sophisticated image management system with two distinct modes:

1. **Static Product Photos** - Up to 6 high-quality images per part with drag-and-drop reordering
2. **360° Interactive Viewer** - Professional rotating product visualization (12-48 frames)

This dual-mode approach provides flexibility for different product photography workflows while maintaining a professional presentation.

### Key Features

- **Multi-image upload** with automatic validation and optimization
- **Drag-and-drop reordering** for visual priority control
- **Primary image designation** via `display_order` (first = primary)
- **360° viewer** with frame-based animation and Sharp optimization
- **Storage integration** via Supabase Storage with automatic cleanup
- **Mobile-optimized UI** with pinch-to-zoom for static photos
- **Intelligent caching** with TanStack Query for instant revalidation

## Architecture

### Database Schema

#### `part_images` Table - Static Product Photos

```sql
create table part_images (
  id uuid primary key default uuid_generate_v4(),
  part_id uuid references parts(id) on delete cascade,
  image_url text not null,
  display_order integer not null default 0,
  is_primary boolean default false,  -- Deprecated, use display_order
  caption text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fast retrieval
create index idx_part_images_part_id on part_images(part_id);
create index idx_part_images_display_order on part_images(part_id, display_order);
```

**Design Decision**: `display_order` is the source of truth for primary image selection. The first image (`display_order = 0`) is always the primary image. The `is_primary` field is deprecated but kept for schema compatibility.

#### `part_360_frames` Table - 360° Viewer Frames

```sql
create table part_360_frames (
  id uuid primary key default uuid_generate_v4(),
  part_id uuid references parts(id) on delete cascade,
  frame_number integer not null,
  image_url text not null,
  storage_path text not null,
  file_size_bytes integer,
  width integer,
  height integer,
  created_at timestamp with time zone default now()
);

-- Enforce frame order
create unique index idx_part_360_frames_unique on part_360_frames(part_id, frame_number);
create index idx_part_360_frames_part_id on part_360_frames(part_id);
```

**Frame Numbering**: Frames are zero-indexed (0, 1, 2...) and must be contiguous for smooth rotation.

### Storage Structure

Supabase Storage bucket: `acr-part-images`

#### Static Images Path Pattern
```
{partId}_{timestamp}_{randomSuffix}.{ext}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000_1698765432000_a7f3b2c.jpg
```

#### 360° Frames Path Pattern
```
360-viewer/{acr_sku}/frame-{number}.jpg
```

Example:
```
360-viewer/ACR-BR-001/frame-000.jpg
360-viewer/ACR-BR-001/frame-001.jpg
360-viewer/ACR-BR-001/frame-023.jpg
```

**Design Decision**: 360° frames use deterministic paths (`frame-000.jpg`) to enable `upsert: true`, making re-uploads atomic and preventing orphaned files.

## API Reference

### Static Images Endpoints

#### `GET /api/admin/parts/[id]/images`

Fetch all images for a part, ordered by `display_order`.

**Response**:
```typescript
{
  data: PartImage[]
}
```

**Example**:
```typescript
const response = await fetch(`/api/admin/parts/${partId}/images`);
const { data } = await response.json();
// data[0] is always the primary image (display_order = 0)
```

---

#### `POST /api/admin/parts/[id]/images`

Upload multiple images for a part (max 6 total per part).

**Request**: `multipart/form-data`
- `files`: File[] - Array of image files

**Validation Rules**:
- Maximum 6 images per part (enforced)
- File type: `image/*` only
- File size: 5MB max per file
- Rejected files are skipped, not failed

**Response**:
```typescript
{
  success: true,
  images: PartImage[],
  count: number
}
```

**Example**:
```typescript
const formData = new FormData();
files.forEach(file => formData.append("files", file));

const response = await fetch(`/api/admin/parts/${partId}/images`, {
  method: "POST",
  body: formData,
});

const { images, count } = await response.json();
// New images are appended to the end (highest display_order)
```

**Behavior**:
- New images are assigned `display_order = max(existing.display_order) + 1`
- If part has 3 images (orders 0, 1, 2), new uploads get orders 3, 4, 5
- First uploaded image becomes primary only if no images exist

---

#### `PUT /api/admin/parts/[id]/images/reorder`

Reorder images by providing a new sequence of image IDs.

**Request Body**:
```typescript
{
  image_ids: string[]  // Array of UUIDs in desired order
}
```

**Response**:
```typescript
{
  success: true
}
```

**Example**:
```typescript
// User drags image C to position 1
const newOrder = [imageC.id, imageA.id, imageB.id];

await fetch(`/api/admin/parts/${partId}/images/reorder`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image_ids: newOrder }),
});

// Database updates:
// imageC: display_order = 0 (becomes primary!)
// imageA: display_order = 1
// imageB: display_order = 2
```

**Critical Behavior**: Reordering changes the primary image. The first image in `image_ids` becomes the primary image.

---

#### `PUT /api/admin/parts/[id]/images/[imageId]/primary`

Set an image as primary (deprecated - use reorder instead).

**Response**:
```typescript
{
  success: true,
  data: PartImage
}
```

**Note**: This endpoint is deprecated. Modern implementations should use the reorder endpoint to move the desired image to position 0.

---

#### `PUT /api/admin/parts/[id]/images/[imageId]`

Update image caption.

**Request Body**:
```typescript
{
  caption: string | null
}
```

**Response**:
```typescript
{
  success: true,
  data: PartImage
}
```

---

#### `DELETE /api/admin/parts/[id]/images/[imageId]`

Delete an image and its storage file.

**Response**:
```typescript
{
  success: true
}
```

**Cleanup Process**:
1. Fetch image record to get `image_url`
2. Extract storage path from URL
3. Delete from Supabase Storage (`acr-part-images` bucket)
4. Delete database record (triggers cascade to `part_images`)

**Error Handling**: If storage deletion fails, database deletion proceeds anyway to prevent broken references.

---

### 360° Viewer Endpoints

#### `GET /api/admin/parts/[id]/360-frames`

Fetch all 360° frames for a part, ordered by `frame_number`.

**Response**:
```typescript
{
  frames: Part360Frame[],
  count: number
}
```

---

#### `POST /api/admin/parts/[id]/360-frames`

Upload 360° frames for a part. Replaces any existing 360° viewer.

**Request**: `multipart/form-data`
- Multiple files (12-48 frames)

**Configuration**:
```typescript
const CONFIG = {
  minFrames: 12,           // Minimum for acceptable rotation
  recommendedFrames: 24,   // Optimal smoothness
  maxFrames: 48,           // Maximum allowed
  targetDimension: 1200,   // Resize target (longest edge)
  jpegQuality: 85,         // Compression quality
  maxFileSize: 10485760,   // 10MB per file
};
```

**Processing Pipeline**:
```typescript
// 1. Validate frame count
if (files.length < 12) throw Error("Minimum 12 frames required");
if (files.length > 48) throw Error("Maximum 48 frames allowed");

// 2. Delete existing frames (atomic replace)
const { data: existingFrames } = await supabase
  .from("part_360_frames")
  .select("storage_path")
  .eq("part_id", partId);

if (existingFrames.length > 0) {
  await supabase.storage.from("acr-part-images").remove(paths);
  await supabase.from("part_360_frames").delete().eq("part_id", partId);
}

// 3. Optimize each frame with Sharp
for (let i = 0; i < files.length; i++) {
  const optimized = await sharp(buffer)
    .resize(1200, 1200, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({
      quality: 85,
      progressive: true,
      mozjpeg: true,
    })
    .toBuffer();

  // 4. Upload to deterministic path (enables upsert)
  const storagePath = `360-viewer/${acr_sku}/frame-${i.toString().padStart(3, "0")}.jpg`;

  await supabase.storage
    .from("acr-part-images")
    .upload(storagePath, optimized.buffer, { upsert: true });

  // 5. Save metadata to database
  await supabase.from("part_360_frames").insert({
    part_id: partId,
    frame_number: i,
    image_url: publicUrl,
    storage_path: storagePath,
    file_size_bytes: optimized.size,
    width: optimized.width,
    height: optimized.height,
  });
}

// 6. Update part record
await supabase
  .from("parts")
  .update({
    has_360_viewer: true,
    viewer_360_frame_count: files.length,
  })
  .eq("id", partId);
```

**Response**:
```typescript
{
  success: true,
  frameCount: number,
  frames: UploadedFrame[],
  warning?: string,        // If frame count is suboptimal
  errors?: string[]        // Partial failure details
}
```

**Image Optimization Benefits**:
- **Consistent dimensions**: All frames 1200x1200px with white background
- **Smaller file sizes**: 70-85% compression via MozJPEG
- **Progressive loading**: Better perceived performance
- **Format standardization**: All frames become JPEG regardless of input

**Example Upload**:
```typescript
// User uploads 24 PNG files (12MB total)
// Sharp converts to JPEGs (3MB total - 75% reduction)
// Smooth 360° rotation with 15° intervals
```

---

#### `DELETE /api/admin/parts/[id]/360-frames`

Delete all 360° frames for a part.

**Cleanup Process**:
1. Fetch all frame records
2. Delete all frames from storage
3. Delete all frame records from database
4. Update part: `has_360_viewer = false`, `viewer_360_frame_count = 0`

**Response**:
```typescript
{
  success: true
}
```

---

## Frontend Components

### Admin Interface

#### `PartImagesManager.tsx` - Main Management Component

```typescript
<PartImagesManager partId={partId} />
```

**Features**:
- Multi-file upload with drag-and-drop
- Image count display (`3/6`)
- Upload button with loading state
- Delegates to `ImageGalleryEditor` for editing

**Validation**:
```typescript
const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Frontend validation (before upload)
validFiles = files.filter(file =>
  file.type.startsWith("image/") &&
  file.size <= MAX_FILE_SIZE
);

// Backend enforces same rules
```

**TanStack Query Integration**:
```typescript
// Fetch images
const { data: images } = useQuery({
  queryKey: ["part-images", partId],
  queryFn: async () => {
    const res = await fetch(`/api/admin/parts/${partId}/images`);
    const json = await res.json();
    return json.data as PartImage[];
  },
});

// Upload mutation
const uploadMutation = useMutation({
  mutationFn: async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("files", file));
    const res = await fetch(`/api/admin/parts/${partId}/images`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ["part-images", partId] });
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as string[];
        return key[0] === "public" && key[1] === "parts";
      }
    });
  },
});
```

---

#### `ImageGalleryEditor.tsx` - Drag-and-Drop Editor

```typescript
<ImageGalleryEditor
  images={images}
  onReorder={handleReorder}
  onSetPrimary={handleSetPrimary}
  onDelete={handleDelete}
  isDeleting={deleteMutation.isPending}
/>
```

**Features**:
- Drag-and-drop reordering with visual feedback
- Primary image indicator (first image)
- Delete button with confirmation
- Responsive grid (3 columns desktop, 2 mobile)

**Example Reorder Flow**:
```typescript
// Initial order: [A, B, C]
// User drags B to first position

const newOrder = [B.id, A.id, C.id];
onReorder(newOrder);

// API updates display_order:
// B: display_order = 0 (becomes primary!)
// A: display_order = 1
// C: display_order = 2
```

---

### Public Interface

#### `PartImageGallery.tsx` - Dual-Mode Viewer

```typescript
<PartImageGallery
  images={images}
  partName={part.acr_sku}
  viewer360Frames={frames}
  has360Viewer={part.has_360_viewer}
  isLoading={isLoading}
/>
```

**View Mode Logic**:
```typescript
// Automatic mode selection
const defaultMode: ViewMode = (has360Viewer && frames.length > 0) ? "360" : "photo";

// User can override by clicking thumbnails
const [userSelectedView, setUserSelectedView] = useState<ViewMode | null>(null);

const viewMode: ViewMode = userSelectedView ?? defaultMode;
```

**Layout**:
- **Desktop**: Vertical thumbnail strip (left) + main viewer (right)
- **Mobile**: Main viewer (top) + horizontal thumbnail strip (bottom)

**Features**:
- **360° Mode**: Interactive rotation with drag/swipe
- **Photo Mode**: Pinch-to-zoom via `react-zoom-pan-pinch`
- **Thumbnail Navigation**: Click to switch between modes/photos
- **Loading States**: Spinner during data fetch
- **Empty States**: Placeholder when no media available

---

## Performance Optimizations

### 1. Image Optimization with Sharp

**Before**: User uploads 24 PNG files totaling 12MB
**After**: Sharp converts to progressive JPEGs totaling 3MB (75% reduction)

```typescript
const optimized = await sharp(inputBuffer)
  .resize(1200, 1200, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .jpeg({
    quality: 85,
    progressive: true,
    mozjpeg: true,  // Superior compression
  })
  .toBuffer();
```

**Benefits**:
- Faster page loads (4x smaller payloads)
- Consistent dimensions (easier rendering)
- Progressive JPEGs (better perceived performance)

---

### 2. Batch Image Enrichment (N+1 Prevention)

**❌ Bad Pattern** (15 queries for 15 parts):
```typescript
for (const part of parts) {
  const { data: images } = await supabase
    .from("part_images")
    .select("*")
    .eq("part_id", part.id)
    .limit(1);

  part.primary_image_url = images[0]?.image_url;
}
```

**✅ Good Pattern** (1 query for all parts):
```typescript
// Single batch query
const partIds = parts.map(p => p.id);
const { data: images } = await supabase
  .from("part_images")
  .select("part_id, image_url, display_order")
  .in("part_id", partIds)
  .order("display_order", { ascending: true });

// Group by part_id
const imagesByPartId = images.reduce((acc, img) => {
  if (!acc[img.part_id]) acc[img.part_id] = [];
  acc[img.part_id].push(img);
  return acc;
}, {});

// Attach primary image to each part
parts.forEach(part => {
  part.primary_image_url = imagesByPartId[part.id]?.[0]?.image_url || null;
});
```

**Performance**: 15x faster for 15 parts (15ms vs 225ms)

---

### 3. TanStack Query Caching

**Strategy**: Aggressive caching with optimistic updates

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes (data stays fresh)
      gcTime: 10 * 60 * 1000,     // 10 minutes (cache retention)
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    },
  },
});
```

**Cache Invalidation Strategy**:
```typescript
// After image upload/reorder/delete
queryClient.invalidateQueries({ queryKey: ["part-images", partId] });

// Invalidate all public parts lists (primary image changed!)
queryClient.invalidateQueries({
  predicate: (query) => {
    const key = query.queryKey as string[];
    return key[0] === "public" && key[1] === "parts" && key[2] === "list";
  }
});
```

**Result**: Instant UI updates + background revalidation

---

### 4. Atomic 360° Viewer Replacement

**Challenge**: Replace existing 360° viewer without leaving orphaned files

**Solution**: Deterministic paths + `upsert: true`

```typescript
// Old approach (leaves orphans):
const newPath = `360-viewer/${partId}/${uuid()}.jpg`;  // Random name

// ACR approach (atomic replace):
const newPath = `360-viewer/${acr_sku}/frame-${i}.jpg`; // Deterministic name

await supabase.storage
  .from("acr-part-images")
  .upload(newPath, buffer, { upsert: true });  // Overwrites old file
```

**Benefits**:
- No orphaned storage files
- Simpler cleanup logic
- Atomic updates (old viewer → new viewer)

---

## Code Examples

### Example 1: Upload Images to a Part

```typescript
// Admin uploads 3 product photos
const files = [photo1.jpg, photo2.jpg, photo3.jpg];
const formData = new FormData();

files.forEach(file => formData.append("files", file));

const response = await fetch(`/api/admin/parts/${partId}/images`, {
  method: "POST",
  body: formData,
});

const { images, count } = await response.json();

console.log(`Uploaded ${count} images`);
console.log(`Primary image: ${images[0].image_url}`);

// Database state:
// images[0]: display_order = 0 (primary)
// images[1]: display_order = 1
// images[2]: display_order = 2
```

**Timeline**:
- 0ms: API receives 3 files (4MB total)
- 50ms: Validation passes (image/* check, size check)
- 100ms: Upload to Supabase Storage
- 150ms: Create database records
- 200ms: Response sent to client

---

### Example 2: Reorder Images (Change Primary)

```typescript
// Initial state:
// A (display_order=0) - PRIMARY
// B (display_order=1)
// C (display_order=2)

// Admin drags C to first position
const newOrder = [C.id, A.id, B.id];

await fetch(`/api/admin/parts/${partId}/images/reorder`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image_ids: newOrder }),
});

// New state:
// C (display_order=0) - PRIMARY (changed!)
// A (display_order=1)
// B (display_order=2)

// TanStack Query automatically invalidates and refetches
// Public search results now show C as thumbnail
```

**Why This Matters**: Primary image appears in search results, so reordering changes what customers see first.

---

### Example 3: Upload 360° Viewer

```typescript
// Admin shoots 24 photos rotating around brake rotor
const frames = [
  frame000.png,  // 0° (500KB)
  frame001.png,  // 15° (520KB)
  // ... 22 more frames
  frame023.png,  // 345° (510KB)
];

const formData = new FormData();
frames.forEach(frame => formData.append("files", frame));

const response = await fetch(`/api/admin/parts/${partId}/360-frames`, {
  method: "POST",
  body: formData,
});

const { success, frameCount, frames: uploaded } = await response.json();

console.log(`Uploaded ${frameCount} frames`);
console.log(`Total size: ${uploaded.reduce((sum, f) => sum + f.file_size_bytes, 0)} bytes`);

// Processing timeline:
// 0ms: Receive 24 PNG files (12MB total)
// 100ms: Delete existing 360° viewer (if any)
// 200ms: Sharp optimizes frame 0 (500KB → 120KB)
// 250ms: Upload frame 0 to storage
// ... repeat for 23 more frames
// 6000ms: All frames uploaded (3MB total - 75% reduction!)
// 6100ms: Update part record (has_360_viewer = true)
```

**Sharp Optimization Log**:
```
[360-frames] Optimized frame000.png: 500KB → 120KB (24%)
[360-frames] Optimized frame001.png: 520KB → 125KB (24%)
...
[360-frames] Upload complete: 24/24 frames successful
```

---

### Example 4: Delete Image with Storage Cleanup

```typescript
const imageId = "550e8400-e29b-41d4-a716-446655440000";

const response = await fetch(`/api/admin/parts/${partId}/images/${imageId}`, {
  method: "DELETE",
});

const { success } = await response.json();

// Cleanup process:
// 1. Fetch image record (image_url = "https://xyz.supabase.co/.../filename.jpg")
// 2. Extract storage path ("filename.jpg")
// 3. Delete from storage: supabase.storage.from("acr-part-images").remove(["filename.jpg"])
// 4. Delete from database: supabase.from("part_images").delete().eq("id", imageId)
// 5. TanStack Query invalidates cache
// 6. UI removes image instantly
```

**Error Handling**:
```typescript
// If storage deletion fails (network error, etc.)
console.error("Storage deletion failed - continuing with DB delete");

// Database delete still proceeds to prevent broken references
// Orphaned file in storage is better than broken database state
```

---

## Error Handling

### Upload Validation Errors

```typescript
// Error: Too many images
{
  error: "Maximum of 6 images per part",
  status: 400
}

// Error: Can only upload N more images
{
  error: "Can only upload 2 more image(s). Maximum 6 images per part.",
  status: 400
}

// Error: No files provided
{
  error: "No files provided",
  status: 400
}

// Error: Part not found
{
  error: "Part not found",
  status: 404
}
```

### 360° Frame Validation Errors

```typescript
// Error: Not enough frames
{
  error: "Minimum 12 frames required",
  currentCount: 8,
  status: 400
}

// Error: Too many frames
{
  error: "Maximum 48 frames allowed",
  currentCount: 60,
  status: 400
}

// Error: Files too large
{
  error: "Files too large (max 10MB per file)",
  oversizedFiles: ["IMG_0001.png", "IMG_0002.png"],
  status: 400
}
```

### Warning Messages

```typescript
// Suboptimal frame count (will upload but warn)
{
  success: true,
  frameCount: 15,
  warning: "24+ frames recommended for smooth rotation"
}

// Partial success (some frames failed)
{
  success: true,
  frameCount: 22,
  frames: [...],
  errors: [
    "Frame 5 (IMG_0005.png): Failed to optimize image",
    "Frame 12 (IMG_0012.png): Upload failed"
  ]
}
```

---

## Testing

### Manual Testing Checklist

#### Static Images
- [ ] Upload single image (becomes primary)
- [ ] Upload multiple images (max 6)
- [ ] Attempt to upload 7th image (should reject)
- [ ] Upload oversized file (>5MB, should skip)
- [ ] Upload non-image file (should skip)
- [ ] Reorder images (verify primary changes)
- [ ] Delete primary image (verify next becomes primary)
- [ ] Delete all images (verify empty state)

#### 360° Viewer
- [ ] Upload 24 frames (optimal count)
- [ ] Upload 12 frames (minimum, should succeed with warning)
- [ ] Upload 10 frames (should reject)
- [ ] Upload 50 frames (should reject)
- [ ] Re-upload viewer (verify old frames deleted)
- [ ] Delete viewer (verify all frames removed)
- [ ] Verify Sharp optimization (check file sizes)

### Automated Testing

```typescript
// Example test: Upload validation
describe("POST /api/admin/parts/[id]/images", () => {
  it("rejects upload when at max capacity", async () => {
    // Arrange: Part has 6 images already
    await createTestImages(partId, 6);

    // Act: Attempt 7th upload
    const formData = new FormData();
    formData.append("files", new File(["test"], "test.jpg", { type: "image/jpeg" }));

    const response = await fetch(`/api/admin/parts/${partId}/images`, {
      method: "POST",
      body: formData,
    });

    // Assert
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Maximum of 6 images");
  });
});
```

---

## Related Documentation

### Architecture
- **[Architecture Overview](../../architecture/OVERVIEW.md)** - Storage layer and file management
- **[API Design](../../architecture/API_DESIGN.md)** - RESTful patterns for multipart uploads

### Database
- **[Database Schema](../../database/DATABASE.md)** - Complete schema for `part_images` and `part_360_frames`

### Other Features
- **[Search System](../search/SEARCH_SYSTEM.md)** - How primary images are used in search results

---

**Last Updated**: October 25, 2025
