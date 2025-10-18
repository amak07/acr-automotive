# TASKS.md - ACR Automotive Development Tasks

_Last Updated: October 18, 2025_

## 🎯 Current Sprint Status

**Project Phase**: 🎉 **360° Interactive Viewer - COMPLETE!**

**Overall Progress**:

- ✅ **Phase 1**: Database foundation and Excel import (Complete)
- ✅ **Phase 2**: Admin CRUD interface (Complete)
- ✅ **Phase 3**: Public search interface (Complete)
- ✅ **Phase 4**: Production deployment and optimization (Complete)
- ✅ **Phase 5**: Dev branch setup and feature flags (Complete)
- ✅ **Phase 6**: Category 2 site enhancements - **ALL FEATURES COMPLETE** ✨
- ✅ **Phase 7**: 360° Interactive Viewer - **COMPLETE** 🎉 (October 18, 2025)
- 📋 **Phase 8**: AI Integration (Future - documentation complete)

## 📊 Production Status

- ✅ **Production Database**: Fully populated (865+ parts, 7,530+ cross-references, 2,304+ vehicle applications)
- ✅ **Vercel Deployment**: Live and operational
- ✅ **Admin Interface**: Complete parts management with CRUD operations + Settings Management
- ✅ **Public Search**: Vehicle search and SKU lookup functional
- ✅ **Mobile Responsive**: Tablet-optimized for parts counter staff
- ✅ **Performance**: Sub-300ms search response times maintained
- ✅ **Settings Management**: Dynamic footer, logo/favicon/banner uploads

---

## 🎬 Phase 7: 360° Interactive Viewer (Current Phase)

**Status**: 📋 Planning Complete - Ready for Implementation
**Total Estimated Time**: 32-40 hours (4 weeks part-time)
**Technical Plan**: `docs/technical-plans/360-viewer-acr-production.md`
**Test Data**: CTK512016 (24 frames @ 800×800px in `public/CTK512016/`)

### Overview

Add professional 360° drag-to-rotate viewer for parts catalog, allowing customers to inspect parts from all angles. Integrates with existing image gallery using tabbed admin interface.

**Key Features:**
- ✅ Flexible frame count (12-48 frames) with industry-standard validation
- ✅ Server-side optimization with Sharp (standardize to 1200×1200px @ 85% JPEG)
- ✅ Tabbed admin UI (Product Photos | 360° Viewer)
- ✅ Drag-to-rotate interaction (desktop + mobile touch gestures)
- ✅ Lazy loading & performance optimization
- ✅ Dual-mode public display (360° viewer ↔ photo gallery toggle)

---

### Implementation Phases

#### **Week 1: Database & API Foundation** (8-10 hours) - ✅ COMPLETE

**Tasks:**
- [x] Install Sharp library: `npm install sharp` (v0.34.4 already installed)
- [x] Run migration `004_add_360_viewer.sql` in Supabase
  - [x] Add `has_360_viewer`, `viewer_360_frame_count` to parts table
  - [x] Create `part_360_frames` table with RLS policies
  - [x] Add performance indexes
- [x] Create API route: `app/api/admin/parts/[id]/360-frames/route.ts`
  - [x] POST endpoint: Upload + optimize frames with Sharp
  - [x] GET endpoint: Fetch frames for part
  - [x] DELETE endpoint: Remove 360° viewer
  - [x] Individual frame delete: `[frameId]/route.ts`
- [x] Implement frame count validation (12 min, 24 recommended, 48 max)
- [x] Use correct Supabase client pattern (matches existing routes)
- [ ] **Integration testing deferred:** Will test via Week 2 admin UI

**Validation Rules:**
- ❌ Block: < 12 frames ("Minimum 12 frames required")
- ⚠️ Warn: 12-23 frames ("24+ frames recommended for smooth rotation")
- ✅ Accept: 24-48 frames (no warning)
- ⚠️ Warn: > 48 frames ("Consider 48 frames or fewer for optimal loading")

**Success Criteria:**
- [x] API accepts 12-48 image files
- [x] Sharp optimizes each frame to 1200×1200px @ ~100KB
- [x] Frames stored at `360-viewer/{acr_sku}/frame-000.jpg` to `frame-023.jpg`
- [x] Database records include width, height, file_size_bytes
- [x] TypeScript compilation clean (no errors)
- [ ] Integration testing via admin UI (Week 2)

---

#### **Week 2: Admin Upload Interface** (10-12 hours) - ✅ COMPLETE

**Tasks:**
- [x] Create `PartMediaManager.tsx` (tabbed container)
  - [x] Tab 1: Product Photos (existing PartImagesManager)
  - [x] Tab 2: 360° Viewer (new Upload360Viewer)
  - [x] Green checkmark indicator when 360° active
- [x] Create `Upload360Viewer.tsx` component
  - [x] Drag & drop file upload zone
  - [x] File validation (type, size, count)
  - [x] Upload progress tracking
  - [x] Warning dialogs for < 24 frames
  - [x] Active state (viewer configured with frame count)
  - [x] Delete confirmation dialog
  - [x] Replace All functionality
- [x] Update `PartFormContainer.tsx`
  - [x] Replace `<PartImagesManager>` with `<PartMediaManager>`
- [x] Add 35 i18n keys (English + Spanish)

**Component Flow:**
```
Empty State → Upload Zone → Progress → Preview → Active State
                ↓              ↓          ↓          ↓
            Select files   Optimize   Test spin   Published
```

**Success Criteria:**
- [ ] Tabs render correctly with proper styling
- [ ] Upload accepts drag & drop + file picker
- [ ] Progress shown during bulk upload
- [ ] Preview mode allows interactive rotation test
- [ ] Warning displayed for suboptimal frame counts
- [ ] Mobile/tablet layout responsive

---

#### **Week 3: Public Interactive Viewer** (8-10 hours) - ✅ COMPLETE

**Tasks:**
- [x] Create `Part360Viewer.tsx` component
  - [x] Drag-to-rotate interaction (mouse)
  - [x] Touch swipe gestures (mobile/tablet)
  - [x] Fullscreen mode button
  - [x] Loading state (spinner while preloading)
  - [x] Instruction overlay with fade on interaction
- [x] Implement performance optimizations
  - [x] Lazy loading (first 3 frames instant, rest in background)
  - [x] Adjacent frame preloading (smooth rotation without gaps)
- [x] Add error handling & fallback
  - [x] Fallback to photo gallery if viewer fails to load

**Success Criteria:**
- [x] Smooth drag-to-rotate on desktop (60fps)
- [x] Touch gestures work on mobile/tablet
- [x] Fullscreen mode functional
- [x] Load time < 2 seconds on 4G mobile
- [x] Graceful fallback to photo gallery on error

---

#### **Week 4: Public Integration & Testing** (6-8 hours) - ✅ COMPLETE

**Tasks:**
- [x] Integrate viewer into public part details page
- [x] Build Amazon-style gallery (360° as first thumbnail)
- [x] Implement view mode toggling (360° ↔ photos)
- [x] Mobile/tablet UX polish (centering, responsive overlays)
- [x] Independent lazy loading (banners vs parts)
- [x] Complete i18n coverage (all keys translated)
- [x] Mobile UX enhancements for photo gallery

**Mobile Photo Gallery Enhancements (Beyond Original Scope):**
- [x] Horizontal thumbnail strip at bottom (mobile only)
- [x] Pinch-to-zoom for static photos (react-zoom-pan-pinch)
- [x] Double-tap zoom toggle
- [x] Fixed uneven borders on thumbnails

**Testing Checklist:**
- [x] Desktop: Viewer centering, fullscreen mode
- [x] Mobile: Touch gestures, responsive overlays, zoom
- [x] Tablet: Gallery layout, interactions
- [x] Load time optimizations with skeleton loaders
- [x] Fallback works when viewer errors

**Production Deployment:**
- [ ] Run migration in production Supabase
- [ ] Verify storage bucket has 360-viewer folder
- [ ] Test Sharp library in Vercel serverless
- [ ] Monitor Supabase storage usage
- [ ] Gather user feedback on UX

---

### Files to Create (8 total)

**Database & API:**
- `lib/supabase/migrations/004_add_360_viewer.sql`
- `app/api/admin/parts/[id]/360-frames/route.ts`

**Admin Components:**
- `components/admin/parts/PartMediaManager.tsx`
- `components/admin/parts/Upload360Viewer.tsx`

**Public Components:**
- `components/public/parts/Part360Viewer.tsx`

**Files to Modify (2 total):**
- `components/admin/parts/PartFormContainer.tsx` (replace PartImagesManager)
- `app/parts/[id]/page.tsx` (add viewer with toggle - pending UX discussion)

---

### Dependencies

**New (1):**
```bash
npm install sharp
```

**Existing (already installed):**
- `@dnd-kit/*` - Drag & drop (used in ImageGalleryEditor)
- `@tanstack/react-query` - Data fetching
- `shadcn/ui tabs` - Tabbed interface
- `lucide-react` - Icons (RotateCw, Image, Upload, etc.)

---

### Success Metrics

**Technical KPIs:**
- Upload success rate: > 95%
- Average processing time: < 50s for 24 frames
- Viewer load time: < 2s on 4G mobile
- Error rate: < 1%

**Business KPIs:**
- % parts with 360° viewer: 20-30% of catalog
- Customer engagement time: 2-3× longer on page
- Conversion rate impact (A/B test vs. static images)
- Support ticket reduction ("what does this look like?")

---

## 📋 Category 2: User Experience Improvements (Phase 6)

**Status**: ✅ COMPLETE! (All 4 features done)
**Total Estimated Time**: 30-37.5 hours
**ACTUAL TIME SPENT**: ~30 hours (10h for 2.1 & 2.2, 9h for 2.3, 11h for 2.4)
**Feature Flag**: `enablePostMVP` (enabled in dev, disabled in production)
**Technical Plan**: `docs/technical-plans/site-enhancements/acr_cat2_tech_plan.txt`

### Feature 2.1: General UI Updates (1.5h) ✅ COMPLETED

**Quick wins to improve user experience**

- ✅ Add year ranges to vehicle applications in public search results
- ✅ Create footer component with logo, contact info, and links
- ✅ Add email clickable links to footer (contacto@acrautomotive.com)
- ✅ Make header logo clickable (navigate to home with smart routing)
- ✅ Update layout.tsx to include footer
- ✅ Create ACR Tabs component for search interface
- ✅ Replace collapsible SKU search with tab-based interface
- ✅ Add clear filters button to both search tabs

---

### Feature 2.2: Persist Filters & Search State (4-5h) ✅ COMPLETED

**URL-based state management for better UX**

- ✅ Implement URL state management for admin parts page
- ✅ Add debounced search input updates
- ✅ Implement pagination with URL state
- ✅ Add filter controls (part_type, position, sort)
- ✅ Test browser back/forward navigation
- ✅ Verify bookmarkable URLs work
- ✅ Apply same pattern to public search page
- ✅ Create reusable hooks for URL state management
- ✅ Preserve search params across all navigation flows

---

### Feature 2.3: Multiple Images Per Part (14-16h) ✅ COMPLETED

**Allow multiple images per part with gallery UI**

- ✅ Database & Storage (part_images table, acr-part-images bucket)
- ✅ Backend API (upload, reorder, delete, set primary)
- ✅ Admin UI (drag & drop gallery editor with @dnd-kit)
- ✅ Public UI (thumbnail gallery, placeholder image)
- ✅ Bug fixes (delete, sort order, loading states)
- ✅ Full internationalization (English + Spanish)
- ✅ WCAG 2.1 AA keyboard accessibility

---

### Feature 2.4: Website Assets & Settings Management (10-14h) ✅ COMPLETED

**Admin interface for site configuration**

#### Database Schema (1h) ✅
- ✅ Created `site_settings` table (key-value JSONB storage)
- ✅ Simplified schema: contact_info and branding only (no SEO/banners for MVP)
- ✅ Created storage bucket `acr-site-assets` with RLS policies
- ✅ Made migration idempotent (safe to re-run)

#### Settings API (3-4h) ✅
- ✅ GET/PUT `/api/admin/settings` - Manage site settings
- ✅ POST `/api/admin/settings/upload-asset` - Upload logo/favicon/banner
- ✅ GET `/api/public/settings` - Public endpoint for footer
- ✅ Created Zod schemas and TypeScript types

#### Admin Settings Page (4-6h) ✅
- ✅ Created `/admin/settings` page with authentication
- ✅ Built `SettingsPageContent` - Single-page layout (removed tabs)
- ✅ Built `ContactInfoSettings` - Email, phone, whatsapp, address
- ✅ Built `BrandingSettings` - Company name, logo, favicon, banner uploads
- ✅ Moved language toggle and logout to settings page

#### Public Display (2-3h) ✅
- ✅ Created `SettingsContext` provider with React Query
- ✅ Updated footer to use dynamic settings
- ✅ Fixed cache invalidation (both admin and public queries)

#### i18n & UX (Complete) ✅
- ✅ Added 58 new translation keys (English + Spanish)
- ✅ Applied translations to all settings components
- ✅ Removed logout/language toggle from AdminHeader
- ✅ Made Header language toggle optional
- ✅ Updated AcrLanguageToggle UX (unified ACR red active state)
- ✅ Settings moved to rightmost position in header

**Files created:**
- `lib/supabase/migrations/003_add_site_settings.sql`
- `lib/types/settings.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/settings/upload-asset/route.ts`
- `app/api/public/settings/route.ts`
- `app/admin/settings/page.tsx`
- `components/admin/settings/SettingsPageContent.tsx`
- `components/admin/settings/ContactInfoSettings.tsx`
- `components/admin/settings/BrandingSettings.tsx`
- `contexts/SettingsContext.tsx`

**Remaining:**
- [ ] Run migration `003_add_site_settings.sql` in Supabase production

---

## 🔄 Current Session State

### Latest Session: October 18, 2025 (Session 11 - 360° Viewer Completion + Mobile Gallery Enhancements)

**Focus**: Completed 360° Interactive Viewer (Phase 7) + Mobile Photo Gallery UX Improvements

**Completed**:

- ✅ **360° Viewer Mobile UX Polish**
  - Fixed mobile overlay positioning (drag-to-rotate label at bottom)
  - Made fullscreen button smaller and repositioned on mobile (`top-2 right-2`, smaller icon)
  - Fixed desktop centering issue (added `flex items-center justify-center` to gallery container)
  - Responsive text and spacing (`text-xs md:text-sm`, `px-3 py-1.5 md:px-6 md:py-3`)

- ✅ **Independent Lazy Loading (Banners vs Parts)**
  - Created `SkeletonBannerCarousel` component matching actual carousel layout
  - Implemented separate loading states for banners (`settingsLoading`) and parts (`isLoading`)
  - Banners and parts list now load independently with proper skeleton loaders
  - Better perceived performance and granular loading feedback

- ✅ **Mobile Photo Gallery Enhancements**
  - Horizontal thumbnail strip at bottom for mobile (`md:hidden flex gap-2`)
  - Vertical strip remains on desktop (`hidden md:flex`)
  - Smaller thumbnails on mobile (64px × 64px vs 80px × 80px)
  - Implemented pinch-to-zoom for static photos (`react-zoom-pan-pinch`)
  - Double-tap zoom toggle (1x → 4x magnification)
  - Pan/drag when zoomed in
  - Fixed uneven borders (using inline styles for dimensions)

- ✅ **Swipe Navigation Decision**
  - Evaluated swipe gestures for gallery navigation
  - Decided to disable due to conflict with 360° viewer drag-to-rotate
  - Kept simple thumbnail-based navigation

**Technical Decisions**:
- `TransformWrapper` only wraps static photos, not 360° viewer (no conflicts)
- Zoom range: 1x-4x with wheel disabled, pinch/panning enabled
- Removed `rounded` class from thumbnails for cleaner borders
- Used inline `style={{ width: '64px', height: '64px' }}` for consistent border rendering

**Dependencies Added**:
- `react-zoom-pan-pinch` (v3.7.0) - Pinch-to-zoom library

**Files Modified (4)**:
- `src/components/public/parts/Part360Viewer.tsx` - Mobile overlay/button positioning
- `src/components/public/parts/PartImageGallery.tsx` - Horizontal thumbnails, pinch-to-zoom
- `src/components/ui/skeleton.tsx` - Added SkeletonBannerCarousel
- `src/app/page.tsx` - Independent banner lazy loading

**Phase 7 Status**: ✅ **COMPLETE** - All 4 weeks done, ready for production testing

**Next Priorities**:
1. Production deployment (run migration, test Sharp in Vercel)
2. Gather user feedback on UX
3. Consider additional enhancements (fullscreen for static photos, visual zoom hints)

---

## 🚀 Active Development Areas

### 🎯 Current: 360° Interactive Viewer (Phase 7)

**Status**: ✅ **COMPLETE** - All 4 weeks implemented
**Timeline**: 4 weeks (32-40 hours) - Completed October 18, 2025
**Next Step**: Production deployment and user testing

See Phase 7 section above for complete implementation breakdown.

---

### 📋 Future: AI Integration (Phase 8)

**Planning Status**: ✅ Documentation Complete (October 8, 2025)

Deferred to Phase 8 after 360° viewer completion. See detailed AI Integration plan with:
- Intent Classification System (6 valid, 3 invalid intent types)
- AI Response Generation (progressive disclosure, filter chips)
- Technical Foundation (pgvector, embeddings, hybrid search)
- Frontend Integration (universal search, voice input)
- 6-8 week implementation timeline
- $7-10/month estimated cost

---

### Post-MVP Features

See `docs/ENHANCEMENTS.md` for complete prioritized roadmap.

## 📋 Technical Maintenance

### Infrastructure Tasks (Future)

- [ ] **Development Branch Setup**: Create dev branch for testing environment
- [ ] **Production URL Configuration**: Update environment variables for production domain
- [ ] **Enhanced Authentication**: Upgrade from MVP password to professional auth system (post-AI)
- [ ] **Performance Monitoring**: Implement application monitoring and alerting
- [ ] **Cost Monitoring**: Track OpenAI API usage and set budget alerts
- [ ] **A/B Testing**: Implement tone variant testing for AI responses

---

## 📝 Session Update Instructions

**For Claude**: When the user asks to "update session state" or "log current session":

1. **Use the Session Summary Template above**
2. **Be concise** - focus on what was actually accomplished
3. **Include specific file changes** and technical decisions made
4. **Note next priorities** based on what was discussed
5. **Update the "Latest Session" section** with the new summary
6. **Update the current date** in the header

This keeps the file focused on current work rather than historical task completion details.