# Search System

> **Purpose**: Core search functionality for ACR Automotive - dual-mode search (vehicle-based and SKU-based) with intelligent fallback and fuzzy matching
>
> **Status**: ✅ Production
> **Last Updated**: 2025-11-08
> **Performance Target**: Sub-300ms response times

## Table of Contents

- [Overview](#overview)
- [Search Modes](#search-modes)
  - [SKU Normalization Rules (Migration 009)](#2a-sku-normalization-rules-migration-009)
- [Architecture](#architecture)
- [Database Functions](#database-functions)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Performance Optimizations](#performance-optimizations)
- [Examples](#examples)

---

## Overview

**Business Problem**: Parts counter staff need to quickly find ACR parts when customers provide either:
1. Competitor part numbers (SKU-based search)
2. Vehicle information (Make, Model, Year)

**Solution**: Dual-mode search system with intelligent matching algorithms that handle typos, competitor SKUs, and vehicle compatibility.

### Key Features

- **Dual Search Modes**: Vehicle-based or SKU-based lookup
- **Multi-Stage Fallback**: Exact match → Competitor cross-reference → Fuzzy match
- **Trigram Similarity**: Handles typos and variations (PostgreSQL pg_trgm)
- **Image Enrichment**: Single-query batch fetch (no N+1 queries)
- **Cascading Dropdowns**: Make → Model → Year progressive refinement
- **Sub-300ms Performance**: Optimized indexes and query patterns

### Search Statistics

- **Database Size**: 9,600+ parts, 18,000+ vehicle applications, 6,000+ cross-references
- **Average Response Time**: ~150ms (target: <300ms)
- **Search Types**: 3 (exact ACR, competitor SKU, fuzzy match)
- **Supported Vehicles**: 100+ makes, 500+ models, 15+ year ranges

---

## Search Modes

### 1. Vehicle-Based Search

**Use Case**: "I need brake parts for a 2018 Honda Civic"

**Flow**:
```
User selects Make → Models filtered → User selects Model → Years filtered → User selects Year → Search executes
```

**Example**:
```
Make: HONDA
Model: CIVIC
Year: 2018

→ Returns all parts compatible with 2018 Honda Civic
```

**Database Query**: Uses `search_by_vehicle()` PostgreSQL function

---

### 2. SKU-Based Search

**Use Case**: "Customer has competitor part number TM512342"

**✨ NEW (Migration 009)**: SKU Normalization Layer - Searches now work regardless of formatting!

**6-Stage Search Algorithm with Normalization**:

```
1. EXACT NORMALIZED ACR SKU MATCH (Priority 1)
   ├─ Input: "ACR-15002" or "acr 15002" or "ACR15002"
   ├─ Normalized: "ACR15002" (uppercase, no special chars)
   ├─ Search: parts.acr_sku_normalized = normalize_sku(input)
   ├─ Match Type: "exact_normalized_acr"
   └─ Similarity: 1.0 (perfect)

2. ACR SKU WITH PREFIX ADDED (Priority 2)
   ├─ Input: "15002" (missing ACR prefix)
   ├─ Normalized: "ACR" + "15002" = "ACR15002"
   ├─ Search: parts.acr_sku_normalized = 'ACR' || normalize_sku(input)
   ├─ Match Type: "with_acr_prefix"
   └─ Similarity: 0.95 (auto-prefix applied)

3. PARTIAL NORMALIZED ACR MATCH (Priority 3)
   ├─ Input: "1500" (partial SKU)
   ├─ Search: parts.acr_sku_normalized LIKE '%1500%'
   ├─ Match Type: "partial_acr"
   ├─ Similarity: 0.9
   └─ Limit: 10 results

4. EXACT NORMALIZED COMPETITOR SKU (Priority 4)
   ├─ Input: "TM-512348" or "tm 512348"
   ├─ Normalized: "TM512348"
   ├─ Search: cross_references.competitor_sku_normalized = normalize_sku(input)
   ├─ Match Type: "exact_competitor"
   └─ Similarity: 1.0 (perfect)

5. PARTIAL NORMALIZED COMPETITOR (Priority 5)
   ├─ Input: "5123" (partial competitor SKU)
   ├─ Search: cross_references.competitor_sku_normalized LIKE '%5123%'
   ├─ Match Type: "partial_competitor"
   ├─ Similarity: 0.85
   └─ Limit: 10 results

6. FUZZY MATCH FALLBACK (Priority 6)
   ├─ Uses ORIGINAL (non-normalized) SKUs for trigram similarity
   ├─ Search: Trigram similarity > 0.6
   ├─ Handles typos: "TM51234" → "TM512348"
   ├─ Match Type: "fuzzy"
   └─ Similarity: 0.6-1.0 (ranked by score)
```

**Example Searches**:
```typescript
// Exact ACR SKU (various formats - all work!)
"ACR-BR-001"  → Finds "ACR-BR-001" (match_type: "exact_normalized_acr")
"acr-br-001"  → Finds "ACR-BR-001" (match_type: "exact_normalized_acr")
"ACR BR 001"  → Finds "ACR-BR-001" (match_type: "exact_normalized_acr")
"ACRBR001"    → Finds "ACR-BR-001" (match_type: "exact_normalized_acr")

// Missing ACR prefix (auto-added)
"15002"       → Finds "ACR-15002" (match_type: "with_acr_prefix")
"BR-001"      → Finds "ACR-BR-001" (match_type: "with_acr_prefix")

// Competitor SKU (various formats)
"TM-512348"   → Finds ACR part via cross-ref (match_type: "exact_competitor")
"tm 512348"   → Finds ACR part via cross-ref (match_type: "exact_competitor")
"TM512348"    → Finds ACR part via cross-ref (match_type: "exact_competitor")

// Partial matches
"1500"        → Finds "ACR-15002", "ACR-15003", ... (match_type: "partial_acr")
"BR"          → Finds all brake parts (match_type: "partial_acr")

// Typo/Fuzzy (fallback only)
"ACR-BR-01"   → Finds "ACR-BR-001" (match_type: "fuzzy", similarity: 0.91)
```

---

### 2a. SKU Normalization Rules (Migration 009)

**Added**: November 2025 (Migration 009)

**Purpose**: Enable flexible SKU searching regardless of user input format

#### Normalization Function: `normalize_sku(input TEXT)`

**Algorithm**:
```sql
UPPER(REGEXP_REPLACE(input_sku, '[^A-Za-z0-9]', '', 'g'))
```

**Rules**:
1. **Remove all non-alphanumeric characters**: Strips spaces, hyphens, underscores, special chars
2. **Convert to uppercase**: Case-insensitive matching
3. **Return NULL for NULL input**: Graceful handling

#### Normalization Examples

| Input Format | Normalized Output | Notes |
|--------------|-------------------|-------|
| `ACR-15002` | `ACR15002` | Removes hyphen |
| `acr-15002` | `ACR15002` | Uppercase + remove hyphen |
| `acr 15002` | `ACR15002` | Removes spaces |
| `ACR 15002` | `ACR15002` | Mixed case + spaces |
| `15002` | `15002` | No prefix (Strategy 2 adds ACR) |
| `ACR#15002!` | `ACR15002` | Removes special characters |
| `ACR-BR-001` | `ACRBR001` | Removes multiple hyphens |
| `TM-512348` | `TM512348` | Competitor SKU normalization |
| `tm 512348` | `TM512348` | Lowercase competitor SKU |
| `Timken-512348` | `TIMKEN512348` | Brand name normalization |

#### Database Schema Changes

**New Columns** (auto-populated via triggers):
```sql
-- parts table
ALTER TABLE parts ADD COLUMN acr_sku_normalized VARCHAR(50);

-- cross_references table
ALTER TABLE cross_references ADD COLUMN competitor_sku_normalized VARCHAR(50);
```

**Triggers** (auto-maintain normalized values):
```sql
CREATE TRIGGER trigger_normalize_part_sku
BEFORE INSERT OR UPDATE ON parts
FOR EACH ROW
EXECUTE FUNCTION update_normalized_sku();

CREATE TRIGGER trigger_normalize_cross_ref_sku
BEFORE INSERT OR UPDATE ON cross_references
FOR EACH ROW
EXECUTE FUNCTION update_normalized_competitor_sku();
```

**Indexes** (fast normalized lookups):
```sql
-- Exact normalized ACR SKU lookups
CREATE INDEX idx_parts_acr_sku_normalized ON parts(acr_sku_normalized)
WHERE acr_sku_normalized IS NOT NULL;

-- Exact normalized competitor SKU lookups
CREATE INDEX idx_cross_ref_competitor_sku_normalized
ON cross_references(competitor_sku_normalized)
WHERE competitor_sku_normalized IS NOT NULL;

-- Composite index for optimized cross-reference joins
CREATE INDEX idx_cross_ref_normalized_with_part
ON cross_references(competitor_sku_normalized, acr_part_id)
WHERE competitor_sku_normalized IS NOT NULL;
```

#### Why Keep Fuzzy Search on Original Values?

**Design Decision**: Fuzzy matching (Strategy 6) uses **original** SKU values, not normalized

**Rationale**:
- Normalization removes context (hyphens, spacing) useful for similarity matching
- Trigram similarity works better on formatted strings
- Example: "ACR-BR-001" vs "ACR-BR-01" has higher similarity than "ACRBR001" vs "ACRBR01"

**Performance Characteristics**:
- **Normalized exact matches**: 50-100ms (index lookup)
- **Partial matches**: 100-150ms (LIKE with index)
- **Fuzzy fallback**: 150-180ms (trigram index scan)

#### Constraint Validation

**ACR Prefix Enforcement**:
```sql
ALTER TABLE parts
ADD CONSTRAINT check_acr_sku_prefix
CHECK (acr_sku ~* '^ACR');
```
- All ACR SKUs must start with "ACR" (case-insensitive)
- Migration 009 automatically fixed SKUs without prefix by prepending "ACR"

#### Input Validation Architecture

**Layered Validation Approach**:

**API Layer** (Primary Protection):
- Location: `src/lib/schemas/public.ts`
- Validates empty/whitespace searches via Zod schema
- Trims input and enforces minimum 1 character
- All production traffic flows through this layer

**Database Layer** (Permissive by Design):
- RPC functions allow empty strings (flexible for direct access)
- No crashes on edge cases
- Optimized for performance, not validation

**Why This Design?**
- Single source of truth for validation (API layer)
- Database remains flexible for power users/internal tools
- Better separation of concerns
- Simpler architecture

---

### 3. Combined Search (Advanced)

**Future Enhancement**: Search by SKU + filter by vehicle

```typescript
// Not yet implemented
{
  sku_term: "brake",
  make: "HONDA",
  model: "CIVIC",
  year: "2018"
}
```

---

## Architecture

### System Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  PublicSearchFilters Component (Vehicle dropdowns OR SKU)    │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP GET request
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    API ROUTE LAYER                           │
│  /api/public/parts (route.ts)                                │
│  • Validate params (Zod)                                     │
│  • Route to SKU or Vehicle search                            │
│  • Enrich with images (batch query)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │ RPC function call
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  DATABASE FUNCTIONS                          │
│  search_by_sku(TEXT) OR search_by_vehicle(TEXT, TEXT, INT)  │
│  • Multi-stage search algorithm                              │
│  • Trigram similarity matching                               │
│  • Returns parts with match metadata                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ SQL query execution
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   POSTGRESQL TABLES                          │
│  parts, vehicle_applications, cross_references               │
│  • Trigram indexes (pg_trgm)                                 │
│  • Foreign key relationships                                 │
│  • Optimized for sub-300ms queries                           │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Example

**SKU Search**: "TM512342"

```
1. User types "TM512342" in search box
   ↓
2. Frontend: usePublicParts({ sku_term: "TM512342" })
   ↓
3. HTTP GET: /api/public/parts?sku_term=TM512342
   ↓
4. API validates params with publicSearchSchema (Zod)
   ↓
5. API calls: supabase.rpc("search_by_sku", { search_sku: "TM512342" })
   ↓
6. PostgreSQL search_by_sku function:
   a) Check exact ACR SKU match → NOT FOUND
   b) Check cross_references table → FOUND! (ACR-BR-001)
   c) Return: { match_type: "competitor_sku", similarity: 1.0 }
   ↓
7. API enriches results with primary images (1 batch query)
   ↓
8. API returns: { data: [part with image], count: 1, search_type: "sku" }
   ↓
9. Frontend renders part card with image
```

**Response Time**: ~150ms (well under 300ms target)

---

## Database Functions

### search_by_sku(TEXT)

**File**: [src/lib/supabase/migrations/009_add_sku_normalization.sql](../../../src/lib/supabase/migrations/009_add_sku_normalization.sql)

**Purpose**: Intelligent SKU search with normalization and 6-stage fallback

**✨ Enhanced**: Migration 009 (November 2025) - Added normalization layer

**Signature**:
```sql
CREATE OR REPLACE FUNCTION search_by_sku(search_sku TEXT)
RETURNS TABLE (
    id UUID,
    acr_sku VARCHAR(50),
    part_type VARCHAR(100),
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(50),
    specifications TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    match_type TEXT,          -- "exact_normalized_acr" | "with_acr_prefix" | "partial_acr" |
                              -- "exact_competitor" | "partial_competitor" | "fuzzy"
    similarity_score REAL     -- 0.6 to 1.0
)
```

**Algorithm (6-Stage with Normalization)**:
```sql
-- Normalize user input once
normalized_input := normalize_sku(search_sku);

-- Step 1: Exact normalized ACR SKU match (highest priority)
SELECT * FROM parts WHERE acr_sku_normalized = normalized_input
-- Returns: match_type = 'exact_normalized_acr', similarity = 1.0

-- Step 2: ACR SKU with prefix added (if Step 1 found nothing)
SELECT * FROM parts WHERE acr_sku_normalized = 'ACR' || normalized_input
-- Returns: match_type = 'with_acr_prefix', similarity = 0.95

-- Step 3: Partial normalized ACR match (if Steps 1-2 found nothing)
SELECT * FROM parts
WHERE acr_sku_normalized LIKE '%' || normalized_input || '%'
LIMIT 10
-- Returns: match_type = 'partial_acr', similarity = 0.9

-- Step 4: Exact normalized competitor SKU (if Steps 1-3 found nothing)
SELECT p.* FROM parts p
JOIN cross_references cr ON p.id = cr.acr_part_id
WHERE cr.competitor_sku_normalized = normalized_input
-- Returns: match_type = 'exact_competitor', similarity = 1.0

-- Step 5: Partial normalized competitor match (if Steps 1-4 found nothing)
SELECT p.* FROM parts p
JOIN cross_references cr ON p.id = cr.acr_part_id
WHERE cr.competitor_sku_normalized LIKE '%' || normalized_input || '%'
LIMIT 10
-- Returns: match_type = 'partial_competitor', similarity = 0.85

-- Step 6: Fuzzy match using ORIGINAL SKUs (if Steps 1-5 found nothing)
SELECT p.*, similarity(p.acr_sku, search_sku) AS similarity_score
FROM parts p
WHERE similarity(p.acr_sku, search_sku) > 0.6
UNION
SELECT p.*, similarity(cr.competitor_sku, search_sku) AS similarity_score
FROM parts p
JOIN cross_references cr ON p.id = cr.acr_part_id
WHERE similarity(cr.competitor_sku, search_sku) > 0.6
ORDER BY similarity_score DESC LIMIT 10
-- Returns: match_type = 'fuzzy', similarity = 0.6-1.0
```

**Performance**:
- Uses normalized column indexes for Steps 1-5 (50-150ms)
- Uses GIN trigram indexes for Step 6 fallback (150-180ms)
- Average: ~100ms for normalized matches, ~180ms for fuzzy fallback

---

### search_by_vehicle(TEXT, TEXT, INT)

**File**: [src/lib/supabase/schema.sql](../../../src/lib/supabase/schema.sql)

**Purpose**: Find all parts compatible with specific vehicle

**Signature**:
```sql
CREATE OR REPLACE FUNCTION search_by_vehicle(
    make TEXT,
    model TEXT,
    target_year INT
)
RETURNS TABLE (
    id UUID,
    acr_sku VARCHAR(50),
    part_type VARCHAR(100),
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(50),
    specifications TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

**Algorithm**:
```sql
SELECT p.*
FROM parts p
JOIN vehicle_applications va ON p.id = va.part_id
WHERE va.make = 'HONDA'
  AND va.model = 'CIVIC'
  AND 2018 BETWEEN va.start_year AND va.end_year
-- Returns: All parts compatible with 2018 Honda Civic
```

**Year Range Handling**: Uses `BETWEEN start_year AND end_year` for flexibility

**Example**:
```sql
-- Vehicle application: Honda Civic 2016-2020
-- User searches: 2018
-- Result: MATCH (2018 is between 2016 and 2020)

-- User searches: 2015
-- Result: NO MATCH (2015 is before 2016)
```

---

## API Endpoints

### GET /api/public/parts

**File**: [src/app/api/public/parts/route.ts](../../../src/app/api/public/parts/route.ts)

**Purpose**: Main search endpoint with dual-mode support

**Query Parameters**:
```typescript
{
  // Vehicle Search
  make?: string;        // e.g., "HONDA"
  model?: string;       // e.g., "CIVIC"
  year?: string;        // e.g., "2018"

  // SKU Search
  sku_term?: string;    // e.g., "TM512342" or "ACR-BR-001"

  // Pagination
  limit?: number;       // Default: 15
  offset?: number;      // Default: 0

  // Single Part Lookup
  id?: string;          // UUID for specific part
}
```

**Response Format**:
```typescript
{
  data: PartSearchResult[];  // Parts with primary_image_url
  count: number;             // Total results for pagination
  search_type?: "sku" | "vehicle";  // Which search mode was used
}

type PartSearchResult = DatabasePartRow & {
  primary_image_url: string | null;  // Enriched with image
  match_type?: "exact_acr" | "competitor_sku" | "fuzzy";  // SKU search only
  similarity_score?: number;  // SKU search only (0.3-1.0)
};
```

---

### GET /api/public/vehicle-options

**File**: [src/app/api/public/vehicle-options/route.ts](../../../src/app/api/public/vehicle-options/route.ts)

**Purpose**: Populate cascading dropdown filters

**Response Format**:
```typescript
{
  success: true,
  data: {
    makes: string[];                    // ["ACURA", "HONDA", "TOYOTA", ...]
    models: { [make: string]: string[] };  // { "HONDA": ["ACCORD", "CIVIC", ...] }
    years: { [makeModel: string]: number[] };  // { "HONDA-CIVIC": [2023, 2022, 2021, ...] }
  },
  timestamp: string;
}
```

**Algorithm**:
```typescript
// 1. Fetch all vehicle_applications (paginated batches of 1000)
const vehicles = await getAllVehicles();

// 2. Extract unique makes
const makes = [...new Set(vehicles.map(v => v.make))].sort();

// 3. Group models by make
const models = { "HONDA": ["ACCORD", "CIVIC"], ... };

// 4. Generate years from year ranges
for (let year = start_year; year <= end_year; year++) {
  years["HONDA-CIVIC"].add(year);
}

// 5. Sort years newest first
years["HONDA-CIVIC"] = [2023, 2022, 2021, ...];
```

**Caching**: This endpoint is cached client-side (TanStack Query staleTime: 15 minutes)

---

## Frontend Components

### PublicSearchFilters

**File**: [src/components/public/search/PublicSearchFilters.tsx](../../../src/components/public/search/PublicSearchFilters.tsx)

**Purpose**: Dual-mode search interface with cascading dropdowns

**UI Structure**:
```
┌─────────────────────────────────────────────────┐
│  🔍 Search by Vehicle                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Make ▼  │ │ Model ▼  │ │  Year ▼  │ 🔍    │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                  │
│  ────────────── OR ──────────────                │
│                                                  │
│  🔍 Search by SKU / Part Number                 │
│  ┌─────────────────────────────────────┐ 🔍    │
│  │ Enter competitor SKU or ACR part... │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Cascading Logic**:
```typescript
// Make selected → Enable model dropdown → Filter models by make
const filteredModels = vehicleOptions?.models[selectedMake] || [];

// Model selected → Enable year dropdown → Filter years by make-model
const makeModelKey = `${selectedMake}-${selectedModel}`;
const filteredYears = vehicleOptions?.years[makeModelKey] || [];
```

**Search Trigger**:
```typescript
// Vehicle search: All three fields required
if (make && model && year) {
  setSearchTerms({ make, model, year, sku_term: "" });
}

// SKU search: Any text triggers search
if (sku_term.length > 0) {
  setSearchTerms({ make: "", model: "", year: "", sku_term });
}
```

---

### usePublicParts Hook

**File**: [src/hooks/public/usePublicParts.ts](../../../src/hooks/public/usePublicParts.ts)

**Purpose**: TanStack Query hook for search with caching

**Usage**:
```typescript
const { data, isLoading, error } = usePublicParts({
  make: "HONDA",
  model: "CIVIC",
  year: "2018",
  limit: 15,
  offset: 0
});

// Or SKU search
const { data, isLoading, error } = usePublicParts({
  sku_term: "TM512342",
  limit: 15,
  offset: 0
});
```

**Caching Strategy**:
```typescript
useQuery({
  queryKey: ["public", "parts", "list", { filters: searchTerms }],
  queryFn: async () => { /* fetch */ },
  staleTime: 5 * 60 * 1000,  // 5 minutes (search results stay fresh)
  gcTime: 10 * 60 * 1000,    // 10 minutes (keep in memory)
});
```

---

## Performance Optimizations

### 1. Trigram Indexes

**Purpose**: Enable sub-300ms fuzzy search on 9,600+ parts

**Implementation**:
```sql
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for trigram similarity
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin (acr_sku gin_trgm_ops);
CREATE INDEX idx_cross_references_competitor_sku_trgm
  ON cross_references USING gin (competitor_sku gin_trgm_ops);
```

**Performance Impact**:
- Without index: ~2000ms (full table scan)
- With trigram index: ~150ms (index scan)

**See**: [docs/database/DATABASE.md](../../database/DATABASE.md#indexes)

---

### 2. Image Enrichment (No N+1 Queries)

**Problem**: Fetching images for 15 parts = 15 separate queries (slow!)

**Solution**: Single batch query with grouping

**Implementation**:
```typescript
async function enrichWithPrimaryImages(parts: DatabasePartRow[]) {
  const partIds = parts.map(p => p.id);

  // Single query for ALL images (not 15 queries!)
  const { data: images } = await supabase
    .from("part_images")
    .select("part_id, image_url, display_order")
    .in("part_id", partIds)
    .order("display_order", { ascending: true });

  // Group images by part_id
  const imagesByPartId = images.reduce((acc, img) => {
    if (!acc[img.part_id]) acc[img.part_id] = [];
    acc[img.part_id].push(img);
    return acc;
  }, {});

  // Attach primary image to each part
  return parts.map(part => ({
    ...part,
    primary_image_url: imagesByPartId[part.id]?.[0]?.image_url || null
  }));
}
```

**Performance Impact**:
- 15 parts with N+1: 15 queries × 50ms = 750ms
- Batch query: 1 query × 50ms = 50ms (15x faster!)

---

### 3. RPC Function for Complex Queries

**Why RPC**: Reduces round trips, executes multi-stage logic in database

**Comparison**:
```typescript
// ❌ Multiple round trips (slow)
// 1. Check exact ACR SKU
const exactMatch = await supabase.from("parts").select("*").eq("acr_sku", sku);
if (!exactMatch.data) {
  // 2. Check competitor SKUs
  const competitorMatch = await supabase.from("cross_references")...
  if (!competitorMatch.data) {
    // 3. Fuzzy search
    const fuzzyMatch = await supabase.from("parts")...
  }
}
// Total: 3 HTTP requests, 3 × network latency

// ✅ Single RPC call (fast)
const result = await supabase.rpc("search_by_sku", { search_sku: sku });
// Total: 1 HTTP request, all logic in database
```

**Performance Impact**:
- Multi-query approach: 150ms + 150ms + 150ms = 450ms
- RPC function: 150ms (3x faster!)

---

### 4. Pagination for Large Result Sets

**Problem**: Returning 500 parts at once = huge payload

**Solution**: Server-side pagination with limit/offset

**Implementation**:
```typescript
// Client requests page 1 (parts 0-14)
const { data } = usePublicParts({ sku_term: "brake", limit: 15, offset: 0 });

// API applies pagination AFTER database returns all results
const allData = await supabase.rpc("search_by_sku", { search_sku: "brake" });
const paginatedData = allData.slice(offset, offset + limit);

return { data: paginatedData, count: allData.length };
```

**Performance Impact**:
- All results (500 parts): 2MB payload, 5s to render
- Paginated (15 parts): 50KB payload, <1s to render (50x faster!)

---

## Examples

### Example 1: Vehicle Search

**User Flow**:
```
1. User selects Make: "HONDA"
2. Dropdown populates with Honda models: ["ACCORD", "CIVIC", "CR-V", ...]
3. User selects Model: "CIVIC"
4. Dropdown populates with Civic years: [2023, 2022, 2021, ..., 2016]
5. User selects Year: "2018"
6. Search executes automatically
```

**API Request**:
```http
GET /api/public/parts?make=HONDA&model=CIVIC&year=2018&limit=15&offset=0
```

**Database Query**:
```sql
SELECT p.*
FROM parts p
JOIN vehicle_applications va ON p.id = va.part_id
WHERE va.make = 'HONDA'
  AND va.model = 'CIVIC'
  AND 2018 BETWEEN va.start_year AND va.end_year
LIMIT 15 OFFSET 0;
```

**Response**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "acr_sku": "ACR-BR-001",
      "part_type": "MAZA",
      "position_type": "TRASERA",
      "primary_image_url": "https://supabase.co/storage/.../image.jpg"
    },
    // ... 14 more parts
  ],
  "count": 42,
  "search_type": "vehicle"
}
```

**Performance**: ~150ms

---

### Example 2: SKU Search (Exact Match)

**User Input**: "ACR-BR-001"

**API Request**:
```http
GET /api/public/parts?sku_term=ACR-BR-001&limit=15&offset=0
```

**Database Query Flow**:
```sql
-- Step 1: Exact ACR SKU
SELECT * FROM parts WHERE acr_sku = 'ACR-BR-001';
-- FOUND! Return immediately with match_type = 'exact_acr'
```

**Response**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "acr_sku": "ACR-BR-001",
      "part_type": "MAZA",
      "match_type": "exact_acr",
      "similarity_score": 1.0,
      "primary_image_url": "https://..."
    }
  ],
  "count": 1,
  "search_type": "sku"
}
```

**Performance**: ~100ms (single index lookup)

---

### Example 3: SKU Search (Competitor Cross-Reference)

**User Input**: "TM512342" (competitor SKU)

**API Request**:
```http
GET /api/public/parts?sku_term=TM512342&limit=15&offset=0
```

**Database Query Flow**:
```sql
-- Step 1: Exact ACR SKU
SELECT * FROM parts WHERE acr_sku = 'TM512342';
-- NOT FOUND

-- Step 2: Competitor SKU cross-reference
SELECT p.* FROM parts p
JOIN cross_references cr ON p.id = cr.acr_part_id
WHERE cr.competitor_sku = 'TM512342';
-- FOUND! ACR part: ACR-BR-002
```

**Response**:
```json
{
  "data": [
    {
      "id": "789abcde-...",
      "acr_sku": "ACR-BR-002",
      "part_type": "MAZA",
      "match_type": "competitor_sku",
      "similarity_score": 1.0,
      "primary_image_url": "https://..."
    }
  ],
  "count": 1,
  "search_type": "sku"
}
```

**Performance**: ~150ms (join query with indexes)

---

### Example 4: SKU Search (Fuzzy Match)

**User Input**: "ACR-BR-01" (typo - missing last digit)

**API Request**:
```http
GET /api/public/parts?sku_term=ACR-BR-01&limit=15&offset=0
```

**Database Query Flow**:
```sql
-- Step 1: Exact ACR SKU
SELECT * FROM parts WHERE acr_sku = 'ACR-BR-01';
-- NOT FOUND

-- Step 2: Competitor SKU
SELECT ... WHERE cr.competitor_sku = 'ACR-BR-01';
-- NOT FOUND

-- Step 3: Fuzzy match with trigrams
SELECT p.*, similarity(p.acr_sku, 'ACR-BR-01') AS score
FROM parts p
WHERE similarity(p.acr_sku, 'ACR-BR-01') > 0.3
ORDER BY score DESC;
-- FOUND! "ACR-BR-001" with similarity 0.91
```

**Response**:
```json
{
  "data": [
    {
      "id": "123e4567-...",
      "acr_sku": "ACR-BR-001",
      "part_type": "MAZA",
      "match_type": "fuzzy",
      "similarity_score": 0.91,
      "primary_image_url": "https://..."
    }
  ],
  "count": 1,
  "search_type": "sku"
}
```

**Performance**: ~180ms (trigram index scan)

---

## Related Documentation

### Architecture Documentation
- **[Architecture Overview](../../architecture/OVERVIEW.md)** - Search system in overall architecture
- **[Data Flow](../../architecture/DATA_FLOW.md)** - Complete search request lifecycle
- **[API Design](../../architecture/API_DESIGN.md)** - RESTful patterns used in search API
- **[State Management](../../architecture/STATE_MANAGEMENT.md)** - TanStack Query caching for search results

### Database Documentation
- **[Database Schema](../../database/DATABASE.md)** - Parts, vehicle_applications, cross_references tables
- **[Database Schema](../../database/DATABASE.md#indexes)** - Trigram indexes for fuzzy search

### Project Documentation
- **[PLANNING.md](../../PLANNING.md)** - Tech stack rationale (PostgreSQL, pg_trgm, etc.)

---

## Future Enhancements

### Planned Improvements

1. **Combined Search**: SKU + Vehicle filter in single query
2. **Search Analytics**: Track popular searches, failure patterns
3. **Auto-complete**: Real-time suggestions as user types
4. **Search History**: Save recent searches per user
5. **Advanced Filters**: Part type, position, ABS type during search
6. **Synonym Handling**: "brake" = "freno", "hub" = "maza"

### Performance Targets

- Current: ~150ms average
- Goal: <100ms for 95th percentile
- Strategy: Query result caching, materialized views

---

**Status**: ✅ Production-ready with sub-300ms performance maintained across 9,600+ parts

**Last Performance Test**: October 25, 2025 - 98% of queries under 200ms
