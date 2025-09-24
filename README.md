# ACR Automotive

A professional auto parts cross-reference search platform built for Mexican B2B distributors. This application enables parts counter staff to quickly find equivalent parts using competitor SKUs or vehicle specifications.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 🎯 Purpose

ACR Automotive solves a critical problem in the auto parts industry: **cross-reference part lookup**. When a customer comes to a parts counter with a competitor's part number, staff can instantly find the equivalent ACR part, complete with vehicle compatibility and technical specifications.

### Key Features

- **🔍 Dual Search System**: Search by vehicle (Make → Model → Year) or by competitor SKU
- **⚡ Fast Cross-Reference**: Competitor part numbers instantly mapped to ACR equivalents
- **📱 Mobile-First Design**: Optimized for tablets used at parts counters
- **🌍 Bilingual Support**: English development, Spanish production (Mexican market)
- **⚙️ Admin CRUD Interface**: Complete parts management system for ongoing inventory control
- **🖼️ Image Management**: Admin interface for product photos
- **📦 One-Time Bootstrap**: Import existing Excel data once, then manage through web interface

## 🏗️ Technical Architecture

### Built With

- **Frontend**: Next.js 15.4.4 with App Router, React 19.1.0, TypeScript 5.8.3
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Database**: Supabase with Row Level Security
- **Storage**: Supabase Storage for images and file uploads
- **State Management**: TanStack Query 5.0 + React Context
- **UI Components**: shadcn/ui + custom ACR design system (owned components)
- **Styling**: Tailwind CSS 3.4.17 with custom design tokens
- **Forms**: React Hook Form 7.61.1 + Zod 4.0.17 validation
- **Deployment**: Vercel with Supabase integration

### Architecture Highlights

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Search UI     │────│   API Routes    │────│   Supabase      │
│   (Public)      │    │   (Business     │    │   (Database +   │
│                 │    │    Logic)       │    │    Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────│  Admin CRUD     │
                        │  (Parts Mgmt)   │
                        └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd acr-automotive
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Add your Supabase URL and anon key
   ```

4. **Set up the database**

   ```bash
   # Run database migrations
   npm run db:setup
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Available Scripts

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Start development server                       |
| `npm run build`          | Build for production                           |
| `npm run start`          | Start production server                        |
| `npm run lint`           | Run ESLint                                     |
| `npm run type-check`     | Run TypeScript type checking                   |
| `npm test`               | Run test suite                                 |
| `npm run test:watch`     | Run tests in watch mode                        |
| `npm run test:coverage`  | Run tests with coverage                        |
| `npm run test:full`      | TypeScript check + tests (recommended)        |
| `npm run bootstrap`      | One-time data import from Excel (completed)   |
| `npm run bootstrap:test` | Test bootstrap import with development data    |
| `npm run check-prod`     | Check production database status               |
| `npm run clear-prod`     | Clear production database (use with caution)  |

## 🗄️ Database Schema

The application uses a streamlined 3-table design optimized for auto parts data:

```sql
-- Main parts catalog
parts (acr_sku, part_type, position, abs_type, bolt_pattern, drive_type, specifications, image_url, ...)

-- Vehicle compatibility
vehicle_applications (part_id, make, model, start_year, end_year)

-- Cross-reference mapping
cross_references (acr_part_id, competitor_sku, competitor_brand)
```

**Complete Schema**: See `src/lib/supabase/schema.sql` for full table definitions and indexes.

### Key Design Decisions

- **No separate lookup tables**: Makes/models/categories extracted dynamically
- **Cross-reference focused**: Optimized for competitor SKU → ACR part mapping
- **Performance indexes**: Sub-300ms search response times
- **Row Level Security**: Public read access, admin-only writes

## 🔍 Search Functionality

### Vehicle Search

Multi-step dropdown progression matching industry standards:

```
Category → Make → Model → Year → Search Results
```

### SKU Cross-Reference Search

Intelligent SKU matching with multiple strategies:

1. **Exact ACR SKU match** - Direct product lookup
2. **Cross-reference match** - Competitor SKU → ACR equivalent
3. **Fuzzy match** - Handle typos and variations

## 📊 Data Management

### Data Import System

- **PRECIOS Import**: 865 parts with 7,530 cross-references ✅ Complete
- **CATALOGACION Import**: 2,304 vehicle applications and part details ✅ Complete
- **Production Database**: Fully populated with real data ✅ Complete
- **Data Quality**: Bootstrap import handles duplicates and validates data integrity
- **Ongoing Management**: Admin interface for all future data changes

### Admin Interface

- **Complete Parts Management**: CRUD operations with form validation and error handling
- **Vehicle Applications**: Add/remove vehicle compatibility per part with duplicate prevention
- **Cross-References**: Manage competitor SKU mappings with brand validation
- **Image Management**: Upload and organize part photos via Supabase Storage
- **Dashboard Analytics**: Part counts, data quality metrics, and system statistics
- **Search & Filtering**: Advanced filtering and pagination for large datasets
- **MVP Authentication**: Password-protected admin access with session management

### Performance

- **Search Speed**: Sub-300ms response times maintained
- **Data Integrity**: Form validation prevents database errors
- **Scalability**: Optimized for thousands of parts and applications

## 🌍 Internationalization

Built-in bilingual support using a custom i18n system:

```typescript
// English (development)
t("search.vehicle"); // "Search by Vehicle"

// Spanish (production)
t("search.vehicle"); // "Búsqueda por Vehículo"
```

All UI text is translatable from day one, ensuring seamless Mexican market deployment.

## 🧪 Testing Strategy

Focus on business-critical functionality:

- **Excel parsing accuracy** - Data integrity is paramount
- **Cross-reference lookup** - Core business value
- **Search performance** - Sub-300ms response times
- **Type-safe factories** - Schema changes break tests appropriately

```bash
# Run core business logic tests
npm test -- --testPathPattern="excel|search"

# Full test suite with type checking
npm run test:full
```

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── admin/              # Password-protected admin panel
│   │   └── parts/[id]/     # Part detail pages
│   ├── parts/[id]/         # Public part detail pages
│   ├── api/                # Backend API routes
│   │   ├── admin/          # Admin CRUD operations
│   │   └── public/         # Public search APIs
│   ├── layout.tsx          # Root layout with providers
│   └── providers.tsx       # React Query & context providers
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── acr/                # Custom ACR design system
│   ├── admin/              # Admin interface components
│   └── public/             # Public interface components
├── lib/                    # Core utilities
│   ├── supabase/           # Database client & utilities
│   ├── excel/              # Excel parsing (bootstrap only)
│   ├── schemas/            # Zod validation schemas
│   └── i18n/               # Translation system
├── hooks/                  # Custom React hooks
│   ├── admin/              # Admin-specific hooks
│   └── public/             # Public interface hooks
├── types/                  # TypeScript definitions
├── contexts/               # React contexts (i18n)
└── docs/                   # Project documentation
```

## 🚀 Deployment Status

### Production Environment ✅ DEPLOYED

- **Platform**: Vercel with automatic deployments from main branch
- **Database**: Supabase Cloud with production data
- **Status**: Fully operational with complete parts catalog
- **Authentication**: MVP password protection (ADMIN_PASSWORD environment variable)
- **Performance**: Sub-300ms search response times maintained

### Environment Configuration

**Required Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=your_admin_password
NODE_ENV=production
```

### Local Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd acr-automotive
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

- **`docs/PLANNING.md`** - Technical architecture and implementation strategy
- **`docs/TASKS.md`** - Development roadmap and current priorities
- **`docs/ENHANCEMENTS.md`** - Future improvements and enhancement roadmap
- **`docs/TESTING.md`** - Testing strategy and guidelines
- **`docs/CLAUDE.md`** - Development standards and patterns
- **`src/components/acr/README.md`** - ACR Design System documentation

## 🎯 Project Status

**Current Phase**: ✅ **Production Ready**

- ✅ **Phase 1**: Database foundation and Excel import system (Complete)
- ✅ **Phase 2**: Admin CRUD interface and parts management (Complete)
- ✅ **Phase 3**: Public search interface (vehicle + SKU search) (Complete)
- ✅ **Phase 4**: Production deployment and optimization (Complete)
- 🎯 **Phase 5**: Spanish translation and final polish (In Progress)

### Key Achievements

- **Production-ready application** deployed to Vercel
- **Complete parts catalog** with 865+ parts and 7,530+ cross-references
- **Full admin interface** for ongoing parts management
- **Dual search system** (vehicle and SKU-based)
- **Mobile-responsive design** optimized for tablets
- **Sub-300ms search performance** maintained
- **Comprehensive documentation** for future development

---

**Built for the Mexican auto parts market** • **Professional B2B focus** • **Interview-ready codebase**
