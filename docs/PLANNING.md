# PLANNING.md - ACR Automotive

## 🎯 PROJECT STATUS SUMMARY

**Phase Status:**

- **Phase 1**: Bootstrap Data Foundation ✅ 100% Complete
- **Phase 2**: Admin CRUD APIs ✅ 100% Complete
- **Phase 2.5**: Admin UI Implementation ✅ 100% Complete
- **Phase 2.8**: Mobile UX Optimization ✅ 100% Complete
- **Phase 2.9**: Part Details UX & Form Management ✅ 100% Complete
- **Phase 2.95**: Vehicle Applications & Cross References CRUD ✅ 100% Complete
- **Phase 2.98**: Error State Consolidation & MVP Authentication ✅ 100% Complete
- **Phase 3**: Public Search Interface ✅ 100% Complete (vehicle search, SKU lookup, part details)
- **Phase 4**: Production Deployment ✅ 100% Complete (deployed to Vercel)
- **Current**: Phase 4 - Production Polish & Spanish Translation 🎯

_For detailed current session state and next steps, see TASKS.md_

## Project Overview

**Project Name**: ACR Automotive
**Type**: Production-ready auto parts cross-reference search website

## Architecture & Tech Stack

### Core Framework

- **Next.js 15.4.4** with App Router
- **React 19.1.0** with modern concurrent features
- **TypeScript 5.8.3** with strict mode enabled
- **Node.js 18+** runtime environment

### Frontend & UI

- **Tailwind CSS 3.4.17** (utility-first styling)
- **shadcn/ui** (component system - we own all code)
- **Radix UI** (accessible primitives for complex components)
- **Lucide React 0.526** (modern icon library)
- **Class Variance Authority** (component variant management)
- **Tailwind Merge & clsx** (conditional styling utilities)

### Forms & Validation

- **React Hook Form 7.61.1** (performant forms with minimal re-renders)
- **Zod 4.0.17** (TypeScript-first schema validation)
- **@hookform/resolvers** (React Hook Form + Zod integration)

### State Management & Data Fetching

- **TanStack Query 5.0** (server state management & caching)
- **React Context** (i18n and authentication state)
- **use-debounce** (search input optimization)

### Backend & Database

- **Next.js API Routes** (serverless backend functions)
- **Supabase PostgreSQL** (managed database with real-time features)
- **Supabase Storage** (file storage with CDN)
- **Supabase RLS** (row-level security for data protection)

### Data Processing

- **SheetJS (xlsx 0.18.5)** (Excel file parsing)
- **Lodash 4.17.21** (utility functions for data manipulation)

### Infrastructure & Hosting

- **Vercel** (hosting + CI/CD with automatic deployments)
- **Supabase Cloud** (managed database and storage)
- **Custom Domain** (production deployment)

### Internationalization (i18n)

- **Custom simple solution** (not next-i18next for MVP)
- **Development**: English
- **Production**: Spanish (Mexican auto parts market)
- **All UI text translatable** from day 1


## Database Schema

**Core Tables**: 3 main tables (parts, vehicle_applications, cross_references)
**Design**: Parts-centric with cascading relationships
**Location**: Complete schema definition in `src/lib/supabase/schema.sql`

## Data Import System

**Status**: ✅ Complete - Database bootstrapped with production data
**Scripts**: Bootstrap and utility scripts located in `scripts/` folder
**Documentation**: Excel parsing details in `docs/excel/` folder

## Technical Implementation

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── admin/              # Admin panel (password protected)
│   │   └── parts/[id]/     # Part detail pages
│   ├── parts/[id]/         # Public part detail pages
│   ├── api/                # Backend API routes
│   │   ├── admin/          # Admin CRUD operations
│   │   │   ├── auth/       # Authentication
│   │   │   ├── parts/      # Parts management
│   │   │   ├── vehicles/   # Vehicle applications
│   │   │   ├── cross-references/ # Cross-references
│   │   │   ├── stats/      # Admin dashboard stats
│   │   │   └── filter-options/ # Filter dropdowns
│   │   └── public/         # Public search APIs
│   │       ├── parts/      # Public part search
│   │       └── vehicle-options/ # Vehicle dropdowns
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # React Query & context providers
├── components/             # React components
│   ├── ui/                # shadcn/ui base components
│   ├── acr/               # Custom ACR-styled components
│   ├── admin/             # Admin interface components
│   │   ├── parts/         # Parts management
│   │   ├── part-details/  # Part detail forms
│   │   ├── vehicle-apps/  # Vehicle applications
│   │   ├── cross-refs/    # Cross-references
│   │   └── layout/        # Admin layout components
│   └── public/            # Public interface components
│       ├── search/        # Search components
│       └── parts/         # Part display components
├── lib/                   # Utilities & configurations
│   ├── supabase/          # Supabase client & utilities
│   ├── excel/             # Excel parsing utilities
│   ├── i18n/              # Translation system
│   └── schemas/           # Zod validation schemas
├── hooks/                 # Custom React hooks
│   ├── admin/             # Admin-specific hooks
│   ├── public/            # Public interface hooks
│   └── common/            # Shared hooks
├── types/                 # TypeScript definitions
│   ├── index.ts           # General types
│   ├── api.ts             # API response types
│   └── database.ts        # Database types
└── contexts/              # React contexts
    └── LocaleContext.tsx  # i18n context
```

### API Endpoints

```typescript
// Public APIs
GET / api / public / parts; // Search parts (vehicle + SKU search)
GET / api / public / vehicle - options; // Vehicle dropdown cascades

// Admin Authentication
POST / api / admin / auth; // Admin login/logout

// Admin Parts Management
GET / api / admin / parts; // List parts with pagination/search/filters
POST / api / admin / parts; // Create new part
GET / api / admin / parts / [id]; // Get single part with relations
PUT / api / admin / parts / [id]; // Update part
DELETE / api / admin / parts / [id]; // Delete part

// Admin Vehicle Applications
POST / api / admin / vehicles; // Create vehicle application
PUT / api / admin / vehicles / [id]; // Update vehicle application
DELETE / api / admin / vehicles / [id]; // Delete vehicle application

// Admin Cross References
POST / api / admin / cross - references; // Create cross-reference
PUT / api / admin / cross - references / [id]; // Update cross-reference
DELETE / api / admin / cross - references / [id]; // Delete cross-reference

// Admin Dashboard & Utilities
GET / api / admin / stats; // Dashboard statistics
GET / api / admin / filter - options; // Dropdown filter options
```

### Search Performance Strategy

- **PostgreSQL indexes** on SKUs, make/model/year combinations
- **Full-text search** with trigram matching for typos
- **TanStack Query caching** for frequent searches

### Image Management

- **Supabase Storage** for all part images
- **CDN distribution** automatic via Supabase
- **Admin upload interface** (no Google Drive migration)
- **Standardized naming**: `{acr_sku}.jpg` format

## UI/UX Design Patterns

### Reference Design (Baleros-Bisa Pattern)

**Reference Site**: https://baleros-bisa.com/productos-automotrices?division=1&clase=MAZA&automotriz

- **Multi-step search**: Category → Make → Model → Year dropdowns
- **SKU prominence**: Large, bold part numbers in results
- **Professional B2B aesthetic**: Clean, technical design
- **Mobile-optimized**: Touch-friendly for tablets at parts counters

### Design System Components

**Documentation**: Comprehensive design system documented in `src/components/acr/README.md`

**Core Component Architecture**:
- **shadcn/ui foundation** (`components/ui/`): Base primitives (buttons, inputs, dialogs, tables, forms, etc.)
- **ACR custom components** (`components/acr/`): Business-specific components built on shadcn/ui
- **Component ownership**: Copy-paste strategy for maximum customization control

**Key ACR Components**:
- **AcrButton, AcrCard, AcrInput, AcrSelect**: Core interface elements with ACR styling
- **AcrModal, ConfirmDialog**: Dialog patterns for admin workflows
- **Error states, Skeletons, Toasts**: Feedback and loading patterns
- **Mobile-first responsive**: Optimized for tablet interfaces at parts counters

## Development Workflow

### Environment Setup

- **Local**: `localhost:3000` with Supabase local development
- **Development**: English language, mock admin mode
- **Staging**: Vercel preview deployments with Supabase staging
- **Production**: Spanish language, password authentication

### Testing Strategy

**Documentation**: Complete testing strategy and guidelines in `docs/TESTING.md`

- **Core functionality focus**: Excel parsing, search functionality, data integrity
- **Type-safe approach**: Schema validation and factory patterns

---

_This document serves as the single source of truth for the ACR Automotive project architecture and implementation strategy._
