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

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Database**: Supabase with Row Level Security
- **Storage**: Supabase Storage for images and Excel files
- **State Management**: TanStack Query + Zustand
- **UI Components**: shadcn/ui (owned components, not external dependencies)
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

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start development server               |
| `npm run build`         | Build for production                   |
| `npm run start`         | Start production server                |
| `npm run lint`          | Run ESLint                             |
| `npm run type-check`    | Run TypeScript type checking           |
| `npm test`              | Run test suite                         |
| `npm run test:watch`    | Run tests in watch mode                |
| `npm run test:coverage` | Run tests with coverage                |
| `npm run test:full`     | TypeScript check + tests (recommended) |

## 🗄️ Database Schema

The application uses a streamlined 3-table design optimized for auto parts data:

```sql
-- Main parts catalog
parts (acr_sku, competitor_sku, part_type, position, specifications, image_url, ...)

-- Vehicle compatibility
vehicle_applications (part_id, make, model, year_range)

-- Cross-reference mapping
cross_references (acr_part_id, competitor_sku, competitor_brand)
```

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

### Bootstrap Import (One-Time)

- **PRECIOS Import**: 865 parts with 7,530 cross-references ✅ Complete
- **CATALOGACION Import**: Vehicle applications and part details ⏳ In Progress
- **Data Quality**: 80% coverage target achieved, remaining handled via admin interface

### Admin CRUD Interface

- **Parts Management**: Create, read, update, delete parts with full validation
- **Vehicle Applications**: Add/remove vehicle compatibility per part
- **Cross-References**: Manage competitor SKU mappings
- **Image Management**: Upload and organize part photos via Supabase Storage

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
│   ├── (public)/           # Public search interface
│   ├── admin/              # Admin panel
│   └── api/                # Backend API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── search/             # Search interface
│   ├── admin/              # Admin features
│   └── parts/              # Part display
├── lib/                    # Core utilities
│   ├── supabase/           # Database client
│   ├── excel/              # Excel parsing with conflict detection
│   ├── search/             # Search algorithms
│   └── i18n/               # Translation system
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
└── __tests__/              # Test files
```

## 🚀 Deployment

### Production Deployment (Vercel + Supabase)

1. **Deploy to Vercel**

   ```bash
   npm run build
   vercel --prod
   ```

2. **Configure environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `NODE_ENV=production`
   - Configure other environment variables from `.env.example`
     #   a c r - a u t o m o t i v e 
      
      
