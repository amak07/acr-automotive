# TASKS.md - ACR Automotive Development Tasks

_Last Updated: October 8, 2025_

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

**Status**: 🎯 Ready to begin
**Total Estimated Time**: 30-37.5 hours
**Feature Flag**: `enablePostMVP` (enabled in dev, disabled in production)
**Technical Plan**: `docs/technical-plans/site-enhancements/acr_cat2_tech_plan.txt`

### Feature 2.1: General UI Updates (1.5h)

**Quick wins to improve user experience**

- [ ] Add year ranges to vehicle applications in public search results
- [ ] Create footer component with logo, contact info, and links
- [ ] Add WhatsApp and email clickable links to footer
- [ ] Make header logo clickable (navigate to home)
- [ ] Update layout.tsx to include footer

**Files to modify:**
- `components/public/search/vehicle-applications-list.tsx`
- `components/public/search/search-results.tsx`
- `components/layout/footer.tsx` (new)
- `components/layout/header.tsx`
- `app/layout.tsx`

---

### Feature 2.2: Persist Filters & Search State (4-5h)

**URL-based state management for better UX**

- [ ] Implement URL state management for admin parts page
- [ ] Add debounced search input updates
- [ ] Implement pagination with URL state
- [ ] Add filter controls (part_type, position, sort)
- [ ] Test browser back/forward navigation
- [ ] Verify bookmarkable URLs work
- [ ] Apply same pattern to public search page (if needed)

**Files to create/modify:**
- `app/admin/parts/page.tsx` (update with URL state)
- Install: `use-debounce` package

**Benefits:**
- Browser back/forward works naturally
- Bookmarkable searches
- Shareable URLs with exact filters
- Page refresh preserves state

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

### Latest Session: October 10, 2025

**Focus**: Dev branch setup, feature flags, and Category 2 planning
**Completed**:

- ✅ Created `dev` branch for development work
- ✅ Pushed `dev` branch to GitHub
- ✅ Implemented simple feature flag system (`src/lib/feature-flags.ts`)
- ✅ Added `enablePostMVP` flag (true in dev, false in production)
- ✅ Cleaned up environment files (removed 13 unused variables)
- ✅ Added `.env.test` to `.gitignore`
- ✅ Removed `.env.test` from git tracking
- ✅ Audited all environment variables for actual usage
- ✅ Updated TASKS.md with Category 2 features and task breakdown

**Key Changes**:

- `src/lib/feature-flags.ts` - Simple feature flag system with `enablePostMVP`
- `.env` - Cleaned to 4 essential variables (production database)
- `.env.test` - Cleaned to 4 essential variables (dev/test database)
- `.gitignore` - Added `.env.test` to prevent tracking
- `docs/TASKS.md` - Added Category 2 feature breakdown with detailed tasks
- Git: Created and pushed `dev` branch

**Vercel Setup (Next Steps)**:

In Vercel dashboard, add these environment variables:
- **Production**: `NEXT_PUBLIC_ENABLE_POST_MVP=false` + prod database credentials
- **Preview (dev branch)**: `NEXT_PUBLIC_ENABLE_POST_MVP=true` + test database credentials

**Workflow**:
- Work on `dev` branch → preview deployment with test DB + post-MVP features enabled
- Merge to `main` → production deployment with prod DB + post-MVP features disabled

**Next Session Priorities**:

1. Begin Category 2 Feature 2.1: General UI Updates (1.5h)
2. Add year ranges to vehicle applications display
3. Create footer component with contact information
4. Make header logo clickable
5. Move to Feature 2.2: Persist Filters & Search State

**Current State**: Development workflow established with dev branch and feature flags. Environment variables cleaned and organized. Ready to begin Category 2 implementation (30-37.5h of UX improvements). All AI integration planning from previous session preserved for Phase 7.

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
