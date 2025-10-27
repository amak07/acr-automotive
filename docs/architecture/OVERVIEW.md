# Architecture Overview

> **Purpose**: 30,000-foot view of ACR Automotive system architecture
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Layers](#core-layers)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Design Principles](#design-principles)
- [Related Documentation](#related-documentation)

---

## System Overview

**ACR Automotive** is a production-ready auto parts cross-reference search platform built for Mexican auto parts distributors. The system enables:

- **Public search**: Fast parts lookup by ACR SKU, competitor SKU, or vehicle application
- **Admin management**: Full CRUD for parts catalog, vehicle applications, and cross-references
- **Bulk operations**: Excel import/export for catalog management
- **Bilingual interface**: Spanish (production) and English (development)

**Scale**: ~9,600 parts, ~18,000 vehicle applications, ~6,000 cross-references

**Performance Target**: Sub-300ms search response times

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  Next.js 15 App Router + React 19 + TypeScript 5.8         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Public UI   │  │  Admin UI    │  │ ACR Design   │     │
│  │  (Search)    │  │  (Management)│  │ System       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                │
│  ┌──────▼──────────────────▼─────────────────┐            │
│  │    State Management Layer                 │            │
│  │  • TanStack Query (server state)          │            │
│  │  • React Context (locale, UI state)       │            │
│  │  • Centralized query keys                 │            │
│  └──────┬────────────────────────────────────┘            │
│         │                                                   │
├─────────┼───────────────────────────────────────────────────┤
│         │            API LAYER (Next.js Routes)            │
│         │                                                   │
│  ┌──────▼──────────┐          ┌─────────────────┐         │
│  │  Public API     │          │   Admin API     │         │
│  │  /api/public/*  │          │   /api/admin/*  │         │
│  └──────┬──────────┘          └─────┬───────────┘         │
│         │                            │                      │
│  ┌──────▼────────────────────────────▼─────────┐          │
│  │         Validation Layer (Zod)              │          │
│  │  • Request schemas                          │          │
│  │  • Type inference                           │          │
│  │  • Error transformation                     │          │
│  └──────┬──────────────────────────────────────┘          │
│         │                                                   │
│  ┌──────▼──────────────────────────────────────┐          │
│  │         Service Layer                       │          │
│  │  • BulkOperationsService                    │          │
│  │  • ExcelExportService                       │          │
│  │  • Business logic isolation                 │          │
│  └──────┬──────────────────────────────────────┘          │
│         │                                                   │
├─────────┼───────────────────────────────────────────────────┤
│         │            DATABASE LAYER                        │
│         │                                                   │
│  ┌──────▼──────────────────────────────────────┐          │
│  │  Supabase Client (PostgreSQL 15 + RLS)     │          │
│  │  • Type-safe queries                        │          │
│  │  • Row-level security                       │          │
│  │  • Trigram fuzzy search                     │          │
│  └──────┬──────────────────────────────────────┘          │
│         │                                                   │
│  ┌──────▼──────────────────────────────────────┐          │
│  │          Database Schema                    │          │
│  │  • parts (9.6k rows)                        │          │
│  │  • vehicle_applications (18k rows)          │          │
│  │  • cross_references (6k rows)               │          │
│  │  • part_images (linked via part_id)         │          │
│  │  • site_settings (JSON config)              │          │
│  └─────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Layers

### 1. Client Layer
**Technology**: Next.js 15 App Router, React 19, TypeScript 5.8

**Responsibilities**:
- UI rendering (server and client components)
- Form handling (React Hook Form + Zod)
- State management (TanStack Query + Context)
- Internationalization (custom i18n system)

**Organization**:
- Feature-based component structure (`features/admin/`, `features/public/`, `shared/`)
- Domain-based hooks (`hooks/api/admin/`, `hooks/api/public/`)
- ACR design system in dedicated folder
- App Router pages follow Next.js conventions

**Patterns**:
- Server components by default
- Client components only when needed (`"use client"`)
- Parallel data fetching with React Suspense
- No external component libraries (copy, don't import)

**See**: [CODE_ORGANIZATION.md](CODE_ORGANIZATION.md), [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

### 2. API Layer
**Technology**: Next.js Route Handlers (App Router API routes)

**Responsibilities**:
- RESTful API endpoints
- Request validation (Zod schemas)
- Response formatting
- Error handling and transformation

**Endpoints**:
```
/api/public/
  parts              # Search parts (public)
  vehicle-options    # Get make/model/year options
  settings           # Get site settings

/api/admin/
  parts              # CRUD parts
  vehicles           # CRUD vehicle applications
  cross-references   # CRUD cross-references
  bulk/              # Bulk operations (create, update, delete)
  export/excel       # Excel export endpoint
  auth/login         # Admin authentication
  settings           # Site settings management
```

**Conventions**:
- One resource per route folder
- Zod validation at entry point
- Consistent response format: `{ success, data, timestamp }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 500 (Server Error)

**See**: [API_DESIGN.md](API_DESIGN.md), [VALIDATION.md](VALIDATION.md)

---

### 3. Service Layer
**Technology**: TypeScript classes with grouped methods

**Responsibilities**:
- Complex business logic
- Multi-step operations
- Pagination bypass (PostgREST limits)
- Data transformation

**Organization**: Services grouped by domain in `src/services/`

**Services**:
- **BulkOperationsService** - Atomic bulk creates/updates/deletes
  - Field mapping (sku_number → acr_sku)
  - Concurrent operations with Promise.all

- **ExcelExportService** - Excel file generation
  - Paginated data fetching (bypass 1000-row limit)
  - Hidden columns for import matching
  - Frozen headers and formatting

**When to Use Service Layer**:
- Multi-table operations
- Complex transformations
- Performance optimizations (pagination, batching)
- Reusable business logic

**See**: [SERVICE_LAYER.md](SERVICE_LAYER.md)

---

### 4. Validation Layer
**Technology**: Zod schemas

**Responsibilities**:
- Request body validation
- Query parameter parsing
- Type inference (Zod → TypeScript)
- Error messages in Spanish/English

**Schema Centralization**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts)

**Pattern**:
```typescript
// 1. Define Zod schema
export const createPartSchema = z.object({
  sku_number: z.string().min(1),
  part_type: z.string().min(1).max(100),
  // ...
});

// 2. Infer TypeScript type
export type CreatePartParams = z.infer<typeof createPartSchema>;

// 3. Validate in API route
const validated = createPartSchema.parse(requestBody);
```

**Benefits**:
- Runtime validation + compile-time types
- Single source of truth
- Automatic error messages
- API contract enforcement

**See**: [VALIDATION.md](VALIDATION.md)

---

### 5. Database Layer
**Technology**: Supabase (PostgreSQL 15) with Row-Level Security

**Schema**:
```
parts
├── id (uuid, PK)
├── acr_sku (text, unique)
├── part_type, position_type, abs_type, drive_type, bolt_pattern
└── specifications, image_url

vehicle_applications
├── id (uuid, PK)
├── part_id (uuid, FK → parts)
├── make, model, start_year, end_year
└── Cascading delete on part deletion

cross_references
├── id (uuid, PK)
├── acr_part_id (uuid, FK → parts)
├── competitor_sku, competitor_brand
└── Cascading delete on part deletion

part_images (future enhancement)
├── id (uuid, PK)
├── part_id (uuid, FK → parts)
├── image_url, is_primary, display_order
└── Cascading delete on part deletion
```

**Design Decisions**:
- UUID primary keys (better for distributed systems)
- Text vs VARCHAR (PostgreSQL treats them the same)
- Cascading deletes (maintain referential integrity)
- Trigram indexing for fuzzy search (pg_trgm extension)
- No reserved words in column names (avoid `position`, `type`)

**See**: [docs/database/DATABASE.md](../database/DATABASE.md)

---

## Data Flow

### Public Search Request (Example)
```
1. User searches "ACR-123" in public UI
   ↓
2. React component calls usePublicParts hook
   ↓
3. TanStack Query checks cache (5min stale time)
   ↓ (cache miss)
4. Fetch request to /api/public/parts?search=ACR-123
   ↓
5. API route validates query params (Zod)
   ↓
6. Supabase query with multi-stage fuzzy search:
   - Exact match on acr_sku
   - Trigram similarity on competitor SKUs
   - Trigram similarity on vehicle make/model
   ↓
7. Enrich results with primary images (no N+1 queries)
   ↓
8. Format response: { success: true, data: [...], timestamp }
   ↓
9. TanStack Query caches result for 5 minutes
   ↓
10. React component renders search results
```

### Admin Bulk Create (Example)
```
1. User uploads Excel file in admin UI
   ↓
2. ExcelJS parses file on client side
   ↓
3. Validation: Check required columns, data types
   ↓
4. POST /api/admin/bulk/parts/create with array of parts
   ↓
5. API route validates with bulkCreatePartsSchema (Zod)
   ↓
6. BulkOperationsService.createParts()
   - Maps fields (sku_number → acr_sku)
   - Atomic insert (PostgreSQL multi-row INSERT)
   ↓
7. Response: { success: true, created: 100, data: [...] }
   ↓
8. Invalidate TanStack Query cache (parts list)
   ↓
9. UI updates with new parts
```

**See**: [DATA_FLOW.md](DATA_FLOW.md)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| **Next.js** | 15 | React framework | App Router, RSC, built-in API routes |
| **React** | 19 | UI library | Industry standard, concurrent features |
| **TypeScript** | 5.8 | Type safety | Catch bugs at compile time |
| **TanStack Query** | 5.x | Server state | Caching, invalidation, optimistic updates |
| **React Hook Form** | 7.x | Form handling | Performance, Zod integration |
| **Zod** | 3.x | Validation | Runtime + compile-time types |
| **Tailwind CSS** | 3.x | Styling | Utility-first, fast development |
| **shadcn/ui** | - | Component base | Copy pattern, not NPM dependency |

### Backend
| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| **Supabase** | Database + Auth | PostgreSQL + RLS, type-safe client |
| **PostgreSQL** | 15 | Relational database | Trigram search, JSON support, reliability |
| **ExcelJS** | - | Excel generation | Hidden columns, formatting, no dependencies |

### Deployment
| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting |
| **Supabase Cloud** | Database |

**See**: [docs/PLANNING.md](../PLANNING.md) for tech stack rationale

---

## Design Principles

### 1. Copy, Don't Import (Components)
**Principle**: Own your component code, don't depend on external libraries

**Why**:
- Maximum customization
- No version lock-in
- No breaking changes from updates

**Example**: shadcn/ui components copied into `src/components/ui/` and customized

**Implementation**:
- ACR design system in `src/components/acr/`
- Tailwind CSS utilities for shared styles
- TypeScript for type safety

---

### 2. Server Components by Default
**Principle**: Use React Server Components unless interactivity is needed

**Why**:
- Faster initial page load
- Smaller JavaScript bundle
- Better SEO
- Direct database access

**When to Use Client Components**:
- Form interactions (onChange, onSubmit)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)
- Event handlers (onClick, onKeyDown)

**Pattern**:
```typescript
// Server Component (default)
export default function ProductList() {
  const products = await fetchProducts(); // Direct fetch
  return <div>...</div>;
}

// Client Component (when needed)
"use client";
export default function SearchForm() {
  const [query, setQuery] = useState("");
  return <form>...</form>;
}
```

---

### 3. Type Safety Everywhere
**Principle**: No `any` types, Zod schemas for all external data

**Why**:
- Catch bugs at compile-time
- Self-documenting code
- Refactoring confidence
- API contract enforcement

**Pattern**:
```
Database → Zod schema → TypeScript type → API → Form
```

**Example**:
```typescript
// 1. Zod schema (runtime validation)
const schema = z.object({ name: z.string() });

// 2. TypeScript type (compile-time)
type Params = z.infer<typeof schema>;

// 3. Validation in API
const validated = schema.parse(request.body);

// 4. Type-safe usage
function createPart(params: Params) { ... }
```

---

### 4. Centralized Query Keys
**Principle**: Single source of truth for TanStack Query cache keys

**Why**:
- Avoid cache invalidation bugs
- Consistent cache hierarchy
- Easy to find all queries for a resource

**File**: [src/hooks/common/queryKeys.ts](../../src/hooks/common/queryKeys.ts)

**Pattern**:
```typescript
queryKeys.parts.all           // ["parts"]
queryKeys.parts.lists()       // ["parts", "list"]
queryKeys.parts.list(filters) // ["parts", "list", { filters }]
queryKeys.parts.detail(id)    // ["parts", "detail", { id }]
```

**Usage**:
```typescript
// Fetch
useQuery({ queryKey: queryKeys.parts.detail(id), ... });

// Invalidate
queryClient.invalidateQueries({ queryKey: queryKeys.parts.lists() });
```

---

### 5. Atomic Operations
**Principle**: Use PostgreSQL's ACID guarantees for data consistency

**Why**:
- No partial failures
- Data integrity
- Simplified error handling

**Example**:
```typescript
// Multi-row INSERT is atomic in PostgreSQL
const { data, error } = await supabase
  .from("parts")
  .insert([part1, part2, part3]) // All or nothing
  .select();

// If error: None are inserted
// If success: All are inserted
```

---

### 6. Fail Fast with Zod
**Principle**: Validate at API boundaries, reject invalid data immediately

**Why**:
- Security (input validation)
- Clear error messages
- No invalid data in database

**Pattern**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body); // Fail fast here

    // Only valid data reaches this point
    const result = await service.create(validated);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    // ...
  }
}
```

---

## Related Documentation

### Architecture Deep Dives
- [CODE_ORGANIZATION.md](CODE_ORGANIZATION.md) - File structure & organizational principles ⭐ **NEW**
- [API_DESIGN.md](API_DESIGN.md) - RESTful patterns, error handling
- [SERVICE_LAYER.md](SERVICE_LAYER.md) - Service pattern, when to use
- [DATA_FLOW.md](DATA_FLOW.md) - Request lifecycle, caching strategy
- [VALIDATION.md](VALIDATION.md) - Zod patterns, type inference
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) - TanStack Query, Context patterns
- [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) - i18n system
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - ACR design system

### Feature Documentation
- [docs/features/](../features/) - Feature-specific docs
- [docs/database/DATABASE.md](../database/DATABASE.md) - Complete schema
- [docs/PLANNING.md](../PLANNING.md) - Tech stack rationale

### Development
- [docs/TASKS.md](../TASKS.md) - Current work and priorities
- [CLAUDE.md](../../CLAUDE.md) - Context for AI assistants

---

**Next**: Dive into [API_DESIGN.md](API_DESIGN.md) to understand RESTful patterns and conventions.
