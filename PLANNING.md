# PLANNING.md - ACR Automotive

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
- ❌ **No separate lookup tables**: Extract categories/makes/models dynamically from main tables
- ❌ **No auth tables**: Mock admin mode in development, add real auth post-MVP
- ❌ **No audit tables**: Keep it simple, add version control post-MVP

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

## Conflict Detection System (NEW - Data Integrity Focus)

### Business Requirement

**Problem**: Excel files may contain data inconsistencies that could corrupt the database or confuse users.
**Solution**: Comprehensive conflict detection with clear admin reporting before any data import.

### Conflict Types & Severity

#### 🚨 **BLOCKING ERRORS** (Must fix before import)
- **Duplicate ACR SKUs with conflicting data** - Same SKU with different part specifications
- **Invalid data formats** - Malformed SKUs, dates, or required fields
- **Database constraint violations** - Data that would break foreign key or unique constraints

#### ⚠️ **WARNINGS** (Import proceeds, admin reviews)
- **Orphaned applications** - CATALOGACION references ACR SKUs not in PRECIOS (13 found in test data)
- **Missing cross-references** - PRECIOS parts without any vehicle applications
- **Data quality issues** - Unusual patterns that may indicate errors

#### ℹ️ **INFO** (For awareness only)
- **Processing statistics** - Row counts, performance metrics
- **Data insights** - Part-to-application ratios, most common vehicles

### Admin UX Flow

```
File Upload → Processing → Conflict Detection → Review → Decision
    ↓              ↓             ↓             ↓         ↓
[Drag File]  [Progress]   [Conflict List]  [Details] [Import/Fix]
```

**Conflict Presentation:**
- **Summary view**: Count by severity with expand/collapse details
- **Detailed view**: Specific rows, affected SKUs, resolution suggestions
- **Downloadable reports**: Excel/CSV for offline review
- **Action buttons**: Fix and re-upload vs. Import with warnings

### Technical Implementation

```typescript
interface ConflictReport {
  type: 'error' | 'warning' | 'info';
  source: 'precios' | 'catalogacion' | 'cross-validation';
  conflictType: string;
  description: string;
  affectedRows: number[];
  affectedSkus: string[];
  suggestion?: string;
  impact: 'blocking' | 'non-blocking';
}

interface ProcessingResult {
  success: boolean;
  data?: ParsedData;
  conflicts: ConflictReport[];
  summary: ProcessingSummary;
}
```

**Implementation Status:**
- ✅ **Core Interfaces**: ConflictReport, ProcessingResult, ConflictSummary types
- ✅ **Utility Functions**: ConflictFactory, ConflictAggregator classes  
- ✅ **Severity Classification**: Error (blocking), Warning, Info levels
- ✅ **Parser Integration**: Both PRECIOS and CATALOGACION parsers integrated
- ✅ **Simplified Types**: Reduced to 2 main conflict types (duplicate SKUs, orphaned applications)
- ✅ **Code Cleanup**: Removed unused imports, comments, and dead code
- ⏳ **Admin Interface**: Conflict review screen before database import
- ⏳ **Database Import**: Only proceed if no blocking conflicts

**Next Steps:**
- Create admin UI components for conflict presentation  
- Build conflict resolution workflow for Humberto
- Integrate conflict-aware parsers with database import

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

## MVP Features (Priority Order)

### Phase 1: Core Data Foundation (1 week)

1. **✅ Project Setup**

   - Adapt rental management app structure for ACR Automotive
   - Next.js 15 + TypeScript + Tailwind + shadcn/ui
   - Supabase database and storage setup

2. **✅ Database Schema**

   - Create 3 core tables (parts, vehicle_applications, cross_references)
   - Add search indexes and business logic functions
   - Test with sample data

3. **✅ PRECIOS Excel Parser (COMPLETED)**

   - **Two-Step Import Workflow**: PRECIOS (cross-references) → CATALOGACION (applications)
   - **Simplified Architecture**: Hardcoded column positions, no dynamic detection
   - **Direct Buffer Support**: Accepts both Buffer and ArrayBuffer inputs
   - **Real Data Volumes**: 865 ACR parts, 7,530 cross-references from actual file
   - **Performance**: <100ms processing time for 865 rows
   - **Production Ready**: Full test coverage with real Excel file integration

4. **✅ CATALOGACION Excel Parser (COMPLETED)**

   - **Vehicle Applications Processing**: 740 unique parts, 2,304 applications from actual file
   - **Part Details Extraction**: Type, position, specifications, vehicle compatibility
   - **PRECIOS Integration**: Validation against master ACR SKU list
   - **Performance**: <200ms target achieved (96-113ms actual processing)
   - **Data Integrity**: Orphaned SKU detection (13 found in test data)
   - **Production Ready**: Full test coverage with real Excel file integration

5. **✅ Simple i18n Setup**

   - Custom translation system (not next-i18next)
   - English for development, Spanish for production
   - All UI text translatable from day 1

6. **✅ Mock Admin Mode**
   - Skip authentication for MVP
   - Admin mode always enabled in development
   - Focus on core business logic first

7. **✅ Conflict Detection System (COMPLETED)**
   - ✅ Data integrity validation interfaces and utilities
   - ✅ Admin-friendly conflict reporting system design
   - ✅ Blocking vs non-blocking error classification
   - ✅ Parser integration with both PRECIOS and CATALOGACION
   - ✅ Simplified to 2 main conflict types (duplicates, orphans)
   - ✅ Code cleanup and optimization

### Phase 2: Search Interface (1 week)

6. **Vehicle Search**

   - Multi-step dropdown interface (Baleros-Bisa pattern)
   - Make → Model → Year → Part Type progression
   - Dynamic dropdowns populated from database
   - Search results display with SKU prominence

7. **SKU Cross-Reference Search**

   - Single input field for SKU search
   - Search both ACR SKUs and competitor SKUs
   - Fuzzy matching for typos
   - Clear display of cross-reference mapping

8. **Part Details Page**

   - Individual part page with full specifications
   - Vehicle applications table
   - Cross-reference information
   - Image display (if available)
   - Technical specifications

9. **Search Results Display**
   - SKU-prominent layout (matching Baleros-Bisa)
   - Professional B2B design
   - Mobile-responsive for tablets
   - Spanish interface elements

### Phase 3: Admin Management (1 week)

10. **Image Upload Interface**

    - Admin can upload images per part
    - Simple part selector + file upload
    - Images stored in Supabase Storage
    - Auto-update parts.image_url in database

11. **Excel Re-import**

    - Handle subsequent monthly uploads
    - Detect new parts vs existing parts
    - Show changes before applying
    - Replace existing data with new import

12. **Production Deployment**
    - Spanish translation implementation
    - Performance optimization
    - Vercel deployment
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

// Admin routes (mocked in dev)  
POST /api/admin/upload-precios      // ✅ PRECIOS Excel import (cross-references)
POST /api/admin/upload-catalogacion // ✅ CATALOGACION Excel import (applications)
POST /api/admin/upload-image        // Image upload for parts
GET  /api/admin/parts               // Admin parts management
```

### Excel Processing Architecture (UPDATED)

**Two-Step Import Workflow:**
```typescript
// Step 1: PRECIOS Parser (Cross-References) - COMPLETED
interface PreciosProcessing {
  input: "LISTA DE PRECIOS Excel file";
  output: "865 ACR parts + 7,530 cross-reference mappings";
  fileStructure: {
    headerRow: 8;
    dataStartRow: 9;
    columns: "A=ID, B=ACR_SKU, C-M=Competitor brands";
  };
  performance: "<100ms for 865 rows";
  status: "✅ Production Ready";
}

// Step 2: CATALOGACION Parser (Applications) - NEXT
interface CatalogacionProcessing {
  input: "CATALOGACION ACR CLIENTES Excel file";
  output: "Part details + vehicle applications";
  fileStructure: {
    headerRow: 1;
    dataStartRow: 2;
    columns: "A=ID, B=ACR_SKU, E=Type, K=Make, L=Model, M=Year";
  };
  status: "⏳ Not Started";
}
```

**Actual Data Volumes (From Real Files):**
- **PRECIOS**: 865 ACR parts, 7,530 cross-references  
- **CATALOGACION**: 740 unique parts, 2,304 vehicle applications (actual)
- **Processing Speed**: <100ms PRECIOS, <200ms CATALOGACION
- **Memory**: Efficient Buffer/ArrayBuffer support
- **Conflict Detection**: 13 orphaned SKUs detected and reported

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
