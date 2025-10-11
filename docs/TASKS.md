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

**Status**: 🎯 In Progress (2.1 & 2.2 Complete)
**Total Estimated Time**: 30-37.5 hours
**Completed**: ~5.5-6.5 hours (Features 2.1 & 2.2)
**Remaining**: ~24-31 hours (Features 2.3 & 2.4)
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

### Feature 2.3: Multiple Images Per Part (14-16h)

**Allow multiple images per part with gallery UI**

#### Database & Storage (2-3h)
- [ ] Create `part_images` table migration
- [ ] Configure Supabase Storage bucket policies
- [ ] Add indexes for performance

#### Backend API (4-5h)
- [ ] POST `/api/admin/parts/[id]/images` - Upload images
- [ ] PUT `/api/admin/parts/[id]/images/reorder` - Reorder images
- [ ] PUT `/api/admin/parts/[id]/images/[imageId]/primary` - Set primary
- [ ] PUT `/api/admin/parts/[id]/images/[imageId]` - Update caption
- [ ] DELETE `/api/admin/parts/[id]/images/[imageId]` - Delete image
- [ ] Create `PartImagesService` for business logic

#### Admin UI (5-6h)
- [ ] Create `PartImagesManager` component with upload area
- [ ] Implement drag & drop gallery editor (using @dnd-kit)
- [ ] Add set primary, delete, and caption editing
- [ ] Integrate into part edit/create pages

#### Public UI (3-4h)
- [ ] Create `PartImageGallery` component
- [ ] Add navigation arrows and thumbnail strip
- [ ] Implement mobile swipe gestures (using @use-gesture)
- [ ] Display image captions
- [ ] Integrate into search results

**New dependencies:**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@use-gesture/react`

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

### Latest Session: October 10, 2025 (Session 2)

**Focus**: TypeScript errors, build fixes, and Suspense boundary resolution

**Completed**:

- ✅ Fixed all 12 TypeScript compilation errors
  - Updated `useHomeLink` hook to return proper `Route` type
  - Fixed Supabase types: `start_year/end_year` as numbers (not `year_range` string)
  - Cast `router.push()` dynamic URLs to `Route` type
  - Fixed `useURLState` generic indexing with type assertions
  - Simplified `setSearchTerms` interface to `(terms: T) => void`
- ✅ Resolved Next.js build errors with Suspense boundaries
  - Refactored `useHomeLink` to remove `useSearchParams()` dependency (now only uses `usePathname()`)
  - Added Suspense boundaries to page components (HomePage, AdminPage)
  - Split pages into wrapper + content components
  - Removed Footer Suspense (no longer needed)
- ✅ Production build now completes successfully (15/15 static pages generated)

**Key Technical Insights**:

1. **Root Cause of Build Error**: Footer in root layout was calling `useHomeLink` which used `useSearchParams()`, causing prerender failures on all pages including 404
2. **Solution**: Removed `useSearchParams()` from `useHomeLink` - now just checks if pathname starts with `/admin`
3. **No force-dynamic needed**: Suspense boundaries alone are sufficient once layout-level search params removed

**Files Modified**:

- `src/hooks/common/useHomeLink.ts` - Removed useSearchParams, simpler pathname-only logic
- `src/lib/supabase/types.ts` - Fixed year_range to start_year/end_year
- `src/app/page.tsx` - Added Suspense boundary, split into HomePage + HomePageContent
- `src/app/admin/page.tsx` - Added Suspense boundary, split into AdminPage + AdminPageContent
- `src/app/layout.tsx` - Removed Suspense from Footer (no longer needed)
- `src/hooks/common/useURLState.ts` - Fixed generic type indexing, cast router.push to Route
- `src/components/admin/parts/SearchFilters.tsx` - Simplified setSearchTerms type
- `src/components/public/search/PublicSearchFilters.tsx` - Simplified setSearchTerms type

**Git Commits**:

1. `941f2e5` - Fix TypeScript compilation errors
2. `dd6b51c` - Fix Next.js build: Resolve useSearchParams Suspense boundary issues

**Known Issue (Non-Blocking)**:

- VSCode TypeScript language server shows error for `use-debounce` import in `src/app/admin/page.tsx`
- Actual TypeScript compilation works fine (`tsc --noEmit` passes)
- Fix: Restart TypeScript Server in VSCode (`Ctrl+Shift+P` → "TypeScript: Restart TS Server")

**Next Session Priorities**:

1. Continue Category 2 Feature 2.3: Multiple Images Per Part (14-16h)
2. Create `part_images` table migration
3. Set up Supabase Storage bucket policies
4. Build image upload API endpoints

**Current State**: All TypeScript errors resolved, production build working. Ready to continue Category 2 implementation (Features 2.1 & 2.2 complete, ~24-31h remaining for Features 2.3 & 2.4).

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
