# TASKS.md - ACR Automotive Development Tasks

_Last Updated: October 15, 2025_

## 🎯 Current Sprint Status

**Project Phase**: ✅ **Category 2: User Experience Improvements** - COMPLETE!

**Overall Progress**:

- ✅ **Phase 1**: Database foundation and Excel import (Complete)
- ✅ **Phase 2**: Admin CRUD interface (Complete)
- ✅ **Phase 3**: Public search interface (Complete)
- ✅ **Phase 4**: Production deployment and optimization (Complete)
- ✅ **Phase 5**: Dev branch setup and feature flags (Complete)
- ✅ **Phase 6**: Category 2 site enhancements - **ALL FEATURES COMPLETE** ✨
- 📋 **Phase 7**: AI Integration (Planned - documentation complete)

## 📊 Production Status

- ✅ **Production Database**: Fully populated (865+ parts, 7,530+ cross-references, 2,304+ vehicle applications)
- ✅ **Vercel Deployment**: Live and operational
- ✅ **Admin Interface**: Complete parts management with CRUD operations + Settings Management
- ✅ **Public Search**: Vehicle search and SKU lookup functional
- ✅ **Mobile Responsive**: Tablet-optimized for parts counter staff
- ✅ **Performance**: Sub-300ms search response times maintained
- ✅ **Settings Management**: Dynamic footer, logo/favicon/banner uploads

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

### Latest Session: October 15, 2025 (Session 7)

**Focus**: Contact FABs and Footer Enhancements

**Completed**:

- ✅ **ContactFabs Component (Desktop-Only)**
  - Created floating action buttons for WhatsApp and Email
  - Positioned on left side with synchronized pulsing animations (2s)
  - Custom `ping-small` animation with limited radius (1.5x scale)
  - Dynamic content from site settings API (phone/email)
  - Hidden on mobile (`hidden md:flex`) to avoid UI clutter
  - Full i18n support for tooltips and ARIA labels

- ✅ **Footer Enhancements**
  - Added WhatsApp, Email, and Google Maps contact icon buttons
  - Icon + label design for clarity ("WhatsApp", "Email", "Ubicación")
  - WhatsApp link opens `wa.me` with formatted phone number
  - Email link opens mailto
  - Address link opens Google Maps search in new tab
  - Centered vertical layout on all screen sizes
  - Responsive horizontal padding (px-6/12/16)
  - Full i18n support (4 new translation keys)

- ✅ **Public Header Cleanup**
  - Removed "Product Catalogue" title for cleaner look
  - Admin and Settings links only visible when authenticated
  - Language toggle removed from header (accessible in Settings page)
  - Authentication check via `sessionStorage.getItem("admin-authenticated")`

**Files Created (1)**:
- `src/components/layout/ContactFabs.tsx`

**Files Modified (7)**:
- `src/components/layout/Footer.tsx` - Social-style contact icon buttons
- `src/components/public/layout/PublicHeader.tsx` - Auth-based visibility
- `src/components/acr/Header.tsx` - Made title optional
- `src/app/layout.tsx` - Added ContactFabs to root layout
- `src/app/globals.css` - Custom ping-small animation
- `src/lib/i18n/translation-keys.ts` - 9 new keys (FABs + Footer)
- `src/lib/i18n/translations.ts` - English + Spanish translations

**Git Commits**:
1. ✅ `feat: Add ContactFabs and enhance Footer with dynamic contact links`

**Next Priorities**:
1. Test ContactFabs and Footer on production with real settings data
2. Consider starting Phase 7: AI Integration (6-8 week project)
3. Review ENHANCEMENTS.md for next quick wins

---

### Previous Session: October 15, 2025 (Session 6)

**Focus**: Complete Feature 2.4 - Website Settings Management

**Completed**:

- ✅ **Database Schema Simplification**
  - Created idempotent migration `003_add_site_settings.sql`
  - Only 2 settings tables: contact_info (email, phone, whatsapp, address) and branding (company_name, logo_url, favicon_url, banner_url)
  - Removed SEO, banners, business hours, color settings (simplified for MVP)
  - Created storage bucket `acr-site-assets` with RLS policies

- ✅ **Settings API Implementation**
  - Built GET/PUT `/api/admin/settings` with Zod validation
  - Built POST `/api/admin/settings/upload-asset` for file uploads
  - Built GET `/api/public/settings` for footer consumption
  - Created TypeScript types in `lib/types/settings.ts`
  - Created schemas in `lib/schemas/admin.ts`

- ✅ **Admin Settings UI**
  - Created `/admin/settings` page with `withAdminAuth`
  - Built `SettingsPageContent` with single-page layout (no tabs)
  - Built `ContactInfoSettings` form with validation
  - Built `BrandingSettings` with asset upload previews
  - Moved language toggle and logout buttons to settings page
  - Added real-time asset preview on upload

- ✅ **Public Integration**
  - Created `SettingsContext` provider with React Query (5-min cache)
  - Updated `Footer` component to use dynamic settings from API
  - Fixed cache invalidation (invalidates both admin and public query keys)
  - Added `SettingsProvider` to app providers

- ✅ **UX Improvements & i18n**
  - Removed logout button from AdminHeader
  - Removed language toggle from AdminHeader
  - Made Header language toggle optional (props-based)
  - Updated `AcrLanguageToggle` component with better UX (ACR red for active)
  - Settings moved to rightmost position in header
  - Added 58 new translation keys (English + Spanish)
  - Applied translations to all settings page components

**Files Created (11)**:
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

**Files Modified (10)**:
- `lib/schemas/admin.ts` - Added settings schemas
- `components/admin/layout/AdminHeader.tsx` - Removed logout/language, reordered actions
- `components/acr/Header.tsx` - Made language toggle optional
- `components/acr/LanguageToggle.tsx` - Improved UX with unified red active state
- `components/layout/Footer.tsx` - Uses dynamic settings from context
- `app/providers.tsx` - Added SettingsProvider
- `lib/i18n/translations.ts` - Added 58 new translation keys
- `lib/i18n/translation-keys.ts` - Added type definitions
- `src/lib/supabase/types.ts` - Updated for new tables
- `components/admin/parts/ImageGalleryEditor.tsx` - Fixed duplicate props

**Git Commits**:
1. ✅ `feat: Complete Feature 2.4 - Website Settings Management`

**Feature Status**:
- ✅ **Feature 2.4 COMPLETE** - Website Settings Management (migration ready, UI complete, i18n done)
- ✅ **Category 2 COMPLETE** - All 4 features done! (30h actual vs 30-37.5h estimated)

**Next Priorities**:
1. Run migration `003_add_site_settings.sql` in Supabase production
2. Test end-to-end: Upload assets, save settings, verify footer updates
3. Consider starting Phase 7: AI Integration (6-8 week project)

---

### Previous Session: October 13, 2025 (Session 5)

**Focus**: Keyboard accessibility improvements and Feature 2.3 finalization

**Completed**:
- ✅ Fixed tab state persistence bugs
- ✅ Implemented comprehensive keyboard accessibility (WCAG 2.1 AA)
- ✅ Standardized focus states (black rings, ring-2 width)
- ✅ Feature 2.3 Complete with full internationalization

**Git Commits**:
1. ✅ `feat: Complete Feature 2.3 - Multiple Images Per Part`
2. ✅ `feat: Comprehensive keyboard accessibility improvements`

---

## 🚀 Active Development Areas

### ✅ Category 2: User Experience Improvements (COMPLETE!)

All 4 features complete:
- ✅ Feature 2.1: General UI Updates
- ✅ Feature 2.2: Persist Filters & Search State
- ✅ Feature 2.3: Multiple Images Per Part
- ✅ Feature 2.4: Website Settings Management

### 📋 Next Phase: AI Integration (Phase 7)

**Planning Status**: ✅ Documentation Complete (October 8, 2025)

See detailed AI Integration plan above with:
- Intent Classification System (6 valid, 3 invalid intent types)
- AI Response Generation (progressive disclosure, filter chips)
- Technical Foundation (pgvector, embeddings, hybrid search)
- Frontend Integration (universal search, voice input)
- 6-8 week implementation timeline
- $7-10/month estimated cost

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