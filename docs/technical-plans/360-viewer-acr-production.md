# 360° Product Spin Viewer - ACR Production Implementation

**Project**: ACR Automotive - Interactive 360° Part Viewer
**Status**: Planning Phase
**Estimated Time**: 32-40 hours (4 weeks)
**Test Data**: CTK512016 (24 frames, 800×800px)

---

## 📋 Executive Summary

Add professional 360° interactive spin viewer to ACR part catalog, allowing customers to rotate and inspect parts from all angles. Integrates seamlessly with existing image gallery system using tabbed interface.

**Key Features:**
- ✅ Drag-to-rotate interaction (desktop + mobile)
- ✅ Flexible frame count (12-48 frames with smart validation)
- ✅ Server-side image optimization (sharp library)
- ✅ Tabbed admin interface (Product Photos | 360° Viewer)
- ✅ Dual-mode public display (toggle between 360° and photo gallery)
- ✅ Full i18n support (English + Spanish)

---

## 🎯 Technical Architecture

### Database Schema

**Migration:** `lib/supabase/migrations/004_add_360_viewer.sql`

```sql
-- Add 360 viewer flags to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS has_360_viewer BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS viewer_360_frame_count INTEGER DEFAULT 0;

-- Create 360 frames table
CREATE TABLE IF NOT EXISTS part_360_frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    width INTEGER,           -- Image dimensions for validation
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_part_frame UNIQUE(part_id, frame_number),
    CONSTRAINT valid_frame_number CHECK(frame_number >= 0),
    CONSTRAINT positive_dimensions CHECK(width > 0 AND height > 0)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_part_360_frames_part_id
    ON part_360_frames(part_id);
CREATE INDEX IF NOT EXISTS idx_part_360_frames_part_frame
    ON part_360_frames(part_id, frame_number);

-- Row Level Security (matches existing part_images pattern)
ALTER TABLE part_360_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read 360 frames" ON part_360_frames
    FOR SELECT USING (true);

CREATE POLICY "Admin write 360 frames" ON part_360_frames
    FOR ALL USING (true);
```

**Storage Structure:**
```
acr-part-images/
├── parts/
│   ├── {acr_sku}-1.jpg          # Regular product images
│   └── ...
└── 360-viewer/
    └── {acr_sku}/
        ├── frame-000.jpg        # 360° frames (organized by SKU)
        ├── frame-001.jpg
        └── ...
```

---

## 🔧 Frame Count Validation Rules

Industry-standard validation with smart warnings:

```typescript
const FRAME_COUNT_RULES = {
  minimum: 12,      // ❌ Block uploads below this
  recommended: 24,  // ⚠️ Warn if below this (industry standard)
  optimal: 36,      // ✅ No warning (premium experience)
  maximum: 48       // ⚠️ Warn about file size above this
};
```

**Validation Messages:**
- `< 12 frames`: ❌ "Minimum 12 frames required for smooth rotation"
- `12-23 frames`: ⚠️ "24+ frames recommended for professional quality"
- `24-48 frames`: ✅ No warning
- `> 48 frames`: ⚠️ "Consider using 48 frames or fewer for optimal loading"

**Rotation Angles:**
| Frame Count | Degrees per Frame | Smoothness | Use Case |
|-------------|-------------------|------------|----------|
| 12 | 30° | Choppy | ❌ Not recommended |
| 18 | 20° | Acceptable | ⚠️ Budget option |
| 24 | 15° | Smooth | ✅ **Industry standard** |
| 36 | 10° | Very smooth | ✅ Premium parts |
| 48 | 7.5° | Ultra smooth | ⚠️ Diminishing returns |

---

## 🖼️ Image Optimization Strategy

**Tool:** Sharp library (server-side processing)

**Why Sharp?**
- ✅ Fastest Node.js image processing library
- ✅ Works in Vercel serverless environment
- ✅ Professional quality control (mozjpeg compression)
- ✅ Handles any input size → standardized output
- ✅ No Supabase Pro plan required

**Processing Pipeline:**

```typescript
async function optimizeFrame(file: File): Promise<ProcessedImage> {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const processed = await sharp(inputBuffer)
    .resize(1200, 1200, {
      fit: 'contain',              // Preserve aspect ratio
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .jpeg({
      quality: 85,                 // Good balance (85% quality)
      progressive: true,           // Progressive loading
      mozjpeg: true               // Better compression algorithm
    })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
    size: processed.info.size
  };
}
```

**Performance Benefits:**

| Scenario | Before Optimization | After Optimization | Savings |
|----------|---------------------|--------------------| --------|
| CTK images (800×800) | 3.5MB (24×144KB) | 2.4MB (24×100KB) | 31% |
| High-res uploads (4000×4000) | 72MB (24×3MB) | 2.4MB (24×100KB) | **97%** |
| Load time (4G mobile) | 18 seconds | 1.2 seconds | **15× faster** |

**Standard Output:**
- Dimensions: 1200×1200px (consistent across all parts)
- Format: Progressive JPEG
- Quality: 85% (visually lossless)
- Average size: ~100KB per frame
- Total payload: ~2.4MB for 24 frames

---

## 📁 Implementation Phases

### **Phase 1: Database & API Foundation** (Week 1: 8-10 hours)

**Tasks:**
1. Run migration `004_add_360_viewer.sql` in Supabase
2. Install sharp library: `npm install sharp`
3. Create API route: `app/api/admin/parts/[id]/360-frames/route.ts`
   - POST: Upload and optimize frames
   - GET: Fetch frames for part
   - DELETE: Remove 360° viewer
4. Implement frame validation logic
5. Test with CTK512016 images (24 frames)

**API Endpoints:**
```typescript
POST   /api/admin/parts/[id]/360-frames    // Upload frames
GET    /api/admin/parts/[id]/360-frames    // Fetch frames
DELETE /api/admin/parts/[id]/360-frames    // Delete viewer
```

**Validation Logic:**
```typescript
// Validate frame count
if (files.length < 12) {
  return { error: "Minimum 12 frames required" };
}

// Warn about suboptimal count
const warning = files.length < 24
  ? "24+ frames recommended for smooth rotation"
  : files.length > 48
  ? "Consider using 48 frames or fewer for optimal loading"
  : null;

// Process each frame with sharp
for (let i = 0; i < files.length; i++) {
  const optimized = await optimizeFrame(files[i]);
  // Upload to Supabase storage...
}
```

**Success Criteria:**
- ✅ API successfully processes CTK512016 images
- ✅ All 24 frames optimized to ~100KB each
- ✅ Stored in `acr-part-images/360-viewer/{sku}/frame-XXX.jpg`
- ✅ Database records created with dimensions

---

### **Phase 2: Admin Upload Interface** (Week 2: 10-12 hours)

**Tasks:**
1. Create `PartMediaManager.tsx` (tabbed container)
2. Create `Upload360Viewer.tsx` (upload UI)
3. Implement drag & drop file upload
4. Add upload progress tracking
5. Build preview mode (test spin before publishing)
6. Add i18n keys (English + Spanish)

**Component Architecture:**

```
PartMediaManager (Tabbed Container)
├── Tab 1: Product Photos
│   └── PartImagesManager (existing - no changes)
└── Tab 2: 360° Viewer
    └── Upload360Viewer (new)
        ├── Empty State (no frames uploaded)
        ├── Upload Zone (drag & drop)
        ├── Progress Tracker (12/24 uploaded)
        ├── Preview Mode (interactive test)
        └── Active State (viewer configured)
```

**Upload360Viewer Features:**
- Drag & drop multiple files
- Client-side validation (file type, size)
- Upload progress: "Uploading 12/24 frames (50%)"
- Preview mode: Interactive spin before publishing
- Warning badges for suboptimal frame counts
- Delete confirmation dialog

**Integration:**
```typescript
// components/admin/parts/PartFormContainer.tsx

// Replace this:
<PartImagesManager partId={partData.id} />

// With this:
<PartMediaManager partId={partData.id} />
```

**Success Criteria:**
- ✅ Tabs render correctly (Product Photos | 360° Viewer)
- ✅ Upload accepts 12-48 image files
- ✅ Progress shown during upload
- ✅ Warning displayed for < 24 frames
- ✅ Preview mode works (can rotate before saving)

---

### **Phase 3: Public Interactive Viewer** (Week 3: 8-10 hours)

**Tasks:**
1. Create `Part360Viewer.tsx` component
2. Implement drag-to-rotate interaction
3. Add touch gesture support (mobile/tablet)
4. Build lazy loading optimization
5. Add fullscreen mode
6. Implement auto-rotate on hover (optional)
7. Add error handling & fallback

**Component Features:**

**Core Interaction:**
- Mouse drag to rotate (desktop)
- Touch swipe to rotate (mobile)
- Keyboard navigation (arrow keys for accessibility)
- Scroll wheel support (optional)

**Performance Optimizations:**
```typescript
// 1. Lazy Loading Strategy
const [loadedFrames, setLoadedFrames] = useState<Set<number>>(new Set([0, 1, 2]));

useEffect(() => {
  // Preload first 3 frames immediately (instant display)
  // Load remaining frames in background
  frameUrls.slice(3).forEach((url, idx) => {
    const img = new Image();
    img.onload = () => setLoadedFrames(prev => new Set(prev).add(idx + 3));
    img.src = url;
  });
}, [frameUrls]);

// 2. Adjacent Frame Preloading
const preloadAdjacentFrames = (currentFrame: number) => {
  // Preload frames on either side of current frame
  const prev = (currentFrame - 1 + frameCount) % frameCount;
  const next = (currentFrame + 1) % frameCount;
  // Ensures smooth rotation with no loading gaps
};

// 3. Auto-rotate on Hover (optional UX enhancement)
useEffect(() => {
  if (!isAutoRotating || isDragging) return;
  const interval = setInterval(() => {
    setCurrentFrame(prev => (prev + 1) % frameUrls.length);
  }, 150); // 1 full rotation every 3.6 seconds (24 frames × 150ms)
  return () => clearInterval(interval);
}, [isAutoRotating, isDragging]);
```

**UI Elements:**
- Frame counter overlay: "12 / 24"
- Instruction hint: "← Drag to rotate →"
- Fullscreen button (top-right)
- Loading spinner (while frames preload)

**Success Criteria:**
- ✅ Smooth drag-to-rotate on desktop
- ✅ Touch gestures work on mobile/tablet
- ✅ Fullscreen mode functional
- ✅ Lazy loading reduces initial load time
- ✅ Graceful fallback to photo gallery on error

---

### **Phase 4: Public Integration** (Week 4: 6-8 hours)

**Tasks:**
1. Integrate viewer into public part details page
2. Build dual-mode toggle (360° vs Photo Gallery)
3. Add mode preference persistence (session storage)
4. Mobile/tablet UX testing
5. Performance testing (load times)
6. Complete i18n coverage
7. Final polish & documentation

**🚨 IMPORTANT NOTE - Phase 5 Discussion Required:**
> **TODO:** When reaching this phase, discuss with user the exact UX flow for public part details page integration. Current plan shows dual-mode toggle (360° Viewer | Photo Gallery buttons), but user wants to review and potentially refine this approach before implementation.
>
> **Questions to address:**
> - Default view priority (360° first vs. photos first?)
> - Toggle button placement (above viewer vs. sidebar?)
> - Mobile UX considerations (single view vs. swipeable modes?)
> - Fallback behavior when only one mode available
>
> **Do not proceed with Phase 4 implementation until this discussion is complete.**

**Proposed Integration (Subject to Discussion):**

```typescript
// app/parts/[id]/page.tsx

const [viewMode, setViewMode] = useState<'360' | 'gallery'>(
  part.has_360_viewer ? '360' : 'gallery'
);

return (
  <div className="space-y-4">
    {/* Mode Toggle - Only show if both exist */}
    {part.has_360_viewer && part.part_images.length > 0 && (
      <div className="flex gap-2 justify-center">
        <AcrButton
          variant={viewMode === '360' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('360')}
        >
          <RotateCw className="w-4 h-4 mr-2" />
          {t("partDetails.view360")}
        </AcrButton>
        <AcrButton
          variant={viewMode === 'gallery' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('gallery')}
        >
          <Image className="w-4 h-4 mr-2" />
          {t("partDetails.viewPhotos")} ({part.part_images.length})
        </AcrButton>
      </div>
    )}

    {/* Content Display */}
    {viewMode === '360' && part.has_360_viewer ? (
      <Part360Viewer
        frames={part.part_360_frames}
        partName={part.acr_sku}
        fallbackImage={part.part_images[0]?.image_url}
      />
    ) : (
      <PartImageGallery images={part.part_images} />
    )}
  </div>
);
```

**Display Logic:**
1. If part has 360° viewer only → Show viewer
2. If part has photos only → Show gallery
3. If part has both → Show toggle buttons + default to 360°
4. User selection persists in session storage

**Success Criteria:**
- ✅ Viewer displays correctly on all screen sizes
- ✅ Toggle buttons work smoothly
- ✅ Load time < 2 seconds on 4G mobile
- ✅ All text translated (English + Spanish)
- ✅ Keyboard accessible (WCAG 2.1 AA)

---

## 🗂️ File Structure

**New Files (8 total):**
```
src/
├── lib/supabase/migrations/
│   └── 004_add_360_viewer.sql                    # Database schema
├── app/api/admin/parts/[id]/
│   └── 360-frames/
│       └── route.ts                               # API with sharp optimization
├── components/admin/parts/
│   ├── PartMediaManager.tsx                       # Tabbed container (Photos | 360°)
│   └── Upload360Viewer.tsx                        # Admin upload interface
└── components/public/parts/
    └── Part360Viewer.tsx                          # Public interactive viewer
```

**Modified Files (2 total):**
```
src/
├── components/admin/parts/
│   └── PartFormContainer.tsx                      # Replace PartImagesManager → PartMediaManager
└── app/parts/[id]/
    └── page.tsx                                   # Add viewer with mode toggle
```

---

## 🌐 Internationalization

**Translation Keys to Add (~35 keys):**

```typescript
// lib/i18n/translations.ts

export const translations = {
  en: {
    partDetails: {
      media: {
        photosTab: "Product Photos",
        "360Tab": "360° Viewer",
      },
      viewer360: {
        // Admin - Upload Interface
        uploadTitle: "360° Interactive Viewer",
        uploadDescription: "Upload 12-48 images showing horizontal rotation",
        uploadButton: "Upload Frames",
        uploading: "Uploading...",
        dragToUpload: "Drag & drop images here, or click to browse",

        // Validation Messages
        minFramesError: "Minimum {{count}} frames required",
        recommendedWarning: "{{count}}+ frames recommended for smooth rotation",
        maxFramesWarning: "{{count}} frames or fewer recommended for optimal loading",
        invalidFileType: "Only image files (JPG, PNG) are allowed",
        fileSizeError: "Image too large (max 10MB per file)",

        // Upload Progress
        uploadProgress: "Uploading {{current}}/{{total}} frames ({{percent}}%)",
        uploadSuccess: "Successfully uploaded {{count}} frames",
        uploadFailed: "Upload failed. Please try again.",

        // Preview Mode
        previewTitle: "Preview 360° Viewer",
        previewDescription: "Test the rotation before publishing",
        publishButton: "Publish Viewer",
        cancelButton: "Cancel",

        // Active State
        activeTitle: "360° viewer active",
        activeDescription: "{{count}} frames configured",
        replaceButton: "Replace Frames",
        deleteButton: "Delete Viewer",
        deleteConfirm: "Are you sure you want to delete the 360° viewer?",
        deleteSuccess: "360° viewer deleted",
        deleteFailed: "Failed to delete viewer",

        // Public Viewer
        loading: "Loading 360° viewer...",
        dragToRotate: "← Drag to rotate →",
        frameCounter: "{{current}} / {{total}}",
        fullscreen: "Fullscreen",
        exitFullscreen: "Exit fullscreen",

        // Mode Toggle
        view360: "360° Viewer",
        viewPhotos: "Product Photos",
      }
    }
  },
  es: {
    partDetails: {
      media: {
        photosTab: "Fotos del Producto",
        "360Tab": "Visor 360°",
      },
      viewer360: {
        // Admin - Upload Interface
        uploadTitle: "Visor Interactivo 360°",
        uploadDescription: "Sube 12-48 imágenes mostrando rotación horizontal",
        uploadButton: "Subir Fotogramas",
        uploading: "Subiendo...",
        dragToUpload: "Arrastra y suelta imágenes aquí, o haz clic para buscar",

        // Validation Messages
        minFramesError: "Se requieren mínimo {{count}} fotogramas",
        recommendedWarning: "Se recomiendan {{count}}+ fotogramas para rotación suave",
        maxFramesWarning: "Se recomiendan {{count}} fotogramas o menos para carga óptima",
        invalidFileType: "Solo se permiten archivos de imagen (JPG, PNG)",
        fileSizeError: "Imagen demasiado grande (máx. 10MB por archivo)",

        // Upload Progress
        uploadProgress: "Subiendo {{current}}/{{total}} fotogramas ({{percent}}%)",
        uploadSuccess: "Se subieron exitosamente {{count}} fotogramas",
        uploadFailed: "La carga falló. Por favor intenta de nuevo.",

        // Preview Mode
        previewTitle: "Vista Previa del Visor 360°",
        previewDescription: "Prueba la rotación antes de publicar",
        publishButton: "Publicar Visor",
        cancelButton: "Cancelar",

        // Active State
        activeTitle: "Visor 360° activo",
        activeDescription: "{{count}} fotogramas configurados",
        replaceButton: "Reemplazar Fotogramas",
        deleteButton: "Eliminar Visor",
        deleteConfirm: "¿Estás seguro de que quieres eliminar el visor 360°?",
        deleteSuccess: "Visor 360° eliminado",
        deleteFailed: "Error al eliminar el visor",

        // Public Viewer
        loading: "Cargando visor 360°...",
        dragToRotate: "← Arrastra para girar →",
        frameCounter: "{{current}} / {{total}}",
        fullscreen: "Pantalla completa",
        exitFullscreen: "Salir de pantalla completa",

        // Mode Toggle
        view360: "Visor 360°",
        viewPhotos: "Fotos del Producto",
      }
    }
  }
};
```

---

## 📦 Dependencies

**New Dependencies (1):**
```bash
npm install sharp
```

**Existing Dependencies (Already Installed):**
- `@dnd-kit/*` - Drag & drop (used in ImageGalleryEditor)
- `@tanstack/react-query` - Data fetching & caching
- `shadcn/ui tabs` - Tabbed interface component
- `lucide-react` - Icons (RotateCw, Image, Upload, etc.)

---

## ✅ Testing Checklist

### Database & API (Phase 1)
- [ ] Migration runs successfully in Supabase
- [ ] Storage bucket `acr-part-images` has proper RLS policies
- [ ] API POST accepts 12-48 image files
- [ ] Sharp optimization produces 1200×1200 JPEGs
- [ ] Frames stored with correct naming: `frame-000.jpg` to `frame-023.jpg`
- [ ] Database records include width, height, file_size_bytes
- [ ] GET endpoint returns frames in correct order
- [ ] DELETE endpoint removes all frames and updates part record

### Admin Interface (Phase 2)
- [ ] Tabs render correctly (Product Photos | 360° Viewer)
- [ ] Upload zone accepts drag & drop files
- [ ] File validation blocks non-images and oversized files
- [ ] Upload progress shows: "Uploading 12/24 frames (50%)"
- [ ] Warning displayed for < 24 frames
- [ ] Preview mode allows interactive spin before publish
- [ ] Delete confirmation dialog prevents accidental removal
- [ ] Green checkmark appears on "360° Viewer" tab when active
- [ ] Mobile/tablet layout works correctly

### Public Viewer (Phase 3)
- [ ] Viewer displays all frames in sequence
- [ ] Drag-to-rotate works smoothly on desktop
- [ ] Touch swipe gestures work on mobile/tablet
- [ ] Frame counter updates: "1 / 24", "2 / 24", etc.
- [ ] Fullscreen mode functions correctly
- [ ] Auto-rotate on hover works (if implemented)
- [ ] Lazy loading reduces initial load time
- [ ] Error fallback shows photo gallery if viewer fails
- [ ] Keyboard navigation accessible (arrow keys)

### Integration (Phase 4)
- [ ] Mode toggle renders when both 360° and photos exist
- [ ] Toggle switches between views smoothly
- [ ] Default view is 360° when available
- [ ] Session storage preserves user preference
- [ ] Responsive design works on all screen sizes
- [ ] Load time < 2 seconds on 4G mobile
- [ ] All text properly translated (English + Spanish)
- [ ] WCAG 2.1 AA accessibility compliance

### Performance Benchmarks
- [ ] CTK512016 (24 frames) loads in < 2 seconds
- [ ] Total payload: ~2.4MB (24 frames × 100KB)
- [ ] First 3 frames appear instantly (lazy loading)
- [ ] No jank during rotation (60fps)
- [ ] Memory usage stable (no leaks)

---

## 🚀 Deployment Checklist

**Before Production:**
1. [ ] Run migration in production Supabase database
2. [ ] Verify `acr-part-images` bucket has 360-viewer folder
3. [ ] Test upload with production data (real part SKUs)
4. [ ] Confirm sharp library works in Vercel serverless
5. [ ] Test on real mobile devices (iOS + Android)
6. [ ] Verify CDN caching for frame images
7. [ ] Monitor Supabase storage usage (plan limits)
8. [ ] Document admin workflow for uploading 360° frames

**Production Monitoring:**
- Track upload success/failure rates
- Monitor sharp processing time (should be < 2s per frame)
- Watch storage costs (frames are ~100KB each)
- Gather user feedback on viewer UX
- A/B test auto-rotate on/off (if implemented)

---

## 📊 Success Metrics

**Technical KPIs:**
- Upload success rate: > 95%
- Average processing time: < 50s for 24 frames
- Viewer load time: < 2s on 4G mobile
- Error rate: < 1%

**Business KPIs:**
- % of parts with 360° viewer (target: 20-30% of catalog)
- Customer engagement time (expect 2-3× longer on page)
- Conversion rate impact (A/B test vs. static images)
- Support ticket reduction (fewer "what does this part look like?" inquiries)

---

## 🔮 Future Enhancements (Post-MVP)

**Not in Initial Scope:**
1. **WebP/AVIF support** - Modern image formats (smaller file sizes)
2. **Vertical rotation** - Top/bottom views (requires 2D grid of frames)
3. **Zoom capability** - Magnify specific areas during rotation
4. **Annotations** - Hotspots with part callouts
5. **AR viewer** - View part in augmented reality (mobile)
6. **Bulk upload tool** - Process multiple parts at once
7. **Auto-capture guide** - Help users photograph parts correctly
8. **Background removal AI** - Clean white backgrounds automatically

---

## 📞 Support & Resources

**Documentation:**
- Sharp library: https://sharp.pixelplumbing.com/
- 360° viewer best practices: https://www.shopify.com/retail/product-photography-360
- Image optimization guide: https://web.dev/fast/#optimize-your-images

**Technical References:**
- Existing image upload: `components/admin/parts/PartImagesManager.tsx`
- Drag & drop pattern: `components/admin/parts/ImageGalleryEditor.tsx`
- API route pattern: `app/api/admin/parts/[id]/images/route.ts`
- Public viewer pattern: `components/public/parts/PartImageGallery.tsx`

---

_This document will be updated as implementation progresses. Last updated: 2025-10-17_
