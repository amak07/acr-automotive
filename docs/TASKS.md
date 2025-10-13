# TASKS.md - ACR Automotive Development Tasks

_Last Updated: October 10, 2025_

## 🎯 Current Sprint Status

**Project Phase**: 🚀 **Category 2: User Experience Improvements** - Post-MVP Enhancements

**Overall Progress**:

- ✅ **Phase 1**: Database foundation and Excel import (Complete)
- ✅ **Phase 2**: Admin CRUD interface (Complete)
- ✅ **Phase 3**: Public search interface (Complete)
- ✅ **Phase 4**: Production deployment and optimization (Complete)
- ✅ **Phase 5**: Dev branch setup and feature flags (Complete)
- 🎯 **Phase 6**: Category 2 site enhancements (30-37.5h estimated)
- 📋 **Phase 7**: AI Integration (Planned - documentation complete)

## 📊 Production Status

- ✅ **Production Database**: Fully populated (865+ parts, 7,530+ cross-references, 2,304+ vehicle applications)
- ✅ **Vercel Deployment**: Live and operational
- ✅ **Admin Interface**: Complete parts management with CRUD operations
- ✅ **Public Search**: Vehicle search and SKU lookup functional
- ✅ **Mobile Responsive**: Tablet-optimized for parts counter staff
- ✅ **Performance**: Sub-300ms search response times maintained

## 🤖 AI Integration Status

### Phase 5: AI-Enhanced Universal Search

**Planning Status**: ✅ Documentation Complete (October 8, 2025)

#### Completed Documentation

- ✅ **Phase 1: Intent Classification System**
  - 6 valid intent types (sku_lookup, vehicle_search, part_category_search, cross_reference_lookup, compatibility_check, general_inventory)
  - 3 invalid/redirect intents (non_maza_parts, off_topic, unsupported)
  - Spanish terminology mapping for MAZA-only business
  - Prompt engineering strategy (English prompts, Spanish responses)

- ✅ **Phase 2: AI Response Generation System**
  - Progressive disclosure pattern (NO multi-turn conversation)
  - Filter chips instead of ChatGPT-style interaction
  - 3 tone variants for A/B testing (formal, friendly, business)
  - Rate limiting strategy (10/min, 50/hour, 200/day per IP)
  - Cost estimates: ~$7/month for production

- ✅ **Phase 3: Technical Foundation (Backend)**
  - Database setup with pgvector extension
  - Vector embeddings for semantic search (1536 dimensions)
  - Hybrid search strategy (traditional + semantic fallback)
  - `/api/ai/search` endpoint specification
  - Dynamic page sizing based on query type
  - Migration scripts for 865 existing parts (~$0.002 cost)

- ✅ **Phase 4: Frontend Integration (UI)**
  - Universal search bar (replaces separate SKU + vehicle inputs)
  - Voice search via Web Speech API (hands-free for counter staff)
  - Recent searches with Local Storage (persists across sessions)
  - Progressive disclosure with filter chips
  - Advanced filters panel (preserves current UX pattern)
  - Skeleton loaders and silent fallback error handling

- ✅ **AI Integration Implementation Roadmap**
  - Complete 6-8 week implementation timeline
  - Day-by-day checklists for each phase
  - Testing strategies and deployment plan
  - Feature flag rollout strategy

#### Key Architectural Decisions

- **Invisible AI Enhancement**: Users see better search, not "AI vs traditional" toggle
- **MAZA-Only**: Specialized in wheel bearings, redirects non-MAZA requests
- **Hybrid Search**: Traditional for structured queries, semantic for vague/natural language
- **Progressive Disclosure**: Filter chips (Amazon/Google pattern) instead of conversation
- **Dynamic Page Sizing**: Fetch all for incomplete queries (instant filtering), paginate for complete
- **Industry Standard UX**: Based on Amazon, Google Shopping, Algolia patterns

#### Implementation Timeline (Not Started)

```
Week 1: Phase 1 & 2 Understanding (Planning - no code)
Week 2-3: Phase 3 Implementation (Backend - Database + API)
Week 4-5: Phase 4 Implementation (Frontend - UI Components)
Week 6: Testing & QA
Week 7-8: Staging + Production Rollout (10% → 50% → 100%)

Total: 6-8 weeks
Estimated Cost: $7-10/month production usage
```

#### Next Steps for Implementation

- [ ] **Week 1**: Read Phase 1 & 2 documentation thoroughly (understand architecture)
- [ ] **Week 2 Day 1-2**: Enable pgvector in Supabase, add embedding columns
- [ ] **Week 2 Day 3**: Generate embeddings for 865 existing parts
- [ ] **Week 2 Day 4-5**: Create hybrid search SQL functions
- [ ] **Week 3 Day 1-2**: Build `/api/ai/search` endpoint with intent classification
- [ ] **Week 3 Day 3**: Implement response generation
- [ ] **Week 3 Day 4**: Add rate limiting and error handling
- [ ] **Week 3 Day 5**: Backend integration testing
- [ ] **Week 4 Day 1-2**: Build UniversalSearchInterface component
- [ ] **Week 4 Day 3**: Implement useUniversalSearch hook
- [ ] **Week 4 Day 4**: Create SearchResults with skeleton loaders
- [ ] **Week 4 Day 5**: Add voice search and recent searches
- [ ] **Week 5 Day 1-2**: Implement FilterChips component
- [ ] **Week 5 Day 3-4**: Build AdvancedFiltersPanel
- [ ] **Week 5 Day 5**: Mobile optimization and polish
- [ ] **Week 6**: Comprehensive testing (functional, performance, cross-browser)
- [ ] **Week 7**: Deploy to staging, internal testing with counter staff
- [ ] **Week 8**: Production rollout with feature flags (gradual: 10% → 50% → 100%)

#### Reference Documents (In Chat Artifacts)

All documentation exists as artifacts in the current chat session:

1. "Phase 1: Intent Classification System for ACR Automotive"
2. "Phase 2: AI Response Generation System for ACR Automotive"
3. "Phase 3: Technical Foundation (Backend)"
4. "Phase 4: Frontend Integration (UI)"
5. "AI Integration Implementation Roadmap"

**Important**: Save these artifacts locally before starting implementation.

#### Success Criteria

**Technical**:

- Search response time <800ms (AI-enhanced, vs <300ms traditional)
- Intent classification accuracy >85%
- Error rate <5%
- Monthly AI cost <$10

**User Experience**:

- Search success rate >90%
- Voice search works on tablets
- Filter chips apply instantly (<50ms)
- Silent fallback on AI failures (users always get results)

**Business**:

- Counter staff adopt universal search
- Reduced "no results" scenarios by 70%+
- Faster search workflow vs current dropdowns
- Handles natural language: "rodamientos Honda Civic 2018"

---

## 📋 Category 2: User Experience Improvements (Phase 6)

**Status**: 🎯 In Progress (2.1, 2.2, 2.3 Complete)
**Total Estimated Time**: 30-37.5 hours
**Completed Estimate**: ~20-23 hours (Features 2.1, 2.2, 2.3)
**ACTUAL TIME SPENT**: ~19 hours (10h for 2.1 & 2.2, 9h for 2.3)
**Remaining**: ~10-14 hours (Feature 2.4 only)
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

**Files modified/created:**
- ✅ `components/public/parts/PublicPartDetails.tsx` - Added year ranges (start_year-end_year)
- ✅ `components/layout/Footer.tsx` - New footer with ACR branding and smart navigation
- ✅ `components/acr/Header.tsx` - Made logo clickable with useHomeLink
- ✅ `components/acr/Tabs.tsx` - New responsive tabs component
- ✅ `components/public/search/PublicSearchFilters.tsx` - Tab-based search interface
- ✅ `app/layout.tsx` - Added footer and flexbox layout
- ✅ `hooks/common/useHomeLink.ts` - Smart home navigation hook

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

**Files created/modified:**
- ✅ `app/admin/page.tsx` - URL-based state management
- ✅ `app/page.tsx` - URL-based state management for public search
- ✅ `components/public/search/PublicSearchFilters.tsx` - URL state sync
- ✅ `components/public/parts/PublicPartsList.tsx` - Preserve params in links
- ✅ `components/admin/parts/PartsList.tsx` - Preserve params in links
- ✅ `components/admin/parts/parts-table-config.tsx` - Preserve params in actions
- ✅ `components/admin/layout/PartDetailsBreadcrumb.tsx` - Preserve params in back link
- ✅ `hooks/common/useURLState.ts` - Generic URL state management hook
- ✅ `hooks/common/usePreserveSearchParams.ts` - Helper to preserve search params

**Benefits:**
- ✅ Browser back/forward works naturally
- ✅ Bookmarkable searches
- ✅ Shareable URLs with exact filters
- ✅ Page refresh preserves state
- ✅ Search state persists across navigation

**Additional Improvements:**
- ✅ Added responsive translation keys for mobile/desktop tab labels
- ✅ Created `common.actions.searchBy` translation key
- ✅ Clear filters button inline with search on desktop
- ✅ Mobile: Solid bordered tab style, Desktop: Ghost/link style

---

### Feature 2.3: Multiple Images Per Part (14-16h) ✅ COMPLETED

**Allow multiple images per part with gallery UI**

#### Database & Storage (2-3h) ✅
- ✅ Create `part_images` table migration
- ✅ Configure Supabase Storage bucket policies (acr-part-images)
- ✅ Add indexes for performance (display_order, part_id)
- ✅ Add unique constraint for primary image per part

#### Backend API (4-5h) ✅
- ✅ POST `/api/admin/parts/[id]/images` - Upload images (max 6 per part)
- ✅ PUT `/api/admin/parts/[id]/images/reorder` - Reorder images with display_order
- ✅ PUT `/api/admin/parts/[id]/images/[imageId]/primary` - Set primary image
- ✅ PUT `/api/admin/parts/[id]/images/[imageId]` - Update caption
- ✅ DELETE `/api/admin/parts/[id]/images/[imageId]` - Delete image
- ✅ GET `/api/admin/parts/[id]/images` - Fetch all images for a part
- ✅ Updated public parts API to remove deprecated image_url column

#### Admin UI (5-6h) ✅
- ✅ Create `PartImagesManager` component with upload area
- ✅ Implement drag & drop gallery editor (using @dnd-kit)
- ✅ Add delete functionality with confirmation
- ✅ Display primary badge on first image (determined by display_order)
- ✅ Integrate into part edit pages
- ✅ Add loading states for all operations
- ✅ Add image count badge (X/6)
- ✅ Add instructional text for drag-to-reorder
- ✅ Simplified UX: removed caption editing, star icon, drag handles

#### Public UI (3-4h) ✅
- ✅ Create `PartImageGallery` component (Baleros-Bisa style)
- ✅ Add thumbnail strip (vertical) and main image display
- ✅ Display image captions when available
- ✅ Integrate into search results and part details pages
- ✅ Add placeholder image for parts without images
- ✅ Update `enrichWithPrimaryImages()` to use display_order

#### Bug Fixes & Refinements ✅
- ✅ Fixed delete button not working (drag handlers intercepting clicks)
- ✅ Fixed sort order not respected (removed is_primary dependency)
- ✅ Fixed database functions referencing removed image_url column
- ✅ Added all i18n translations (English + Spanish)
- ✅ Updated success toasts to green for UX consistency
- ✅ Created migration 002_update_search_functions.sql

**New dependencies installed:**
- ✅ `@dnd-kit/core`
- ✅ `@dnd-kit/sortable`
- ✅ `@dnd-kit/utilities`

**Files created:**
- `components/admin/parts/PartImagesManager.tsx`
- `components/admin/parts/ImageGalleryEditor.tsx`
- `components/public/parts/PartImageGallery.tsx`
- `app/api/admin/parts/[id]/images/route.ts`
- `app/api/admin/parts/[id]/images/[imageId]/route.ts`
- `app/api/admin/parts/[id]/images/[imageId]/primary/route.ts`
- `app/api/admin/parts/[id]/images/reorder/route.ts`
- `lib/supabase/migrations/001_add_part_images.sql`
- `lib/supabase/migrations/002_update_search_functions.sql`
- `public/part-placeholder-new.svg`

---

### Feature 2.4: Website Assets & Settings Management (10-14h)

**Admin interface for site configuration**

#### Database Schema (1h)
- [ ] Create `site_settings` table (key-value JSONB storage)
- [ ] Create `banners` table (promotional banners)
- [ ] Add indexes and initial default values

#### Settings API (3-4h)
- [ ] GET/PUT `/api/admin/settings` - Manage site settings
- [ ] POST `/api/admin/settings/upload-logo` - Upload logo/favicon
- [ ] CRUD `/api/admin/banners` - Banner management
- [ ] GET `/api/public/banners/active` - Active banners for public

#### Admin Settings Page (4-6h)
- [ ] Create settings page with tabs (Contact, Branding, Banners, SEO)
- [ ] Build `ContactInfoSettings` component
- [ ] Build `BrandingSettings` component (logo/favicon upload)
- [ ] Build `BannersManagement` component (CRUD UI)
- [ ] Build `SEOSettings` component (meta tags)

#### Public Display (2-3h)
- [ ] Create `SettingsContext` provider
- [ ] Update footer to use dynamic settings
- [ ] Create `BannerDisplay` component
- [ ] Add banner display to public search page
- [ ] Implement banner scheduling logic (date ranges)

**Files to create:**
- `app/admin/settings/page.tsx`
- `components/admin/settings/*`
- `components/public/banner-display.tsx`
- `contexts/SettingsContext.tsx`
- `lib/supabase/migrations/005_site_settings.sql`

---

## 🔄 Current Session State

### Latest Session: October 13, 2025 (Session 4)

**Focus**: Feature 2.3 completion - Bug fixes, loading states, and i18n

**Completed**:

- ✅ **Fixed all PartImagesManager bugs**
  - Fixed delete button not working (moved drag handlers to image only, not entire card)
  - Added loading states for upload and delete operations
  - Updated all success toasts to green variant for UX consistency
  - Added proper error handling in delete mutation
- ✅ **Fixed image sort order issues**
  - Removed dependency on `is_primary` flag
  - Simplified to use `display_order` only (first image = primary)
  - Updated public API `enrichWithPrimaryImages()` function
  - Updated `PartImageGallery` component to sort by display_order
  - Simplified upload logic to not rely on `is_primary` flag
- ✅ **Fixed database function errors**
  - Created migration `002_update_search_functions.sql`
  - Removed `image_url` column from `search_by_sku()` and `search_by_vehicle()` functions
  - Added DROP FUNCTION statements to allow return type changes
  - Updated main schema.sql file for consistency
- ✅ **Completed i18n translations**
  - Added `partDetails.images.dragTipLabel` ("Tip:" / "Consejo:")
  - Added `partDetails.images.dragTip` with full instruction text
  - All 22 image management translation keys now complete in English and Spanish
- ✅ **Removed debug logging** from previous session

**Files Modified**:

- `components/admin/parts/PartImagesManager.tsx` - Loading states, delete fixes, removed unused state
- `components/admin/parts/ImageGalleryEditor.tsx` - Fixed drag handlers, added i18n for tip
- `app/api/public/parts/route.ts` - Simplified primary image logic
- `components/public/parts/PartImageGallery.tsx` - Removed is_primary sorting
- `app/api/admin/parts/[id]/images/route.ts` - Simplified upload logic
- `app/api/admin/parts/[id]/images/[imageId]/route.ts` - Enhanced delete logging
- `lib/supabase/schema.sql` - Updated database functions
- `lib/supabase/migrations/002_update_search_functions.sql` - New migration file
- `lib/i18n/translations.ts` - Added dragTipLabel and dragTip keys
- `lib/i18n/translation-keys.ts` - Added type definitions

**Migration to Run**:
- `002_update_search_functions.sql` - Ready to run in Supabase SQL Editor

**Feature Status**: ✅ Feature 2.3 COMPLETE - All functionality working, all bugs fixed, fully internationalized

**Next Priorities**:

1. Run migration `002_update_search_functions.sql` in Supabase production
2. Begin Feature 2.4: Website Assets & Settings Management (10-14h estimated)

---

### Previous Session: October 11, 2025 (Session 3)

**Focus**: Feature 2.3 UX improvements and React Query cache invalidation debugging

**Completed**:

- ✅ Fixed Part Images Manager UX issues
  - Removed caption input field (not needed for use case)
  - Fixed Primary badge background color (red instead of white)
  - Added dark gradient overlay at top of image cards for better button visibility
  - Removed star icon and drag handle buttons
  - Added instructional text: "The first image is your primary image. Click and hold any image to drag and reorder"
  - Enabled click-and-hold drag on entire image card (not just handle)
  - Primary image is now automatically the first image in display order
- ✅ Created new placeholder image for parts without images
  - SVG-based design with ACR logo
  - Bilingual text (Spanish/English)
  - Clean, professional appearance matching brand
  - File: `public/part-placeholder-new.svg`
- ✅ Updated public part details page to match Baleros-Bisa layout
  - Moved SKU to page header (large, prominent)
  - Moved SKU and part type (Clase) into specifications table
  - Used "Clase" terminology (Spanish for "Type/Class") to match industry standard
  - Removed ACR badge from details card for cleaner look
- ✅ Fixed ImageGalleryEditor state synchronization bug
  - Changed incorrect `useState` call to `useEffect` with proper dependencies
  - Component now properly syncs when images prop changes from parent

**Issues Identified (Not Resolved)**:

- 🐛 **React Query Cache Invalidation Bug**: Primary image changes in admin don't reflect on public search page
  - Root cause: Query invalidation is working, but stale data persists
  - Investigation showed query key structure: `["public","parts","list",{"filters":{...}}]`
  - Attempted fixes:
    1. Direct key invalidation: `queryKey: ["public", "parts"]` - didn't match
    2. More specific: `queryKey: ["public", "parts", "list"]` - didn't match
    3. Predicate function: `predicate: (query) => key[0] === "public" && key[1] === "parts" && key[2] === "list"` - partially working
  - Current state: Invalidation fires, query refetches, but old primary image still displays
  - Possible remaining issue: `enrichWithPrimaryImages()` API function may not correctly calculate primary based on `display_order`
  - Logs confirm: Query invalidates → Refetch occurs → Data fetched, but wrong image displays

**Files Modified**:

- `src/components/admin/parts/ImageGalleryEditor.tsx` - Simplified UX, removed caption/star/handle, added instructions
- `src/components/admin/parts/PartImagesManager.tsx` - Removed caption mutation, added React Query cache invalidation
- `src/components/public/parts/PublicPartsList.tsx` - Updated to use new placeholder image
- `src/components/public/parts/PublicPartDetails.tsx` - Updated layout to match Baleros-Bisa, moved SKU to header
- `src/lib/i18n/translation-keys.ts` - Added `public.partDetails.sku` and `public.partDetails.type` keys
- `src/lib/i18n/translations.ts` - Added translations (en: "Type", es: "Clase")
- `src/hooks/public/usePublicParts.ts` - Added debug logging, fixed useEffect state sync
- `public/part-placeholder-new.svg` - New placeholder with ACR logo

**Debug Logging Added** (to be removed later):

- `PartImagesManager.tsx:101` - "[DEBUG] Reorder success - invalidating queries"
- `PartImagesManager.tsx:113` - "[DEBUG] All queries invalidated"
- `usePublicParts.ts:22` - "[DEBUG] usePublicParts query key: ..."
- `usePublicParts.ts:27` - "[DEBUG] Fetching public parts list"
- `usePublicParts.ts:47` - "[DEBUG] Public parts fetched: X parts"

**Next Session Priorities**:

1. **Fix primary image cache bug**: Investigate `enrichWithPrimaryImages()` in `/api/public/parts/route.ts`
   - Check if it's correctly selecting primary image based on `is_primary` flag or `display_order = 0`
   - Verify database query is sorting by `display_order ASC`
   - Test if reorder API is correctly updating `is_primary` flag when order changes
2. Remove debug logging once bug is fixed
3. Continue Feature 2.3 testing with all 6 image scenarios (upload, reorder, set primary, delete, caption, limits)
4. Run database migration in production
5. Begin Feature 2.4: Website Assets & Settings Management (10-14h)

**Current State**: Feature 2.3 UI improvements complete and polished. One critical bug remains with React Query cache invalidation for primary images. Database and API work complete, but needs investigation into `enrichWithPrimaryImages()` logic.

---

## 🚀 Active Development Areas

### Core Features Complete ✅

### High Priority: AI Integration (Phase 5)

- 📋 **Backend Implementation**: Database setup, embeddings, API development (Week 2-3)
- 📋 **Frontend Implementation**: Universal search UI, voice input, filter chips (Week 4-5)
- 📋 **Testing & Deployment**: QA, staging, gradual production rollout (Week 6-8)

### Post-MVP Features

See `docs/ENHANCEMENTS.md` for complete prioritized roadmap of additional features beyond AI integration.

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
