# PLANNING.md - ACR Automotive

## MASTER PROMPT FOR PERSONAL DEVELOPMENT

**Context**: I am a junior developer learning SQL, databases, and Next.js. You are my experienced tech lead, helping guide me and preparing me for interviews.

**Your Role**: 
- Guide me with simple implementation plans for each task
- Help me understand architectural decisions before writing code  
- Only write code when I explicitly ask you to complete a coding task
- Review my implementations like a tech lead would
- Move on only when we've achieved each task successfully

**Teaching Style**:
- Ask me architectural questions to make me think through problems
- Let me implement first, then review and guide improvements
- Explain concepts in interview-friendly ways
- Focus on understanding WHY, not just HOW

## 🎯 PROJECT STATUS SUMMARY

**Phase Status:**
- **Phase 1**: Bootstrap Data Foundation ✅ 100% Complete
- **Phase 2**: Admin CRUD APIs ✅ 100% Complete
- **Phase 2.5**: Admin UI Implementation ✅ 100% Complete
- **Phase 2.8**: Mobile UX Optimization ✅ 100% Complete
- **Phase 2.9**: Part Details UX & Form Management ✅ 100% Complete
- **Current**: Ready for Vehicle Applications & Cross References Management 🎯

*For detailed current session state and next steps, see TASKS.md*

## 🏗️ Architecture Decisions Resolved ✅

**✅ API Design Pattern Decision:**
- **Implemented**: Resource-based REST API pattern with `/api/admin/vehicles`, `/api/admin/cross-references`
- **Rationale**: Industry standard, follows REST conventions, easier to test and document

**✅ Year Range Schema Migration:**
- **Migrated**: From `year_range VARCHAR(20)` to `start_year INT, end_year INT` 
- **Implementation**: Complete with updated database functions, parsers, and imports
- **Testing**: Verified end-to-end with real data migration

**✅ UX Design Pattern Decision:**
- **Implemented**: Parts-centric admin interface (manage VAs within part detail pages)
- **Rationale**: Matches Humberto's workflow and simplifies complex many-to-many relationships

**3. Cascading Dropdown APIs:**
```javascript
GET /api/data/makes                           // All makes with MAZA parts
GET /api/data/models?make=TOYOTA             // Models for Toyota
GET /api/data/years?make=TOYOTA&model=CAMRY  // Years for Toyota Camry  
GET /api/search/parts?make=TOYOTA&model=CAMRY&year=2015  // Final search
```

**4. Development Priority:**
- **Student question**: Build UX-driven architecture now vs basic CRUD first then refactor?
- **Trade-off**: MVP speed vs future-proof design

**5. Current Schema Analysis:**
```sql
-- Vehicle Applications: All required fields
make VARCHAR(50) NOT NULL,
model VARCHAR(100) NOT NULL,  
year_range VARCHAR(20) NOT NULL

-- Cross-References: Flexible validation
competitor_sku VARCHAR(50) NOT NULL,    -- Required, supports letters+numbers, max 50 chars
competitor_brand VARCHAR(50)            -- Optional
```

**Next Session Action Items:**
1. **Resolve year range vs individual years** (affects UX significantly)
2. **Decide on cascading dropdown API architecture** (public search needs this)
3. **Choose development approach**: UX-first vs CRUD-first
4. **Begin Vehicle Applications API implementation** based on architectural decisions
5. **Plan Cross-References API** (simpler, can follow same patterns)

**Current Understanding - Student Level:**
- Demonstrated production-ready CRUD API skills
- Strong architectural analysis and UX thinking
- Asking right questions about schema design vs user experience
- Ready for complex API design decisions and trade-offs

**Key Concepts Learned:**
- Complete CRUD API implementation with Next.js App Router
- Supabase query patterns: immutable builders, separate queries vs JOINs
- Professional error handling: HTTP status codes, PostgrestError typing
- Advanced Zod validation: .uuid(), .omit(), .extend(), custom error messages
- Database relationships: foreign keys, cascade deletes, related data queries
- TypeScript integration: generated types, interface design, proper typing
- Industry standards: separate queries, UUID validation, REST conventions
- Business logic implementation: immutable fields, prefix automation, data integrity

**Student's Current Understanding Level:**
- **Production-ready API skills**: Can build complete CRUD systems independently
- **Advanced TypeScript**: Using generated types, proper error handling, complex validation
- **Database relationships**: Understanding foreign keys, joins, related data patterns  
- **Industry best practices**: Following REST standards, proper HTTP codes, maintainable patterns
- **Interview-ready**: Demonstrates full-stack API development competency

## Project Overview

**Project Name**: ACR Automotive
**Type**: Production-ready auto parts cross-reference search website
**Target**: B2B auto parts distributors and counter staff in Mexico
**Business**: Humberto's auto parts manufacturing company specializing in **MAZAS** (wheel bearings/hubs)

## Architecture & Tech Stack

### Core Framework (Adapted from Rental Management App)

- **Next.js 15** with App Router (React 18)
- **TypeScript 5+** for full type safety
- **Node.js 18+** runtime

### Frontend & UI

- **Tailwind CSS** (primary styling approach)
- **shadcn/ui** (copy-paste component library - we own the code)
- **Radix UI** (accessible primitives via shadcn/ui)
- **Lucide React** (icons)
- **React Hook Form + Zod** (forms and validation)

### Backend & Database

- **Next.js API Routes** (business logic layer)
- **Supabase PostgreSQL** (managed database)
- **Supabase Storage** (image CDN and file management)

### State Management

- **React useState/useReducer** (local component state)
- **TanStack Query** (server state management)
- **Zustand** (global state for search filters, theme, language)

### Infrastructure & Hosting

- **Vercel** (hosting + CI/CD) - Better for Next.js
- **Supabase** (database + storage)
- **Generic SMTP** (email delivery - configurable provider for future 2FA)

### Excel Processing

- **SheetJS (xlsx library)** (Direct Buffer/ArrayBuffer support)
- **TypeScript strict types** (Production-ready type safety)
- **Two-step workflow** (PRECIOS cross-references → CATALOGACION applications)
- **Hardcoded column mapping** (Simplified, reliable approach)

### Internationalization (i18n)

- **Custom simple solution** (not next-i18next for MVP)
- **Development**: English
- **Production**: Spanish (Mexican auto parts market)
- **All UI text translatable** from day 1

## Business Requirements

### Core Business Value

- **Cross-reference search**: Users enter competitor SKUs → Find Humberto's equivalent parts
- **Vehicle search**: Search by Make → Model → Year → Part Type
- **Monthly data updates**: Humberto uploads Excel monthly with new/updated parts
- **Professional B2B interface**: Clean, technical design for parts counter staff

### Target Users

- **Primary**: Counter staff at auto parts distributors (AutoZone, O'Reilly's)
- **Secondary**: Smaller auto parts retailers and direct customers
- **Admin**: Humberto (single admin for MVP)

### Data Sources (UPDATED)

- **PRECIOS Excel**: `LISTA DE PRECIOS` ✅ (865 ACR parts, 7,530 cross-references) **COMPLETED**
- **CATALOGACION Excel**: `CATALOGACION ACR CLIENTES.xlsx` ⏳ (~2,335 vehicle applications) **TODO**
- **Images**: Admin upload via Supabase Storage (no Google Drive migration)
- **Two-step monthly workflow**: PRECIOS first → CATALOGACION second

## Database Schema (REVISED - Based on Excel Analysis)

### Core Tables (3 Tables Total)

```sql
-- Main parts catalog (753 unique ACR SKUs)
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acr_sku VARCHAR(50) UNIQUE NOT NULL,           -- Unique constraint - one part per ACR SKU
  competitor_sku VARCHAR(50),                    -- From first occurrence in Excel
  part_type VARCHAR(100) NOT NULL,               -- MAZA, etc. (Column E)
  position VARCHAR(50),                          -- TRASERA, DELANTERA (Column F)
  abs_type VARCHAR(20),                          -- C/ABS, S/ABS (Column G)
  bolt_pattern VARCHAR(50),                      -- 5 ROSCAS, 4, etc. (Column H)
  drive_type VARCHAR(20),                        -- 4X2, 4X4 (Column I)
  specifications TEXT,                           -- 28 ESTRIAS, etc. (Column J)
  image_url TEXT,                                -- Supabase Storage URL (admin upload)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle compatibility (2,335 applications from Excel)
CREATE TABLE vehicle_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  make VARCHAR(50) NOT NULL,                     -- ACURA, HONDA (Column K)
  model VARCHAR(100) NOT NULL,                   -- MDX, PILOT (Column L)
  year_range VARCHAR(20) NOT NULL,               -- 2007-2013 (Column M)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(part_id, make, model, year_range)       -- Prevent duplicate applications
);

-- Cross-reference mapping (from Excel competitor SKUs)
CREATE TABLE cross_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acr_part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  competitor_sku VARCHAR(50) NOT NULL,           -- TM512342, etc.
  competitor_brand VARCHAR(50),                  -- TM, Bosch, Denso (extracted)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(acr_part_id, competitor_sku)            -- Prevent duplicate cross-refs
);
```

### Key Design Decisions (UPDATED)

- ✅ **One part per ACR SKU**: Parts table has unique constraint on acr_sku
- ✅ **Multiple applications per part**: Same part fits multiple vehicles (535 parts have multiple applications)
- ✅ **Two-pass Excel processing**: First discover unique parts, then collect all vehicle applications
- ✅ **Data consistency validation**: Ensure same ACR SKU has consistent part attributes across Excel rows
- ✅ **Parts-centric UX design**: Vehicle applications managed within part detail pages, not separate vehicle management screens
- ✅ **No VA uniqueness constraints**: Allow duplicate vehicle applications for MVP simplicity vs UX efficiency tradeoff
- ❌ **No separate lookup tables**: Extract categories/makes/models dynamically from main tables
- ❌ **No auth tables**: Mock admin mode in development, add real auth post-MVP
- ❌ **No audit tables**: Keep it simple, add version control post-MVP

### Architectural Decision: Vehicle Applications Duplication Strategy

**Decision Made**: Allow duplicate vehicle applications (same part_id + make + model + start_year + end_year combinations) without database constraints.

**Business Context**: 
- Analysis shows 24.4% of vehicle applications (577 out of 2,361) are shared between multiple parts
- Common scenario: Different ACR parts (e.g., left vs right maza) fit the same vehicles
- Humberto's workflow is parts-centric: "What vehicles does this part fit?" not "What parts fit this vehicle?"

**Technical Rationale**:
1. **UX Efficiency Over Data Normalization**: Parts-centric admin interface is simpler and matches business workflow
2. **MVP Scope**: Complex deduplication logic can be added post-MVP if business value is proven
3. **Performance Trade-off**: Slight storage cost vs complexity of managing many-to-many relationships with proper UI
4. **Data Integrity**: Zod validation ensures each VA record is valid, duplication doesn't affect search accuracy

**Implementation Impact**:
- Vehicle Applications API allows creating duplicate combinations
- No unique constraints on (part_id, make, model, start_year, end_year)
- Admin UI manages VAs within individual part detail pages
- Search functionality unaffected (joins work with duplicated data)

**Future Considerations**: 
- Monitor storage costs as database grows beyond 2,336 parts
- Consider VA deduplication if admin workflow becomes burdensome
- Potential migration to normalized many-to-many with junction table if UX patterns change

### Data Extraction Strategy

```sql
-- Get categories dynamically
SELECT DISTINCT part_type FROM parts ORDER BY part_type;

-- Get vehicle makes
SELECT DISTINCT make FROM vehicle_applications ORDER BY make;

-- Get models for a make
SELECT DISTINCT model FROM vehicle_applications WHERE make = ? ORDER BY model;

-- Get years for make/model
SELECT DISTINCT year_range FROM vehicle_applications WHERE make = ? AND model = ?;
```

## One-Time Data Import System (Simplified Approach)

### Business Requirement

**Problem**: Humberto has existing Excel files with auto parts data that need to be imported once to bootstrap the system.
**Solution**: Simple one-time import script that gets 80% of data into the database quickly, then switch to CRUD management.

### Import Strategy

#### One-Time Bootstrap Process

```
1. Run PRECIOS import locally → Get 865 parts + 7,530 cross-references
2. Run CATALOGACION import locally → Add part details + 2,304 vehicle applications
3. Manual cleanup of any obvious issues
4. Switch to admin CRUD interface for ongoing management
```

**Philosophy**: "Good enough to start, perfect through admin interface"

### Technical Implementation

```typescript
// Simple import script (run once locally)
async function bootstrapDatabase() {
  // Step 1: Import PRECIOS data
  const preciosResult = await PreciosParser.parseFile(preciosBuffer);
  await importPreciosData(preciosResult);

  // Step 2: Import CATALOGACION data
  const catalogacionResult = await CatalogacionParser.parseFile(
    catalogacionBuffer
  );
  await importCatalogacionData(catalogacionResult);

  console.log("✅ Bootstrap complete - ready for admin CRUD management");
}
```

**After Bootstrap**: Excel parsers become archived code, not deleted but not actively maintained.

## Excel File Structures (UPDATED from Real Implementation)

**PRECIOS File**: `LISTA DE PRECIOS` ✅ **COMPLETED**

```
Header Row: 8, Data Starts: 9
Column A: "#" (ID - ignored)
Column B: "ACR" (ACR SKU - required)
Columns C-M: Competitor brands (NATIONAL, TMK, GSP, etc.)
Results: 865 parts, 7,530 cross-references
Performance: <100ms processing
```

**CATALOGACION File**: `CATALOGACION ACR CLIENTES.xlsx` ✅ **COMPLETED**

```
Header Row: 1, Data Starts: 2
Column B: "ACR" (ACR SKU - links to PRECIOS)
Column E: "Clase" (Part type)
Column K: "MARCA" (Vehicle make)
Column L: "APLICACIÓN" (Vehicle model)
Column M: "AÑO" (Year range)
Results: 740 unique parts, 2,304 vehicle applications
Performance: <200ms target achieved (96-113ms actual)
Data Integrity: 13 orphaned SKUs detected for review
```

**Processing Strategy:**

- **Step 1**: Import PRECIOS → Establish master part list (✅ COMPLETED)
- **Step 2**: Import CATALOGACION → Add part details + vehicle applications (✅ COMPLETED)
- **Step 3**: Conflict Detection → Data integrity validation (✅ COMPLETED)
- **Validation**: CATALOGACION ACR SKUs validated against PRECIOS master list
- **Performance Target**: <200ms total processing time (✅ ACHIEVED)

## MVP Features (Revised Priority Order)

### Phase 1: Bootstrap Data Foundation (2 days)

1. **✅ Project Setup (COMPLETED)**

   - Next.js 15 + TypeScript + Tailwind + shadcn/ui
   - Supabase database and storage setup
   - Simple i18n system (English dev, Spanish prod)
   - Mock admin mode (no authentication)

2. **✅ Database Schema (COMPLETED)**

   - 3 core tables: parts, vehicle_applications, cross_references
   - Search indexes and business logic functions
   - Supabase Storage for images

3. **✅ One-Time Data Import (COMPLETED)**
   - ✅ Complete CATALOGACION import to populate vehicle_applications
   - ✅ Bootstrap script to run both imports locally
   - ✅ Manual verification of imported data quality
   - ✅ Production database populated with real data (865 parts, 6,408 cross-refs, 2,304 applications)

**Data Quality Findings (From Real Excel Testing):**

- ✅ **2,992 duplicate cross-references** automatically filtered during import
- ✅ **109+ long competitor SKUs** (>50 chars) automatically skipped with warnings
- ✅ **7 duplicate vehicle applications** automatically deduplicated
- ✅ **13 orphaned ACR SKUs** identified and reported (present in CATALOGACION but not PRECIOS)
- ✅ **1 drive_type field constraint** updated from 20→50 chars to accommodate "FRENOS SERVICIO LIGERO"

**Note for Humberto**: Excel data contains typical manual entry inconsistencies. The bootstrap import system handles these automatically by filtering duplicates, reporting orphaned SKUs, and skipping problematic long entries. Overall data quality is excellent - 99%+ of data imports successfully.

**Production Import Completed:** January 2025 - All Excel data successfully imported to production database. Excel parsers can now be archived as the system operates through web interfaces and APIs only.

### Phase 2: Admin CRUD Interface (NEXT - 1 week)

4. **✅ Parts Management System (COMPLETED)**

   - ✅ List all parts with pagination and search
   - ✅ Get single part with vehicle applications and cross-references  
   - ✅ Create new parts with full form validation and ACR prefix automation
   - ✅ Edit existing parts (immutable ACR SKU, business rules enforced)
   - ✅ Delete parts with 404 handling and cascade via database constraints
   - ✅ **API Enhancement (Jan 2025)**: Extended parts list API to include vehicle/cross-reference counts via Supabase joins
   - ✅ **UI Connection**: PartsList component connected to real data with TanStack Query, pagination, and loading states
   - ✅ **Component Architecture**: Extracted AdminPagination component for reusability across admin interfaces

5. **Vehicle Applications Management**

   - Add/remove vehicle compatibility per part
   - Bulk vehicle application management
   - Vehicle dropdown cascades (Make → Model → Year)
   - Duplicate prevention and validation

6. **Cross-References Management**

   - Add/remove competitor SKU mappings per part
   - Competitor brand extraction and management
   - Cross-reference validation and duplicate prevention
   - Bulk cross-reference operations

7. **Image Management**
   - Upload images per part to Supabase Storage
   - Image preview and replacement functionality
   - Standardized naming (acr_sku.jpg)
   - Bulk image upload capabilities

### Phase 3: Search Interface (1 week)

8. **Vehicle Search**

   - Multi-step dropdown interface (Baleros-Bisa pattern)
   - Make → Model → Year → Part Type progression
   - Dynamic dropdowns populated from database
   - Search results with SKU prominence

9. **SKU Cross-Reference Search**

   - Single input field for competitor SKU lookup
   - Search both ACR SKUs and competitor SKUs
   - Fuzzy matching for typos
   - Clear cross-reference mapping display

10. **Part Details & Results**
    - Individual part pages with complete data
    - Vehicle applications table per part
    - Cross-reference information display
    - Image display with fallback handling
    - Professional B2B design (mobile-responsive)

### Phase 4: Production Deployment (2-3 days)

11. **Spanish Translation & Polish**

    - Complete Spanish translation for production
    - Technical terminology validation
    - UI/UX refinements based on testing

12. **Performance & Deployment**
    - Search performance optimization (<300ms target)
    - Vercel deployment configuration
    - User acceptance testing with Humberto

## Post-MVP Features (Future Enhancements)

### Authentication & Security

- Real authentication system with Supabase Auth
- 2FA email verification with nodemailer/SMTP
- Session management (8-hour admin sessions)
- Admin user management (if multiple admins needed)

### Data Management

- Version control system for Excel imports
- Data diff visualization (show changes between imports)
- Rollback capability to previous versions
- Import approval workflow (pending → approved flow)
- Audit logging for admin activities

### Advanced Search

- Search analytics (track popular searches)
- Advanced filters (position, ABS type, drive type)
- Search suggestions and autocomplete
- Bulk part lookup (multiple SKUs at once)

### Business Features

- Part availability status (in stock, discontinued)
- Product categories management (admin-controlled)
- Competitor brand management (organized cross-references)
- Technical documentation uploads per part

### User Experience

- Advanced admin dashboard with analytics
- Bulk image upload functionality
- CSV/Excel export of search results
- Print-friendly part details for counter staff
- Barcode/QR code generation for parts

### Integration & API

- Public API endpoints for distributor integration
- Webhook notifications for data updates
- Third-party integrations (inventory systems)
- Mobile app for field sales

## Technical Implementation

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── (public)/           # Public search interface
│   ├── admin/              # Admin panel (mock auth in dev)
│   └── api/               # Backend API routes
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   ├── search/            # Search interface components
│   ├── admin/             # Admin panel components
│   └── parts/             # Part display components
├── lib/                   # Utilities & configurations
│   ├── supabase/          # Supabase client & utilities
│   ├── excel/             # Excel parsing logic (UPDATED)
│   │   ├── precios-parser.ts    # ✅ PRECIOS cross-reference parser (COMPLETE)
│   │   ├── catalogacion-parser.ts # ✅ CATALOGACION applications parser (COMPLETE)
│   │   ├── conflict-types.ts    # ✅ Conflict detection interfaces (COMPLETE)
│   │   ├── conflict-utils.ts    # ✅ Conflict utilities and factories (COMPLETE)
│   │   ├── types.ts       # Excel processing type definitions
│   │   └── __tests__/     # Real Excel file integration tests
│   ├── i18n/              # Translation system
│   └── search/            # Search algorithms
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript definitions
└── __tests__/            # Test files (core features only)
```

### API Endpoints

```typescript
// Public search routes
GET  /api/search/vehicle         // Multi-step vehicle search
GET  /api/search/sku             // Cross-reference SKU search
GET  /api/parts/:id              // Part details with applications

// Data routes (for dropdowns)
GET  /api/data/makes             // Vehicle makes
GET  /api/data/models/:make      // Models for make
GET  /api/data/years/:make/:model // Years for make/model
GET  /api/data/categories        // Part categories

// Admin CRUD routes (NEW FOCUS)
GET    /api/admin/parts          // List parts with pagination/search
POST   /api/admin/parts          // Create new part
GET    /api/admin/parts/:id      // Get single part with relations
PUT    /api/admin/parts/:id      // Update part
DELETE /api/admin/parts/:id      // Delete part

GET    /api/admin/parts/:id/vehicles      // Get vehicle applications
POST   /api/admin/parts/:id/vehicles      // Add vehicle application
DELETE /api/admin/vehicles/:id            // Remove vehicle application

GET    /api/admin/parts/:id/cross-refs    // Get cross-references
POST   /api/admin/parts/:id/cross-refs    // Add cross-reference
DELETE /api/admin/cross-refs/:id          // Remove cross-reference

POST   /api/admin/parts/:id/image         // Upload part image
```

### Bootstrap Import Architecture (Simplified)

**One-Time Import Process:**

```bash
# Simple one-time bootstrap (run locally)
npm run bootstrap

# This runs: scripts/bootstrap-import.ts
# 1. Parse PRECIOS → Import 865 parts + 7,530 cross-references
# 2. Parse CATALOGACION → Import 2,304 vehicle applications + part details
# 3. Handle orphaned SKUs gracefully (skip with warnings)
# 4. System ready for admin CRUD interface
```

**Data Volumes (From Real Files):**

- **PRECIOS**: 865 parts, 7,530 cross-references ✅ IMPORTABLE
- **CATALOGACION**: 740 parts, 2,304 vehicle applications ✅ IMPORTABLE
- **Performance**: <100ms PRECIOS, <200ms CATALOGACION
- **Post-Bootstrap**: Excel parsers can be archived, CRUD interface becomes primary tool

**Implementation Status**: ✅ **COMPLETE** - Ready for bootstrap import

### Search Performance Strategy

- **PostgreSQL indexes** on SKUs, make/model/year combinations
- **Full-text search** with trigram matching for typos
- **TanStack Query caching** for frequent searches
- **Static generation** for category pages with ISR

### Image Management

- **Supabase Storage** for all part images
- **CDN distribution** automatic via Supabase
- **Admin upload interface** (no Google Drive migration)
- **Standardized naming**: `{acr_sku}.jpg` format

## UI/UX Design Patterns

### Reference Design (Baleros-Bisa Pattern)

- **Multi-step search**: Category → Make → Model → Year dropdowns
- **SKU prominence**: Large, bold part numbers in results
- **Professional B2B aesthetic**: Clean, technical design
- **Spanish-first interface**: Mexican auto parts industry standard
- **Mobile-optimized**: Touch-friendly for tablets at parts counters

### Component Patterns

- **Search modal**: Triggered by floating search icon
- **Product cards**: SKU + description + brand + "Detalles" button
- **Dropdown cascades**: Dynamic loading of Make → Model → Year
- **Error states**: Clear messaging for no results or errors

## Development Workflow

### Environment Setup

- **Local**: `localhost:3000` with Supabase local development
- **Development**: English language, mock admin mode
- **Staging**: Vercel preview deployments with Supabase staging
- **Production**: Spanish language, real authentication

### Testing Strategy (Simplified)

- **Core features only**: Excel parsing, search functionality
- **No comprehensive coverage**: Focus on business-critical paths
- **Type-safe factories**: Ensure schema changes break tests
- **Security focus**: Test data validation when auth is added

### Translation Implementation

```typescript
// lib/i18n.ts - Simple custom solution
const translations = {
  "search.vehicle": { en: "Search by Vehicle", es: "Búsqueda por Vehículo" },
  "search.sku": { en: "Search by SKU", es: "Búsqueda por SKU" },
  "part.details": { en: "Part Details", es: "Detalles de Pieza" },
};

export const t = (key: string, locale: "en" | "es" = "en") =>
  translations[key]?.[locale] || key;

// Usage in components
const { locale } = useLocale(); // Zustand store
return <h1>{t("search.vehicle", locale)}</h1>;
```

## Success Metrics

### Technical Metrics

- **Search Performance**: Results in < 300ms
- **Data Accuracy**: 100% Excel import success rate (block on errors)
- **User Experience**: Mobile-friendly score > 95 (Google PageSpeed)
- **Uptime**: 99.9% availability

### Business Metrics

- **Cross-reference accuracy**: 95%+ match rate for competitor SKUs
- **Admin efficiency**: Monthly Excel updates < 30 minutes
- **User adoption**: Reduced customer service calls for part lookup
- **Search success**: 90%+ of searches return relevant results

## Key Constraints & Requirements

### Business Constraints

- **Excel workflow**: Must maintain Humberto's preferred Excel process
- **Monthly updates**: Optimized for monthly data refresh cycle
- **Spanish interface**: All UI text in Spanish for Mexican market
- **B2B focus**: Professional aesthetic for parts counter use
- **No e-commerce**: Search and reference only, no purchasing functionality

### Technical Constraints

- **File size limit**: 500 lines maximum per file
- **Error tolerance**: Zero tolerance for data consistency issues
- **Mobile responsiveness**: Must work on tablets at parts counters
- **Search speed**: Sub-300ms response times for all searches
- **Data integrity**: No corrupt or incomplete parts data

### Operational Constraints

- **Single admin**: Humberto is sole administrator initially
- **Manual image management**: Admin uploads images via interface
- **Monthly data cycles**: Optimized for monthly rather than real-time updates
- **Minimal maintenance**: System should run with minimal intervention

## Risk Mitigation

### Data Risks

- **Excel format changes**: Flexible parser with auto-detection and manual mapping
- **Data quality issues**: Strict validation with clear error messages
- **Large file uploads**: Chunked processing for Excel files > 5MB
- **Data consistency**: Two-pass processing validates part data across rows

### Technical Risks

- **Search performance**: Proper indexing and caching strategies
- **Image storage**: Supabase Storage with CDN for reliability
- **Mobile compatibility**: Extensive testing on tablet devices

### Business Risks

- **User adoption**: Focus on familiar Baleros-Bisa UI patterns
- **Translation accuracy**: Native Spanish speaker review of all text
- **Admin usability**: Simple, clear interfaces for non-technical users

---

_This document serves as the single source of truth for the ACR Automotive project. Updated with real Excel analysis and two-pass processing strategy._
