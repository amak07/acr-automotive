---
title: "Data Flow & Request Lifecycle"
---

# Data Flow & Request Lifecycle

> **Purpose**: Request lifecycle, data flow patterns, and caching strategy
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [Request Lifecycle Overview](#request-lifecycle-overview)
- [Public Search Flow](#public-search-flow)
- [Admin CRUD Flow](#admin-crud-flow)
- [Bulk Operations Flow](#bulk-operations-flow)
- [Excel Export Flow](#excel-export-flow)
- [Caching Strategy](#caching-strategy)
- [Performance Optimizations](#performance-optimizations)

---

## Request Lifecycle Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                             │
│  (Click search, submit form, upload Excel)                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                              │
│  • Form submission / Button click                               │
│  • Calls custom hook (useGetParts, useCreatePart, etc.)        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TANSTACK QUERY                                │
│  • Check cache (staleTime)                                      │
│  • If stale or missing: Execute queryFn/mutationFn             │
│  • Manage loading/error/success states                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FETCH REQUEST                                │
│  • HTTP method (GET/POST/PATCH/DELETE)                          │
│  • Build URL with search params                                 │
│  • Serialize body to JSON                                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API ROUTE                                   │
│  • Extract params/body                                          │
│  • Validate with Zod (fail fast)                                │
│  • Delegate to service (if complex) OR query DB directly        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Optional)                           │
│  • Multi-step operations                                        │
│  • Field transformations                                        │
│  • Pagination loops                                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE CLIENT                               │
│  • Build SQL query                                              │
│  • Apply filters, sorting, pagination                           │
│  • Execute query via PostgREST                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                           │
│  • Execute query with indexes                                   │
│  • Apply RLS policies                                           │
│  • Return results                                               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE PATH                                │
│  API Route → Format response → Return JSON                      │
│  TanStack Query → Cache result → Update component state         │
│  React → Re-render with new data                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Public Search Flow

### Use Case: User searches for "brake rotor" in public catalog

**Step-by-Step**:

```
1. USER TYPES "brake rotor" AND CLICKS SEARCH
   ↓
2. COMPONENT (PublicPartsPage.tsx)
   const { data, isLoading } = usePublicParts({ search: "brake rotor" });
   ↓
3. TANSTACK QUERY (usePublicParts hook)
   • Check cache with key: ["public", "parts", "list", { filters: { search: "brake rotor" } }]
   • Cache MISS (first search) → Execute queryFn
   ↓
4. FETCH REQUEST
   GET /api/public/parts?search=brake+rotor
   ↓
5. API ROUTE (/api/public/parts/route.ts)
   • Extract searchParams: { search: "brake rotor" }
   • Validate with publicPartsQuerySchema
   ↓
6. SUPABASE QUERY
   • Call RPC function: search_parts_fuzzy("brake rotor")
   • Multi-stage search:
     a) Exact match on acr_sku
     b) Fuzzy match on competitor SKUs (trigram similarity)
     c) Fuzzy match on vehicle make/model (trigram similarity)
   ↓
7. POSTGRESQL
   • Execute search with pg_trgm indexes
   • Apply similarity threshold (0.3)
   • Return matching parts (e.g., 25 results)
   ↓
8. ENRICH DATA (API route)
   • Fetch primary images for all parts (single query, no N+1)
   • Group images by part_id
   • Attach primary_image_url to each part
   ↓
9. FORMAT RESPONSE
   {
     "success": true,
     "data": [
       {
         "id": "...",
         "acr_sku": "ACR-BR-001",
         "part_type": "Brake Rotor",
         "primary_image_url": "https://..."
       },
       // ... 24 more
     ],
     "timestamp": "2025-10-25T14:30:00.000Z"
   }
   ↓
10. TANSTACK QUERY
    • Cache result with key (staleTime: 5 minutes)
    • Set state: isLoading=false, data=[...], error=null
    ↓
11. REACT COMPONENT RE-RENDERS
    {data.data.map(part => <PartCard part={part} />)}
    ↓
12. USER SEES 25 RESULTS IN ~200-300ms
```

**File**: [src/app/api/public/parts/route.ts](../../src/app/api/public/parts/route.ts)

---

### Search Performance Optimizations

**1. Trigram Indexes**

```sql
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin (acr_sku gin_trgm_ops);
CREATE INDEX idx_cross_references_competitor_sku_trgm ON cross_references USING gin (competitor_sku gin_trgm_ops);
```

**2. Multi-Stage Search** (Fast → Slow)

```sql
-- Stage 1: Exact match (fastest)
SELECT * FROM parts WHERE acr_sku ILIKE 'ACR-BR-001';

-- Stage 2: Competitor SKU fuzzy match (fast)
SELECT p.* FROM parts p
JOIN cross_references cr ON p.id = cr.acr_part_id
WHERE similarity(cr.competitor_sku, 'brake rotor') > 0.3;

-- Stage 3: Vehicle fuzzy match (slower)
SELECT p.* FROM parts p
JOIN vehicle_applications va ON p.id = va.part_id
WHERE similarity(va.make || ' ' || va.model, 'toyota camry') > 0.3;
```

**3. No N+1 Queries for Images**

```typescript
// ❌ N+1 Query Problem
for (const part of parts) {
  const image = await supabase
    .from("part_images")
    .select("image_url")
    .eq("part_id", part.id)
    .single();
  // 25 parts = 25 queries!
}

// ✅ Single Batch Query
const partIds = parts.map((p) => p.id);
const { data: images } = await supabase
  .from("part_images")
  .select("part_id, image_url")
  .in("part_id", partIds);
// 25 parts = 1 query!
```

**Result**: Sub-300ms search response times.

---

## Admin CRUD Flow

### Use Case: Admin creates a new part

**Step-by-Step**:

```
1. USER FILLS FORM AND CLICKS "CREATE PART"
   ↓
2. FORM VALIDATION (React Hook Form + Zod)
   • Client-side validation with createPartSchema
   • If invalid: Show error messages, STOP
   ↓
3. COMPONENT (CreatePartForm.tsx)
   const createPart = useCreatePart();
   await createPart.mutateAsync(formData);
   ↓
4. TANSTACK QUERY MUTATION
   • Set state: isPending=true
   • Execute mutationFn
   ↓
5. FETCH REQUEST
   POST /api/admin/parts
   Content-Type: application/json
   Body: {
     "sku_number": "ACR-NEW-001",
     "part_type": "Brake Rotor",
     "position_type": "Front",
     ...
   }
   ↓
6. API ROUTE (/api/admin/parts/route.ts)
   • Extract body: await request.json()
   • Validate with createPartSchema.parse(body)
   • If invalid: Return 400 with Zod errors, STOP
   ↓
7. FIELD MAPPING (API route)
   • Transform API names → DB names
   • sku_number → acr_sku
   • Keep rest as-is
   ↓
8. SUPABASE INSERT
   const { data, error } = await supabase
     .from("parts")
     .insert({
       acr_sku: "ACR-NEW-001",
       part_type: "Brake Rotor",
       position_type: "Front",
       ...
     })
     .select()
     .single();
   ↓
9. POSTGRESQL
   • Validate constraints (unique acr_sku)
   • Insert row with generated UUID
   • Return inserted row with ID
   ↓
10. FORMAT RESPONSE
    {
      "success": true,
      "data": {
        "id": "123e4567-...",
        "acr_sku": "ACR-NEW-001",
        "part_type": "Brake Rotor",
        ...
      }
    }
    Status: 201 Created
    ↓
11. TANSTACK QUERY MUTATION SUCCESS
    • onSuccess callback fires
    • Invalidate cache: queryClient.invalidateQueries(queryKeys.admin.parts())
    ↓
12. CACHE INVALIDATION
    • All queries with key ["admin", "parts"] marked stale
    • Active queries refetch automatically
    • Parts list updates with new part
    ↓
13. COMPONENT RE-RENDERS
    • isPending=false
    • Show success toast
    • Form resets
    • User sees new part in list immediately
```

**Files**:

- Hook: [src/hooks/admin/useCreatePart.ts](../../src/hooks/admin/useCreatePart.ts)
- API: [src/app/api/admin/parts/route.ts](../../src/app/api/admin/parts/route.ts)

---

### Update Flow (PATCH)

**Key Difference**: Partial updates, ID required.

```
1. USER EDITS PART AND CLICKS "SAVE"
   ↓
2. VALIDATION (updatePartSchema)
   • All fields optional (partial update)
   • ID is required
   ↓
3. FETCH REQUEST
   PATCH /api/admin/parts
   Body: {
     "id": "123e4567-...",
     "part_type": "Brake Pad"  // Only changed field
   }
   ↓
4. SUPABASE UPDATE
   .update({ part_type: "Brake Pad" })
   .eq("id", "123e4567-...")
   ↓
5. CACHE INVALIDATION
   • Invalidate specific part: queryKeys.parts.detail(id)
   • Invalidate parts list: queryKeys.parts.lists()
   ↓
6. UI UPDATES
   • Part detail page shows new data
   • Parts list shows updated part
```

---

### Delete Flow (DELETE)

**Key Difference**: Cascading deletes handled by PostgreSQL.

```
1. USER CLICKS "DELETE" AND CONFIRMS
   ↓
2. FETCH REQUEST
   DELETE /api/admin/parts?id=123e4567-...
   ↓
3. SUPABASE DELETE
   .delete()
   .eq("id", "123e4567-...")
   ↓
4. POSTGRESQL CASCADING DELETE
   • Delete part row
   • Cascade: Delete all vehicle_applications (ON DELETE CASCADE)
   • Cascade: Delete all cross_references (ON DELETE CASCADE)
   • Cascade: Delete all part_images (ON DELETE CASCADE)
   ↓
5. CACHE INVALIDATION
   • Invalidate parts list
   • Remove from cache: queryKeys.parts.detail(id)
   ↓
6. UI UPDATES
   • Redirect to parts list
   • Part no longer appears
```

**Database Schema** (CASCADE):

```sql
CREATE TABLE vehicle_applications (
  id UUID PRIMARY KEY,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  ...
);
```

**See**: [docs/database/DATABASE.md](../database/DATABASE.md)

---

## Bulk Operations Flow

### Use Case: Admin creates 100 parts via Excel import

**Step-by-Step**:

```
1. USER UPLOADS EXCEL FILE
   ↓
2. CLIENT-SIDE PARSING (ExcelJS)
   • Read file buffer
   • Parse rows to JSON
   • Validate required columns
   ↓
3. CLIENT-SIDE VALIDATION (Zod)
   • Validate each row with createPartSchema
   • Collect errors with row numbers
   • If errors: Show error summary, STOP
   ↓
4. FETCH REQUEST
   POST /api/admin/bulk/parts/create
   Body: {
     "parts": [
       { "sku_number": "ACR-001", "part_type": "Brake Rotor" },
       { "sku_number": "ACR-002", "part_type": "Brake Pad" },
       // ... 98 more
     ]
   }
   ↓
5. API ROUTE (/api/admin/bulk/parts/create/route.ts)
   • Validate with bulkCreatePartsSchema
   • Delegate to BulkOperationsService
   ↓
6. SERVICE LAYER (BulkOperationsService.createParts)
   • Map fields for all parts (sku_number → acr_sku)
   • Prepare array of database rows
   ↓
7. ATOMIC BULK INSERT (Supabase)
   const { data, error } = await supabase
     .from("parts")
     .insert([part1, part2, ..., part100])  // Single query
     .select();
   ↓
8. POSTGRESQL ATOMIC TRANSACTION
   • BEGIN TRANSACTION (implicit)
   • Insert 100 rows
   • If ANY row fails: ROLLBACK all
   • If ALL succeed: COMMIT all
   • RETURN all inserted rows
   ↓
9. SERVICE RESPONSE
   {
     success: true,
     created: 100,
     data: [part1, part2, ..., part100]
   }
   ↓
10. API RESPONSE
    Status: 201 Created
    {
      "success": true,
      "created": 100,
      "data": [...]
    }
    ↓
11. CACHE INVALIDATION
    • Invalidate parts list
    • Invalidate admin stats (new count)
    ↓
12. UI UPDATE
    • Show success message: "100 parts created"
    • Refresh parts list
    • All 100 parts appear
```

**File**: [src/lib/services/BulkOperationsService.ts](../../src/lib/services/BulkOperationsService.ts)

---

### Atomicity Guarantee

**PostgreSQL Multi-Row INSERT is Atomic**:

```typescript
// This is ALL or NOTHING
const { data, error } = await supabase.from("parts").insert([
  { acr_sku: "ACR-001", part_type: "Brake Rotor" },
  { acr_sku: "ACR-002", part_type: "Brake Pad" },
  { acr_sku: "ACR-001", part_type: "Brake Caliper" }, // DUPLICATE SKU
]);

// Result: error = "duplicate key value violates unique constraint"
// ALL rows rolled back, NONE inserted
```

**Why This Matters**:

- No partial failures
- Database stays consistent
- Easier error handling (no cleanup needed)

---

## Excel Export Flow

### Use Case: Admin exports 9,600 parts to Excel

**Challenge**: PostgREST limits responses to 1,000 rows.

**Solution**: Service layer pagination bypass.

**Step-by-Step**:

```
1. USER CLICKS "EXPORT TO EXCEL"
   ↓
2. FETCH REQUEST
   POST /api/admin/export/excel
   Body: {
     "filters": {
       "part_type": "Brake Rotor"  // Optional filters
     }
   }
   ↓
3. API ROUTE (/api/admin/export/excel/route.ts)
   • Delegate to ExcelExportService
   ↓
4. SERVICE LAYER (ExcelExportService.exportPartsToExcel)

   PAGINATION LOOP:
   ├─ ITERATION 1:
   │  ├─ Fetch rows 0-999 (offset=0, limit=1000)
   │  ├─ Got 1,000 rows → continue
   │  └─ allParts = [1000 rows]
   │
   ├─ ITERATION 2:
   │  ├─ Fetch rows 1000-1999 (offset=1000, limit=1000)
   │  ├─ Got 1,000 rows → continue
   │  └─ allParts = [2000 rows]
   │
   ├─ ... (ITERATIONS 3-9)
   │
   └─ ITERATION 10:
      ├─ Fetch rows 9000-9999 (offset=9000, limit=1000)
      ├─ Got 600 rows → STOP (less than limit)
      └─ allParts = [9600 rows]
   ↓
5. WORKBOOK GENERATION (ExcelJS)
   • Create workbook
   • Add worksheet "Parts"
   • Add headers with hidden ID column
   • Freeze first row
   • Add 9,600 data rows
   ↓
6. BUFFER GENERATION
   • Generate Excel file as Buffer
   • Return { success: true, buffer }
   ↓
7. API RESPONSE
   Status: 200 OK
   Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   Content-Disposition: attachment; filename="parts-export.xlsx"
   Body: [Buffer]
   ↓
8. BROWSER DOWNLOAD
   • Browser receives file buffer
   • Shows download dialog
   • User saves "parts-export.xlsx"
   ↓
9. TOTAL TIME: ~2-3 seconds for 9,600 parts
```

**File**: [src/lib/services/ExcelExportService.ts](../../src/lib/services/ExcelExportService.ts)

**See**: [docs/features/data-management/EXCEL_EXPORT.md](../features/data-management/EXCEL_EXPORT.md)

---

### Pagination Bypass Pattern

```typescript
async function fetchAllParts() {
  const allParts = [];
  let offset = 0;
  const limit = 1000; // PostgREST max

  while (true) {
    const { data: parts, error } = await supabase
      .from("parts")
      .select("*")
      .range(offset, offset + limit - 1)
      .order("acr_sku", { ascending: true });

    if (error) throw error;
    if (!parts || parts.length === 0) break; // No more data

    allParts.push(...parts);

    if (parts.length < limit) break; // Last page (incomplete)

    offset += limit;
  }

  return allParts; // All rows fetched
}
```

**Performance**: 10 queries for 9,600 parts (sequential, ~200-300ms total).

---

## Caching Strategy

### TanStack Query Cache Layers

```
┌─────────────────────────────────────────────────────────┐
│                    COMPONENT MOUNT                      │
│  useGetParts({ search: "brake" })                       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              CHECK CACHE (by query key)                 │
│  Key: ["parts", "list", { filters: { search: "brake" }}]│
└──────────────────────────┬──────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
         Cache HIT                Cache MISS
         (data exists)            (no data)
                  │                 │
                  ▼                 ▼
         ┌────────────────┐  ┌──────────────┐
         │ Check staleness│  │ Execute fetch│
         └────────┬───────┘  └──────┬───────┘
                  │                 │
          ┌───────┴────────┐        │
          │                │        │
    Data FRESH       Data STALE     │
  (< staleTime)    (> staleTime)    │
          │                │        │
          ▼                ▼        ▼
   ┌─────────────┐  ┌────────────────────┐
   │Return cached│  │Background refetch  │
   │No network   │  │Return cached       │
   │(instant)    │  │Update when complete│
   └─────────────┘  └────────────────────┘
```

---

### Stale Time Strategy

**Parts List** (Medium Change Frequency):

```typescript
useQuery({
  queryKey: queryKeys.parts.list(filters),
  queryFn: fetchParts,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

**Timeline**:

- **0:00 - 5:00**: Data FRESH (no refetch on remount)
- **5:00 - 10:00**: Data STALE (background refetch on remount)
- **10:00+**: Data GARBAGE COLLECTED (removed from memory)

**Site Settings** (Low Change Frequency):

```typescript
useQuery({
  queryKey: ["settings"],
  queryFn: fetchSettings,
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
});
```

**Stats** (High Change Frequency):

```typescript
useQuery({
  queryKey: ["admin", "stats"],
  queryFn: fetchStats,
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 60 * 1000, // 1 minute
});
```

---

### Cache Invalidation Patterns

**After Create**:

```typescript
onSuccess: () => {
  // Invalidate lists (new item added)
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.lists(),
  });

  // Invalidate stats (count changed)
  queryClient.invalidateQueries({
    queryKey: queryKeys.admin.stats(),
  });
};
```

**After Update**:

```typescript
onSuccess: (_, variables) => {
  // Invalidate specific item
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.detail(variables.id),
  });

  // Invalidate lists (item might have moved in sort)
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.lists(),
  });
};
```

**After Delete**:

```typescript
onSuccess: (_, variables) => {
  // Remove from cache
  queryClient.removeQueries({
    queryKey: queryKeys.parts.detail(variables.id),
  });

  // Invalidate lists
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.lists(),
  });

  // Invalidate related data
  invalidatePartRelatedQueries(queryClient, variables.id);
};
```

---

## Performance Optimizations

### 1. Batch Image Fetching (No N+1)

**Problem**: Fetching images for each part separately.

```typescript
// ❌ N+1 Queries
for (const part of parts) {
  const image = await fetchImage(part.id); // 25 queries!
}
```

**Solution**: Single batch query.

```typescript
// ✅ Single Batch Query
const partIds = parts.map((p) => p.id);
const images = await supabase
  .from("part_images")
  .select("part_id, image_url")
  .in("part_id", partIds);

const imagesByPartId = groupBy(images, "part_id");
```

---

### 2. Parallel Independent Operations

**Problem**: Sequential operations when they could be parallel.

```typescript
// ❌ Sequential (slow)
await createPart1();
await createPart2();
await createPart3();
// Total: 3 x query time
```

**Solution**: Parallel with Promise.all.

```typescript
// ✅ Parallel (fast)
await Promise.all([createPart1(), createPart2(), createPart3()]);
// Total: 1 x query time (concurrent)
```

---

### 3. Pagination for Large Lists

**Client-Side Pagination** (all data at once):

```typescript
// ❌ Fetch all 9,600 parts at once
const { data } = await supabase.from("parts").select("*");
// Problem: Large payload, slow initial load
```

**Server-Side Pagination** (page by page):

```typescript
// ✅ Fetch 50 parts at a time
const { data, count } = await supabase
  .from("parts")
  .select("*", { count: "exact" })
  .range(0, 49); // First page

// Fast initial load, user can paginate
```

---

### 4. Index Usage

**Trigram Indexes for Fuzzy Search**:

```sql
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin (acr_sku gin_trgm_ops);
```

**B-tree Indexes for Exact Match**:

```sql
CREATE UNIQUE INDEX idx_parts_acr_sku ON parts (acr_sku);
CREATE INDEX idx_vehicle_applications_part_id ON vehicle_applications (part_id);
```

**See**: [docs/database/DATABASE.md](../database/DATABASE.md#indexes)

---

## Related Documentation

- [API_DESIGN.md](API_DESIGN.md) - API endpoint patterns
- [SERVICE_LAYER.md](SERVICE_LAYER.md) - Service layer role in data flow
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) - Client-side caching
- [VALIDATION.md](VALIDATION.md) - Request validation in lifecycle
- [docs/database/DATABASE.md](../database/DATABASE.md) - Database schema

---

**Next**: Read [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) to understand the i18n system architecture.
