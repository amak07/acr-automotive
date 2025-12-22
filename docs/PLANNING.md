---
title: Planning & Architecture
description: Single source of truth for system architecture, tech stack decisions, and implementation patterns
---

# PLANNING.md - ACR Automotive Architecture

> **Purpose**: Single source of truth for system architecture, tech stack decisions, and implementation patterns. For current development status, see [TASKS.md](./TASKS.md).

---

## Project Overview

**Project Name**: ACR Automotive
**Type**: Production auto parts cross-reference search platform
**Target Users**: Mexican auto parts distributors and their customers
**Scale**: 1,000+ parts, 10,000+ cross-references, high-volume search queries

**Business Problem**: Traditional parts catalogs are printed, static, and difficult to search. Customers need instant cross-reference lookup between ACR parts and competitor brands, plus vehicle compatibility checking.

**Solution**: Fast, mobile-optimized web search with dual lookup modes (vehicle-based and SKU-based), supporting both Spanish-speaking staff and end customers.

---

## Architecture & Tech Stack

### Core Framework

**Next.js 15.4.4** with App Router

- **Why**: Server components + client components = optimal loading performance
- **Why App Router**: File-based routing with layouts, automatic code splitting, streaming SSR
- **Trade-off**: Learning curve vs Pages Router, but better long-term scalability

**React 19.1.0** with modern concurrent features

- **Why**: Familiar ecosystem, excellent TypeScript support, large talent pool
- **Why v19**: Concurrent rendering, automatic batching, improved Suspense

**TypeScript 5.8.3** with strict mode enabled

- **Why**: Catch bugs at compile-time, self-documenting code, better IDE support
- **Strict mode**: No `any` types allowed - forces proper type definitions
- **Trade-off**: Slightly slower development vs JavaScript, but much fewer runtime bugs

**Node.js 18+** runtime environment

- **Why**: Industry standard, excellent Vercel support, native ESM

---

### Frontend & UI

**Tailwind CSS 3.4.17** (utility-first styling)

- **Why**: Rapid UI development, no CSS file bloat, mobile-first by default
- **Why not CSS-in-JS**: Tailwind's JIT compiler is faster, zero runtime cost
- **Pattern**: Custom `@apply` directives for repeated patterns

**shadcn/ui** (component system - we own all code)

- **Why**: Copy-paste components = full control, no dependency hell
- **Why not component library**: Can't customize MUI/Chakra deeply enough
- **Philosophy**: Own the code, don't fight the library

**Radix UI** (accessible primitives for complex components)

- **Why**: Unstyled, accessible by default, composable
- **Use case**: Dropdowns, modals, accordions - complex a11y handled

**Lucide React 0.526** (modern icon library)

- **Why**: Lightweight, tree-shakeable, consistent design
- **Why not Font Awesome**: Better TS support, smaller bundle

**Class Variance Authority** (component variant management)

- **Why**: Type-safe variant prop handling
- **Pattern**: `variant` and `size` props with autocomplete

**Tailwind Merge & clsx** (conditional styling utilities)

- **Why**: Prevents className conflicts, clean conditional classes

---

### Forms & Validation

**React Hook Form 7.61.1** (performant forms with minimal re-renders)

- **Why**: Best performance for complex forms (admin part editing)
- **Why not Formik**: RHF uses uncontrolled inputs = fewer renders
- **Pattern**: Controller for custom components, register for native inputs

**Zod 4.0.17** (TypeScript-first schema validation)

- **Why**: Single source of truth for validation + TypeScript types
- **Why not Yup**: Better TS inference, more composable schemas
- **Pattern**: Define schema → infer type → use in API + forms

**@hookform/resolvers** (React Hook Form + Zod integration)

- **Why**: Official integration, zero-config Zod validation

---

### State Management & Data Fetching

**TanStack Query 5.0** (server state management & caching)

- **Why**: Best-in-class server state caching, automatic refetching
- **Why not Redux**: Overkill for our use case, TQ handles 90% of state
- **Pattern**: `useQuery` for reads, `useMutation` for writes, optimistic updates

**React Context** (i18n and authentication state)

- **Why**: Simple, built-in, sufficient for app-wide state
- **Use case**: Locale switching, admin auth status
- **Why not Zustand**: Context is enough for 2 global states

**use-debounce** (search input optimization)

- **Why**: Prevents excessive API calls during typing
- **Pattern**: 300ms debounce on search inputs

---

### Backend & Database

**Next.js API Routes** (serverless backend functions)

- **Why**: Co-located with frontend, auto-deployed with Vercel
- **Why not separate Express**: Simpler deployment, faster development
- **Pattern**: `/api/admin/*` for protected, `/api/public/*` for open

**Supabase PostgreSQL** (managed database with real-time features)

- **Why**: Managed Postgres (no DevOps), generous free tier, excellent DX
- **Why not MongoDB**: Need relational queries (parts → vehicles → cross-refs)
- **Why not Firebase**: SQL > NoSQL for cross-reference data
- **Trade-off**: Vendor lock-in vs self-hosted Postgres, but Supabase offers migrations

**Supabase Storage** (file storage with CDN)

- **Why**: Same ecosystem as DB, auto-CDN, signed URLs built-in
- **Use case**: Part images, 360° viewer frames

**Supabase RLS** (row-level security for data protection)

- **Why**: Database-level security (can't bypass in API)
- **Pattern**: Public read, admin-only write

---

### Data Processing

**SheetJS (xlsx 0.18.5)** (Excel file parsing)

- **Why**: Industry standard, handles complex Excel features
- **Use case**: Bulk data import/export for admins
- **Why not CSV**: Excel preserves formulas, data types, multiple sheets

**Lodash 4.17.21** (utility functions for data manipulation)

- **Why**: Battle-tested, handles edge cases, tree-shakeable
- **Use case**: Data transformation in import pipelines

**Sharp 0.33.2** (server-side image optimization for 360° viewer)

- **Why**: Fastest image processing library for Node.js
- **Why not client-side**: Large image resizing crushes browsers
- **Pattern**: Resize to 1200×1200 @ 85% quality on upload

---

### Infrastructure & Hosting

**Vercel** (hosting + CI/CD with automatic deployments)

- **Why**: Zero-config Next.js deployment, automatic preview URLs
- **Why not AWS/GCP**: Vercel = 10min setup vs 10hr AWS setup
- **Pattern**: Git push → automatic deploy, main branch = production

**Supabase Cloud** (managed database and storage)

- **Why**: Matches Vercel simplicity, generous free tier
- **Why not self-hosted Postgres**: No DevOps time available

**Custom Domain** (production deployment)

- **Why**: Professional branding vs vercel.app subdomain

---

### Internationalization (i18n)

**Custom simple solution** (not next-i18next for MVP)

- **Why**: next-i18next is heavy for single-language switch (EN ↔ ES)
- **Pattern**: JSON translation files + React Context + custom hook
- **Development**: English (for developer)
- **Production**: Spanish (for Mexican market)
- **All UI text translatable** from day 1 (no hardcoded strings)

---

## Database Schema

### Design Philosophy

**Parts-centric with cascading relationships**

- Parts table is the source of truth
- Vehicle applications reference parts
- Cross-references reference parts
- **Why**: Deleting a part auto-deletes orphaned relations (PostgreSQL CASCADE)

**3-table design** (parts, vehicle_applications, cross_references)

- **Why not denormalized**: Prevents data duplication, easier updates
- **Why not more tables**: MVP scope, can normalize further later
- **Indexes**: On SKUs, make/model/year for fast search

### Schema Location

Complete schema definition: [`src/lib/supabase/schema.sql`](../src/lib/supabase/schema.sql)

Detailed documentation: [`docs/database/DATABASE.md`](./database/DATABASE.md)

---

## Technical Implementation

### Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── admin/              # Admin panel (password protected)
│   ├── api/                # Backend API routes
│   │   ├── admin/          # Admin CRUD operations
│   │   └── public/         # Public search APIs
│   ├── parts/[id]/         # Public part detail pages
│   ├── globals.css         # Global styles + Tailwind
│   ├── layout.tsx          # Root layout with providers
│   └── providers.tsx       # React Query + Context providers
├── components/
│   ├── ui/                # shadcn/ui base components (owned)
│   ├── acr/               # Custom ACR design system
│   ├── admin/             # Admin interface components
│   └── public/            # Public interface components
├── lib/
│   ├── supabase/          # Supabase client & utilities
│   ├── excel/             # Excel import/export services
│   ├── i18n/              # Translation system
│   └── schemas/           # Zod validation schemas
├── hooks/
│   ├── admin/             # Admin-specific hooks (usePartsList, etc.)
│   ├── public/            # Public hooks (useSearch, etc.)
│   └── common/            # Shared hooks (useDebounce, etc.)
├── types/                 # TypeScript type definitions
└── contexts/              # React contexts (LocaleContext, etc.)
```

**Pattern**: Feature-based organization, clear public/admin separation

---

### API Design Patterns

#### Public APIs (Unauthenticated)

```typescript
GET / api / public / parts; // Search parts (vehicle + SKU search)
GET / api / public / vehicle - options; // Vehicle dropdown cascades
```

**Pattern**: Read-only, cacheable, rate-limited

#### Admin APIs (Authenticated)

```typescript
POST / api / admin / auth; // Admin login/logout

// CRUD operations
GET / api / admin / parts; // List with pagination/search/filters
POST / api / admin / parts; // Create new part
GET / api / admin / parts / [id]; // Get single part with relations
PUT / api / admin / parts / [id]; // Update part
DELETE / api / admin / parts / [id]; // Delete part (cascades to relations)

// Related entities
POST / api / admin / vehicles; // Create vehicle application
PUT / api / admin / vehicles / [id]; // Update vehicle application
DELETE / api / admin / vehicles / [id]; // Delete vehicle application

POST / api / admin / cross - references; // Create cross-reference
PUT / api / admin / cross - references / [id]; // Update cross-reference
DELETE / api / admin / cross - references / [id]; // Delete cross-reference

// Utilities
GET / api / admin / stats; // Dashboard statistics
GET / api / admin / filter - options; // Dropdown options
```

**Pattern**: RESTful, Zod validation on all inputs, consistent error responses

---

### Search Performance Strategy

**Challenge**: Sub-300ms response times on 1,000+ parts with complex filters

**Solutions**:

1. **PostgreSQL Indexes**
   - Composite indexes on `(make, model, year)`
   - GIN index on `acr_sku` for prefix matching
   - B-tree indexes on foreign keys

2. **Full-Text Search**
   - Trigram matching for typo tolerance (`pg_trgm` extension)
   - Fuzzy match on competitor SKUs

3. **TanStack Query Caching**
   - 5-minute cache for frequent searches
   - Background refetch on stale data
   - Optimistic updates for instant UX

4. **Database Query Optimization**
   - `EXPLAIN ANALYZE` on slow queries
   - Batch loading with JOINs (no N+1 queries)
   - Pagination to limit result sets

---

### Image Management

**Architecture**: Supabase Storage + CDN

**Strategy**:

- **Upload**: Admin uploads → Sharp resizes → Supabase Storage
- **Delivery**: Signed URLs (public, 1-year expiry) → Automatic CDN
- **Naming**: `{acr_sku}-{n}.jpg` for product images, `360-viewer/{acr_sku}/frame-{nnn}.jpg` for spin viewer

**Multi-Image Support**:

- Up to 6 product photos per part
- Drag-to-reorder gallery (admin)
- Lazy loading (public)

**360° Interactive Viewer**:

- Optional spin viewer (12-48 frames)
- Server-side optimization: 1200×1200px @ 85% JPEG quality
- Touch gestures: swipe to rotate
- Fullscreen mode: CSS-based (iOS Safari compatible)

**Performance**:

- Lazy load images below fold
- WebP with JPEG fallback
- Responsive images with `srcset`

---

## UI/UX Design Patterns

### Reference Design (Baleros-Bisa Pattern)

**Inspiration**: https://baleros-bisa.com/productos-automotrices

**Key Patterns Adopted**:

- Multi-step search flow: Category → Make → Model → Year dropdowns
- SKU prominence: Large, bold part numbers in results
- Professional B2B aesthetic: Clean, technical design
- Mobile-optimized: Touch-friendly for tablets at parts counters

**Differentiation**: We added 360° viewer, better mobile UX, faster search

---

### Design System Components

**Documentation**: [`src/components/acr/README.md`](../src/components/acr/README.md)

**Architecture**:

- **Foundation**: shadcn/ui base components (`components/ui/`)
- **ACR Layer**: Custom components with ACR styling (`components/acr/`)
- **Philosophy**: Own the code, customize freely

**Key Components**:

- **AcrButton**: Primary, secondary, outline, ghost variants
- **AcrCard**: Elevated, flat, bordered styles
- **AcrInput**: Text, number, select with validation states
- **AcrModal**: Confirmation dialogs, form modals
- **Error/Loading States**: Skeletons, empty states, error boundaries

**Mobile-First**: All components optimized for tablet interface (iPad-sized)

---

## Development Workflow

### Environment Setup

| Environment    | URL              | Language | Auth     | Database         |
| -------------- | ---------------- | -------- | -------- | ---------------- |
| **Local**      | `localhost:3000` | English  | Mock     | Local Supabase   |
| **Staging**    | Vercel preview   | English  | Password | Supabase staging |
| **Production** | Custom domain    | Spanish  | Password | Supabase prod    |

**Pattern**: Feature branches → PR → Vercel preview → Merge → Auto-deploy

---

### Testing Strategy

**Documentation**: [TESTING.md](./TESTING.md)

**Philosophy**: Focus on business logic, not implementation details

**Coverage**:

- ✅ **Unit tests**: Excel parsing, validation logic, data transformations
- ✅ **Integration tests**: API routes, database queries
- ⚠️ **E2E tests**: Critical user flows only (not comprehensive)
- ❌ **Component tests**: Skipped for MVP (too brittle)

**Tools**:

- **Vitest**: Fast, modern test runner
- **Zod factories**: Generate valid test data
- **Supabase mocks**: In-memory database for tests

---

## Architectural Principles

### 1. Copy, Don't Import (Components)

**Principle**: Own your component code, don't depend on external libraries
**Why**: Maximum customization, no version lock-in, no breaking changes
**Example**: shadcn/ui components copied into `components/ui/`

### 2. Server-First, Client When Needed

**Principle**: Default to Server Components, only use Client when interactive
**Why**: Faster load times, smaller JS bundles, better SEO
**Pattern**: Mark with `"use client"` only when using hooks/state

### 3. Type Safety Everywhere

**Principle**: No `any` types, Zod schemas for all external data
**Why**: Catch bugs at compile-time, self-documenting code
**Pattern**: Database → Zod schema → TypeScript type → API → Form

### 4. Progressive Enhancement

**Principle**: Works without JavaScript, enhanced with it
**Why**: Better accessibility, works on slow connections
**Example**: Search works as form submission, enhanced with client-side filtering

### 5. Mobile-First Responsive

**Principle**: Design for mobile, scale up to desktop
**Why**: 60% of users are on tablets (parts counter staff)
**Pattern**: `sm:`, `md:`, `lg:` Tailwind breakpoints

### 6. Performance Budgets

**Principle**: Sub-300ms search, sub-2s page load
**Why**: B2B users are impatient, competitors are slow
**Pattern**: Lighthouse CI, bundle size monitoring

---

## Tech Stack Decisions Summary

| Category       | Choice          | Why Not Alternatives?                                         |
| -------------- | --------------- | ------------------------------------------------------------- |
| **Framework**  | Next.js 15      | Better than Remix (ecosystem), Astro (not interactive enough) |
| **Language**   | TypeScript      | Better than JavaScript (type safety worth the overhead)       |
| **Styling**    | Tailwind CSS    | Better than CSS-in-JS (performance), SCSS (flexibility)       |
| **Database**   | PostgreSQL      | Better than MongoDB (relational data), MySQL (Supabase)       |
| **Hosting**    | Vercel          | Better than AWS (simplicity), Netlify (Next.js optimized)     |
| **State**      | TanStack Query  | Better than Redux (simpler), SWR (more features)              |
| **Forms**      | React Hook Form | Better than Formik (performance), native (DX)                 |
| **Validation** | Zod             | Better than Yup (TS integration), Joi (client-side)           |

---

## Related Documentation

### Architecture Documentation

For detailed implementation patterns and architecture deep-dives, see the [architecture/](./architecture/) folder:

- **[Architecture Overview](./architecture/OVERVIEW.md)** - Complete system architecture with all layers explained
- **[API Design](./architecture/API_DESIGN.md)** - RESTful patterns, error handling, and response formats
- **[Validation](./architecture/VALIDATION.md)** - Zod schema patterns and type inference
- **[Service Layer](./architecture/SERVICE_LAYER.md)** - When to use services vs direct database queries
- **[State Management](./architecture/STATE_MANAGEMENT.md)** - TanStack Query and React Context patterns
- **[Data Flow](./architecture/DATA_FLOW.md)** - Complete request lifecycle and caching strategy
- **[Internationalization](./architecture/INTERNATIONALIZATION.md)** - Custom i18n system implementation
- **[Component Architecture](./architecture/COMPONENT_ARCHITECTURE.md)** - ACR design system and component patterns

### Project Documentation

- **Current Development**: [TASKS.md](./TASKS.md) - Active work and progress tracking
- **Database Design**: [database/DATABASE.md](./database/DATABASE.md) - Complete schema and relationships
- **Testing Guidelines**: [TESTING.md](./TESTING.md) - Test strategy and patterns
- **Feature Documentation**: [features/](./features/) - Completed feature deep-dives
- **Future Enhancements**: [ENHANCEMENTS.md](./ENHANCEMENTS.md) - Roadmap and ideas

---

_This document serves as the single source of truth for ACR Automotive architecture and tech stack rationale. Last updated: October 25, 2025_
