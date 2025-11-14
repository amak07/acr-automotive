# ACR Automotive Database Reference

**Last Updated**: November 8, 2025
**Current Schema Version**: Migration 009 (SKU Normalization for Flexible Search)
**Platform**: Supabase (PostgreSQL 15+)
**Production Status**: ✅ Live with 865+ parts, 7,530+ cross-references, 2,304+ vehicle applications

> **📝 Note**: Migration details and application status tracked in [migrations/README.md](../../src/lib/supabase/migrations/README.md)

---

## 📋 Table of Contents

1. [Quick Reference](#quick-reference)
2. [Architecture & Design](#architecture--design)
3. [Current Schema](#current-schema)
4. [Database Functions](#database-functions)
5. [Performance & Indexes](#performance--indexes)
6. [Migration History](#migration-history)
7. [Security & RLS](#security--rls)
8. [Setup & Deployment](#setup--deployment)
9. [Troubleshooting](#troubleshooting)
10. [Database Development Workflows](#database-development-workflows) ⭐ NEW

---

## Quick Reference

### Database at a Glance

**Business Goal**: Enable counter staff to quickly find ACR parts by searching competitor SKUs or vehicle compatibility.

**Performance Target**: Sub-300ms search response times

**Core Tables** (8 total after Migration 009):

- **parts** (14 cols) - Main parts catalog with ACR SKUs + normalized SKUs + tenant_id
- **vehicle_applications** (8 cols) - Vehicle compatibility + tenant_id
- **cross_references** (8 cols) - Competitor SKU mappings + normalized SKUs + tenant_id
- **part_images** (9 cols) - Photo gallery per part + tenant_id
- **part_360_frames** (11 cols) - 360° interactive viewer frames + tenant_id
- **site_settings** (10 cols) - Dynamic site configuration (singleton)
- **tenants** (6 cols) - Multi-tenant support (future)
- **import_history** (4 cols) - Rollback snapshots (Migration 006)

**Extensions Required**:

- `uuid-ossp` - UUID generation
- `pg_trgm` - Fuzzy search (trigram matching)

**Key Features**:

- ✅ UUID primary keys on all tables
- ✅ Cascading deletes (`ON DELETE CASCADE`)
- ✅ Fuzzy search for typo tolerance
- ✅ Row Level Security (RLS) enabled
- ✅ Multi-stage search fallback (exact → competitor → fuzzy)

---

## Architecture & Design

### Database Architecture

```
parts (main catalog)
├── vehicle_applications (1:N - which vehicles fit this part)
├── cross_references (1:N - competitor SKU equivalents)
├── part_images (1:N - photo gallery)
└── part_360_frames (1:N - 360° viewer frames)

site_settings (singleton - id=1 always)
```

### Core Design Decisions

#### 1. UUID Primary Keys

**Decision**: Use `UUID` instead of `SERIAL`/`BIGSERIAL`

**Why**:

- Better for distributed systems
- No sequence conflicts when merging data
- Security through obscurity (non-sequential IDs)
- Easier multi-tenancy in future

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

#### 2. Cascading Deletes

**Decision**: `ON DELETE CASCADE` for all foreign keys

**Why**:

- Prevents orphaned records (vehicle_applications without parts)
- Simplifies admin deletion workflow
- Database enforces referential integrity

```sql
part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE
```

**Example**: Deleting part "ACR-001" automatically removes:

- All vehicle_applications for ACR-001
- All cross_references for ACR-001
- All part_images for ACR-001
- All part_360_frames for ACR-001

#### 3. Separate Tables for 1:N Relationships

**Decision**: Don't use arrays/JSONB for vehicle applications or cross-references

**Why**:

- Queryable with SQL (no JSON parsing needed)
- Proper indexes for fast searches
- Easier to update individual records
- Standard relational model

**Example**: One part fits 5 vehicles = 5 rows in `vehicle_applications` table

#### 4. Naming Conventions

**Decision**: Use descriptive names, avoid PostgreSQL reserved words

**Examples**:

- ✅ `position_type` (not `position` - reserved word)
- ✅ `acr_part_id` (not `part_id` - clearer in cross_references context)
- ✅ `competitor_sku` (explicit, not ambiguous)

#### 5. Text vs VARCHAR

**Decision**: Use `TEXT` for unlimited content, `VARCHAR(N)` for constrained fields

**Why**:

- `TEXT` for specifications (unlimited technical descriptions)
- `VARCHAR(50)` for SKUs (real-world max length = 30 chars)
- Performance is identical in PostgreSQL

---

## Current Schema

### Table Summary (Migration 004)

| Table                | Rows     | Columns | Foreign Keys    | Indexes | Purpose               |
| -------------------- | -------- | ------- | --------------- | ------- | --------------------- |
| parts                | 865+     | 12      | -               | 3       | Main catalog          |
| vehicle_applications | 2,304+   | 7       | 1 (part_id)     | 5       | Vehicle compatibility |
| cross_references     | 7,530+   | 6       | 1 (acr_part_id) | 3       | Competitor SKUs       |
| part_images          | Variable | 8       | 1 (part_id)     | 3       | Photo gallery         |
| part_360_frames      | Variable | 10      | 1 (part_id)     | 2       | 360° viewer           |
| site_settings        | 1        | 10      | -               | 1       | Site config           |

---

### 1. `parts` - Main Parts Catalog

Primary table storing ACR part information.

```sql
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_sku VARCHAR(50) NOT NULL UNIQUE,           -- ACR part number (e.g., "ACR-MAZA-001")
    part_type VARCHAR(100) NOT NULL,               -- e.g., "Wheel Hub", "Brake Rotor"
    position_type VARCHAR(50),                     -- e.g., "Front", "Rear", "Front Left"
    abs_type VARCHAR(20),                          -- ABS compatibility
    bolt_pattern VARCHAR(50),                      -- Wheel bolt pattern
    drive_type VARCHAR(50),                        -- e.g., "2WD", "4WD", "AWD"
    specifications TEXT,                           -- Detailed technical specs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    has_360_viewer BOOLEAN DEFAULT false,          -- Has 360° viewer configured
    viewer_360_frame_count INTEGER DEFAULT 0       -- Number of frames (0-100)
);
```

**Key Constraints**:

- `acr_sku` is UNIQUE (business rule: one part per SKU)
- `valid_360_frame_count` CHECK (0-100 frames allowed)

**Historical Note**:

- `image_url` column existed initially, removed in Migration 001
- Replaced by `part_images` table for multi-image support

---

### 2. `vehicle_applications` - Vehicle Compatibility

One-to-many: one part fits multiple vehicles.

```sql
CREATE TABLE vehicle_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,                     -- e.g., "Ford", "Honda", "Chevrolet"
    model VARCHAR(100) NOT NULL,                   -- e.g., "F-150", "Civic", "Silverado"
    start_year INT NOT NULL,                       -- e.g., 2015
    end_year INT NOT NULL,                         -- e.g., 2020
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Notes**:

- **Separate start/end years** (not "2015-2020" string) for queryability
- **Cascading delete**: Removing part removes all its applications
- **No unique constraint**: Same part can fit same vehicle multiple times (different configurations)

**Example Data**:

```
Part ACR-001 fits:
- Ford F-150, 2015-2020 (row 1)
- Ford F-250, 2016-2021 (row 2)
- Chevrolet Silverado 1500, 2014-2018 (row 3)
```

---

### 3. `cross_references` - Competitor SKU Mapping

One-to-many: one ACR part has multiple competitor equivalents.

```sql
CREATE TABLE cross_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(50) NOT NULL,           -- e.g., "MOOG-512411", "TIMKEN-HA590071"
    competitor_brand VARCHAR(50),                  -- e.g., "Moog", "Timken" (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Notes**:

- **acr_part_id** (not `part_id`) for clarity in cross-reference context
- **competitor_brand optional**: Sometimes we only know SKU, not exact brand
- **No unique constraint**: Different brands can have same SKU

**Example Data**:

```
ACR-001 cross-references to:
- MOOG-512411 (Moog brand)
- TIMKEN-HA590071 (Timken brand)
- SKF-BR930715 (SKF brand)
```

---

### 4. `part_images` - Photo Gallery

One-to-many: one part has multiple images (gallery).

**Added**: Migration 001 (October 11, 2025)

```sql
CREATE TABLE part_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,                       -- Supabase Storage URL
    display_order INT NOT NULL DEFAULT 0,          -- For drag-and-drop reordering
    is_primary BOOLEAN DEFAULT false,              -- Primary image (shown first)
    caption TEXT,                                  -- Optional image description
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Constraints**:

- **Unique primary per part**: Only one `is_primary = true` per part
- **Display order**: Allows admin to reorder gallery images

**Storage Path**:

```
acr-part-images/
├── ACR-001-photo-1.jpg
├── ACR-001-photo-2.jpg
└── ACR-002-photo-1.jpg
```

---

### 5. `part_360_frames` - 360° Interactive Viewer

One-to-many: one part has 12-48 sequential frames for 360° rotation.

**Added**: Migration 004 (October 17, 2025)

```sql
CREATE TABLE part_360_frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,                 -- 0-indexed (frame 0 = starting position)
    image_url TEXT NOT NULL,                       -- Public Supabase Storage URL
    storage_path TEXT NOT NULL,                    -- e.g., "360-viewer/ACR-001/frame-000.jpg"
    file_size_bytes INTEGER,                       -- Optimized file size
    width INTEGER,                                 -- Standardized to 1200px
    height INTEGER,                                -- Standardized to 1200px
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_part_frame UNIQUE(part_id, frame_number),
    CONSTRAINT valid_frame_number CHECK(frame_number >= 0),
    CONSTRAINT positive_dimensions CHECK(
        (width IS NULL AND height IS NULL) OR (width > 0 AND height > 0)
    )
);
```

**Design Notes**:

- **Unique frame per part**: Can't have duplicate frame_number for same part
- **Server-side optimization**: Images processed to 1200×1200px @ 85% JPEG quality
- **Storage path**: `acr-part-images/360-viewer/{acr_sku}/frame-NNN.jpg`

---

### 6. `site_settings` - Dynamic Configuration

Singleton table (always one row with `id = 1`).

**Added**: Migration 003 (October 15, 2025)

```sql
CREATE TABLE site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    footer_text TEXT,
    logo_url TEXT,                                 -- Site logo
    favicon_url TEXT,                              -- Browser favicon
    banner_url TEXT,                               -- Homepage banner
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT singleton_row CHECK (id = 1)
);
```

**Singleton Pattern**: Only one row allowed (`id = 1`).

**Use Case**: Admin can update contact info, logos, banners without code deployment.

---

## Database Functions

### `search_by_sku(search_sku TEXT)` - Intelligent SKU Search

Multi-stage fallback search for maximum hit rate.

**Algorithm**:

```
1. Try exact ACR SKU match
   ├─ Found? → Return with match_type='exact_acr', similarity=1.0
   └─ Not found? → Continue to step 2

2. Try exact competitor SKU match
   ├─ Found? → Return with match_type='competitor_sku', similarity=1.0
   └─ Not found? → Continue to step 3

3. Try fuzzy search (trigram similarity)
   ├─ Search ACR SKUs + competitor SKUs
   ├─ Return matches with similarity > 0.6
   └─ Sort by similarity DESC, limit 10
```

**Returns**:

```sql
id, acr_sku, part_type, position_type, abs_type, bolt_pattern,
drive_type, specifications, created_at, updated_at,
match_type TEXT,          -- 'exact_acr' | 'competitor_sku' | 'fuzzy'
similarity_score REAL     -- 0.6-1.0 (fuzzy) or 1.0 (exact)
```

**Example**:

```sql
SELECT * FROM search_by_sku('ACR-MAZA-O01');  -- Typo: O instead of 0

-- Returns fuzzy match:
-- acr_sku: ACR-MAZA-001
-- match_type: fuzzy
-- similarity_score: 0.92
```

**Business Value**: Counter staff see match quality ("Found 92% match for your search").

---

### `search_by_vehicle(make TEXT, model TEXT, target_year INT)` - Vehicle Search

Find parts that fit specific vehicles.

**Algorithm**:

```sql
SELECT parts.*
FROM parts
JOIN vehicle_applications ON parts.id = vehicle_applications.part_id
WHERE
    make = $1 AND
    model = $2 AND
    $3 BETWEEN start_year AND end_year;
```

**Example**:

```sql
SELECT * FROM search_by_vehicle('Ford', 'F-150', 2018);

-- Returns all parts that fit 2018 Ford F-150
```

**UI Workflow**:

1. User selects Make (dropdown)
2. User selects Model (filtered by Make)
3. User selects Year (filtered by Make+Model)
4. Results show compatible parts

---

## Performance & Indexes

### Index Strategy

**Goal**: Sub-300ms search response times with 7,500+ cross-references.

#### Regular Indexes (Exact Searches)

```sql
-- Parts table
CREATE INDEX idx_parts_acr_sku ON parts(acr_sku);
CREATE INDEX idx_parts_part_type ON parts(part_type);

-- Vehicle applications
CREATE INDEX idx_vehicle_applications_make ON vehicle_applications(make);
CREATE INDEX idx_vehicle_applications_model ON vehicle_applications(model);
CREATE INDEX idx_vehicle_applications_year ON vehicle_applications(start_year, end_year);
CREATE INDEX idx_vehicle_applications_part_id ON vehicle_applications(part_id);

-- Cross references
CREATE INDEX idx_cross_references_competitor_sku ON cross_references(competitor_sku);
CREATE INDEX idx_cross_references_acr_part_id ON cross_references(acr_part_id);

-- Part images
CREATE INDEX idx_part_images_part_id ON part_images(part_id);
CREATE INDEX idx_part_images_display_order ON part_images(part_id, display_order);
CREATE UNIQUE INDEX idx_part_images_primary ON part_images(part_id) WHERE is_primary = true;

-- 360 frames
CREATE INDEX idx_part_360_frames_part_id ON part_360_frames(part_id);
CREATE INDEX idx_part_360_frames_part_frame ON part_360_frames(part_id, frame_number);
```

---

#### Fuzzy Search Indexes (Trigram GIN)

**What are trigrams?**
Breaks text into 3-character chunks for similarity matching.

**Example**:

```
"ACR-MAZA-001" → ["ACR", "CR-", "R-M", "-MA", "MAZ", "AZA", "ZA-", "A-0", "-00", "001"]
"ACR-MAZA-O01" → ["ACR", "CR-", "R-M", "-MA", "MAZ", "AZA", "ZA-", "A-O", "-O0", "O01"]

Similarity: 8 out of 10 chunks match = 0.8 (80% similar)
```

```sql
-- Fuzzy search on ACR SKUs
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin(acr_sku gin_trgm_ops);

-- Fuzzy search on competitor SKUs
CREATE INDEX idx_cross_references_competitor_sku_trgm
    ON cross_references USING gin(competitor_sku gin_trgm_ops);
```

**Performance Impact**:

- Without fuzzy index: 500-1000ms for typo searches
- With fuzzy index: <100ms for typo searches

---

### Query Analysis Tools

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Check index usage (unused indexes = waste of space)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Migration History

### How Migrations Work

**Process**:

1. Write idempotent SQL file (`NNN_descriptive_name.sql`)
2. Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
3. Paste SQL and click **Run**
4. Update `src/lib/supabase/migrations/README.md` with status

**Idempotent Pattern**:

```sql
-- Safe to re-run
CREATE TABLE IF NOT EXISTS table_name (...);
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);
```

---

### Base Schema (September 2025)

**File**: `src/lib/supabase/schema.sql`
**Status**: ✅ Applied (Initial deployment)

**Created**:

- `parts` table (10 columns)
- `vehicle_applications` table (7 columns)
- `cross_references` table (6 columns)
- Database functions: `search_by_sku()`, `search_by_vehicle()`
- Storage bucket: `acr-part-images`
- All indexes and RLS policies

---

### Migration 001: Multiple Images Per Part

**File**: `001_add_part_images.sql`
**Applied**: October 11, 2025
**Feature**: Category 2 Site Enhancements

**Changes**:

- ✅ Created `part_images` table (8 columns)
- ✅ Removed `parts.image_url` column (migrated to gallery model)
- ✅ Added 3 indexes (part_id, display_order, unique primary)
- ✅ RLS policies (public read, admin write)

**Impact**: Enabled drag-and-drop photo galleries per part

---

### Migration 002: Update Search Functions

**File**: `002_update_search_functions.sql`
**Applied**: October 13, 2025

**Changes**:

- Enhanced fuzzy search algorithm
- Improved similarity scoring
- Performance optimizations

---

### Migration 003: Site Settings

**File**: `003_add_site_settings.sql`
**Applied**: October 15, 2025

**Changes**:

- ✅ Created `site_settings` table (singleton pattern)
- ✅ Pre-populated with default settings
- ✅ Constraint ensures only one row (`id = 1`)

**Impact**: Dynamic footer, logo, favicon, banner uploads

---

### Migration 004: 360° Interactive Viewer

**File**: `004_add_360_viewer.sql`
**Applied**: October 17, 2025

**Changes**:

- ✅ Added `parts.has_360_viewer` and `parts.viewer_360_frame_count` columns
- ✅ Created `part_360_frames` table (10 columns)
- ✅ CHECK constraint: 0-100 frames allowed
- ✅ Storage policies: UPDATE and DELETE for frame replacement

**Impact**: Drag-to-rotate 360° product viewer with 12-48 frames

---

### Migration 005: Multi-Tenancy Preparation

**File**: `005_add_tenant_id.sql`
**Applied**: October 22, 2025
**Status**: ✅ Complete

**Changes**:

1. **Created `tenants` table** (6 columns):

   ```sql
   - id UUID (PK)
   - name VARCHAR(255)
   - slug VARCHAR(100) UNIQUE
   - status VARCHAR(20) CHECK (active/suspended/inactive)
   - created_at, updated_at
   ```

2. **Added `tenant_id UUID` to 5 tables**:
   - `parts.tenant_id`
   - `vehicle_applications.tenant_id`
   - `cross_references.tenant_id`
   - `part_images.tenant_id`
   - `part_360_frames.tenant_id`

3. **Updated unique constraints for tenant isolation**:
   - `parts.acr_sku` → Unique per tenant (not globally unique)
   - `vehicle_applications` → (part_id, make, model, start_year) unique per tenant
   - `cross_references` → (acr_part_id, competitor_sku, brand) unique per tenant
   - NULL `tenant_id` treated as default tenant (`00000000-0000-0000-0000-000000000000`)

4. **Created 5 indexes** on `tenant_id` columns for performance

5. **RLS Policies**: Public read, Admin write on `tenants` table

**Backward Compatibility**: ✅ Zero breaking changes

- All existing data has `tenant_id = NULL` (default tenant)
- MVP continues to work in single-tenant mode
- Future-proofs for multi-tenant SaaS expansion

---

### Migration 006: Import History (Rollback Support)

**File**: `006_add_import_history.sql`
**Applied**: October 22, 2025
**Status**: ✅ Complete

**Purpose**: Enable 3-snapshot rollback system for bulk Excel imports (Phase 8.2)

**Changes**:

1. **Created `import_history` table** (4 columns):

   ```sql
   - id UUID (PK)
   - tenant_id UUID (FK → tenants.id)
   - snapshot JSONB (rollback data)
   - created_at TIMESTAMPTZ
   ```

2. **JSONB snapshot structure**:

   ```json
   {
     "timestamp": "2025-10-22T16:45:00Z",
     "changes_summary": { ... },
     "rollback_data": {
       "parts_to_delete": [...],
       "parts_to_restore": [...],
       "parts_to_revert": [...]
     }
   }
   ```

3. **Auto-cleanup trigger**: `cleanup_old_import_snapshots()`
   - Keeps last 3 snapshots per tenant
   - Automatically runs after each insert

4. **Indexes**:
   - `idx_import_history_tenant_created` - Query by tenant + date
   - `idx_import_history_created` - Admin audit trail

5. **RLS Policies**: Public read (rollback status), Admin write

**Business Impact**: Safe bulk imports with undo capability

---

### Migration 007: Updated-At Timestamp Tracking

**File**: `007_add_updated_at_tracking.sql`
**Applied**: October 28, 2025
**Status**: ✅ Complete

**Purpose**: Track when parts and related records are last modified for audit trails and cache invalidation.

**Changes**:

1. **Added triggers for automatic `updated_at` updates** on:
   - `parts` table
   - `vehicle_applications` table
   - `cross_references` table

2. **Trigger implementation**:
   ```sql
   CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

**Business Impact**: Enables cache invalidation and modification tracking for imports

---

### Migration 008: Atomic Import Transactions

**File**: `008_add_atomic_import_transaction.sql`
**Applied**: October 28, 2025
**Status**: ✅ Complete

**Purpose**: Ensure data integrity during bulk import operations with all-or-nothing guarantees.

**Changes**:

1. **Wrapped import operations in atomic transactions**
2. **Added constraint validation** to prevent partial imports
3. **Enhanced error handling** for FK violations and unique constraints

**Business Impact**: Zero partial-import states, guaranteed data consistency

---

### Migration 009: SKU Normalization for Flexible Search

**File**: `009_add_sku_normalization.sql`
**Applied**: November 7, 2025
**Status**: ✅ Complete
**Feature**: Enhanced SKU search with format flexibility

**Purpose**: Enable users to search for SKUs in any format (with/without hyphens, spaces, mixed case) and find matches reliably.

**Changes**:

1. **Created `normalize_sku()` database function**:

   ```sql
   CREATE OR REPLACE FUNCTION normalize_sku(input_sku TEXT)
   RETURNS TEXT AS $$
   BEGIN
     RETURN UPPER(REGEXP_REPLACE(input_sku, '[^A-Za-z0-9]', '', 'g'));
   END;
   $$ LANGUAGE plpgsql IMMUTABLE;
   ```

   - Strips all non-alphanumeric characters (spaces, hyphens, special chars)
   - Converts to uppercase for case-insensitive matching
   - Marked `IMMUTABLE` for query optimization

2. **Added normalized columns** (auto-populated via triggers):

   ```sql
   -- parts table
   ALTER TABLE parts ADD COLUMN acr_sku_normalized VARCHAR(50);

   -- cross_references table
   ALTER TABLE cross_references ADD COLUMN competitor_sku_normalized VARCHAR(50);
   ```

3. **Created auto-population triggers**:

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

4. **Backfilled existing data**:
   - Normalized all 865+ existing ACR SKUs
   - Normalized all 7,530+ existing competitor SKUs

5. **Added performance indexes**:

   ```sql
   -- Fast exact normalized ACR SKU lookups
   CREATE INDEX idx_parts_acr_sku_normalized ON parts(acr_sku_normalized)
   WHERE acr_sku_normalized IS NOT NULL;

   -- Fast exact normalized competitor SKU lookups
   CREATE INDEX idx_cross_ref_competitor_sku_normalized
   ON cross_references(competitor_sku_normalized)
   WHERE acr_sku_normalized IS NOT NULL;

   -- Optimized cross-reference joins
   CREATE INDEX idx_cross_ref_normalized_with_part
   ON cross_references(competitor_sku_normalized, acr_part_id)
   WHERE competitor_sku_normalized IS NOT NULL;
   ```

6. **Enhanced `search_by_sku()` function** - 6-stage search algorithm:
   - **Stage 1**: Exact normalized ACR SKU match (e.g., "ACR-15002" or "acr 15002" → "ACR15002")
   - **Stage 2**: With ACR prefix added (e.g., "15002" → "ACR15002")
   - **Stage 3**: Partial normalized ACR match (e.g., "1500" → multiple results)
   - **Stage 4**: Exact normalized competitor SKU (e.g., "TM-512348" or "tm 512348" → "TM512348")
   - **Stage 5**: Partial normalized competitor match
   - **Stage 6**: Fuzzy fallback using original SKUs (trigram similarity > 0.6)

7. **Added ACR prefix constraint**:

   ```sql
   ALTER TABLE parts ADD CONSTRAINT check_acr_sku_prefix
   CHECK (acr_sku ~* '^ACR');
   ```

   - Ensures all ACR SKUs start with "ACR" (case-insensitive)
   - Migration auto-fixed SKUs without prefix

**Normalization Examples**:
| Input | Normalized Output |
|-------|-------------------|
| `ACR-15002` | `ACR15002` |
| `acr-15002` | `ACR15002` |
| `acr 15002` | `ACR15002` |
| `ACR BR 001` | `ACRBR001` |
| `TM-512348` | `TM512348` |
| `Timken-512348` | `TIMKEN512348` |

**Performance Impact**:

- Normalized exact matches: 50-100ms (index lookup)
- Partial matches: 100-150ms (LIKE with index)
- Fuzzy fallback: 150-180ms (trigram index scan)

**Business Impact**:

- ✅ Users can search with any SKU format (hyphens, spaces, mixed case)
- ✅ Auto-adds "ACR" prefix for shorthand searches ("15002" → "ACR-15002")
- ✅ Handles competitor SKU variations seamlessly
- ✅ Maintains fuzzy search for typos
- ✅ Zero breaking changes (backward compatible)

**Related Documentation**: See [SEARCH_SYSTEM.md](../features/search/SEARCH_SYSTEM.md#2a-sku-normalization-rules-migration-009) for detailed search behavior

---

## Security & RLS

### Row Level Security (RLS)

**Status**: Enabled on all tables

**Current Policies** (MVP - Development-Friendly):

```sql
-- Public read access (anyone can search parts)
CREATE POLICY "Public read" ON parts FOR SELECT USING (true);
CREATE POLICY "Public read" ON vehicle_applications FOR SELECT USING (true);
CREATE POLICY "Public read" ON cross_references FOR SELECT USING (true);
CREATE POLICY "Public read" ON part_images FOR SELECT USING (true);
CREATE POLICY "Public read" ON part_360_frames FOR SELECT USING (true);

-- Admin write access (wide-open for MVP)
CREATE POLICY "Admin write" ON parts FOR ALL USING (true);
-- (same for all tables)
```

**Why Simple**: MVP focuses on core functionality. Real authentication comes post-MVP.

---

### Storage Bucket Security

**Bucket**: `acr-part-images` (public read)

```sql
-- Public read access (for part images in search results)
CREATE POLICY "Public Access"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'acr-part-images');

-- Admin upload
CREATE POLICY "Admin Upload"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'acr-part-images');

-- Admin update (for 360° frame replacement)
CREATE POLICY "Admin Update"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'acr-part-images');

-- Admin delete
CREATE POLICY "Admin Delete"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'acr-part-images');
```

**File Structure**:

```
acr-part-images/
├── ACR-001.jpg                    (legacy single images)
├── ACR-001-photo-1.jpg            (gallery images)
├── ACR-001-photo-2.jpg
└── 360-viewer/
    ├── ACR-001/
    │   ├── frame-000.jpg
    │   ├── frame-001.jpg
    │   └── frame-023.jpg          (24 frames total)
    └── ACR-002/
        └── frame-000.jpg
```

---

### Post-MVP Security Roadmap

**Planned Enhancements**:

1. ✅ Supabase Auth integration
2. ✅ Admin-only write policies (replace `USING (true)` with auth check)
3. ✅ API key restrictions
4. ✅ Rate limiting on search endpoints
5. ✅ Audit logging for admin actions

---

## Setup & Deployment

### Fresh Database Setup

**Prerequisites**:

- Supabase project created
- PostgreSQL 15+
- `uuid-ossp` and `pg_trgm` extensions available

**Steps**:

1. **Run Base Schema**:

   ```bash
   # In Supabase Dashboard → SQL Editor
   # Copy and run: src/lib/supabase/schema.sql
   ```

2. **Run Migrations** (in order):

   ```bash
   # Migration 001
   # Copy and run: src/lib/supabase/migrations/001_add_part_images.sql

   # Migration 002
   # Copy and run: src/lib/supabase/migrations/002_update_search_functions.sql

   # Migration 003
   # Copy and run: src/lib/supabase/migrations/003_add_site_settings.sql

   # Migration 004
   # Copy and run: src/lib/supabase/migrations/004_add_360_viewer.sql
   ```

3. **Verify Tables**:

   ```sql
   -- Check all tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';

   -- Should show: parts, vehicle_applications, cross_references,
   --               part_images, part_360_frames, site_settings
   ```

4. **Update Environment Variables**:

   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Import Data** (optional):
   ```bash
   npm run bootstrap
   ```

---

### Environment Configuration

**Required Variables**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Development vs Production**:

- Same database for both (Supabase single environment)
- UI language differs (English dev, Spanish prod)
- Security policies same (MVP wide-open)

---

## Troubleshooting

### Common Issues

#### Storage Bucket Not Found

**Problem**: Photo or 360° frame upload fails with "Bucket not found" error in local development.

**Root Cause**: Storage buckets are NOT captured in migrations. `npx supabase db diff` only syncs PostgreSQL schema, not Storage service configuration.

**Solution**:

1. **Verify bucket configuration** in `supabase/config.toml`:

   ```bash
   cat supabase/config.toml | grep -A 5 "acr-part-images"
   ```

2. **Bucket should be configured** (already in config):

   ```toml
   [storage.buckets.acr-part-images]
   public = true
   file_size_limit = "10MiB"
   allowed_mime_types = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
   ```

3. **Restart Supabase** to create the bucket:

   ```bash
   npm run supabase:stop
   npm run supabase:start
   ```

4. **Verify bucket exists** in Studio:
   - Open `http://localhost:54323`
   - Navigate to Storage → Should see `acr-part-images` bucket

**Why this happens**: Migrations (PostgreSQL schema) ≠ Storage configuration (Supabase service). Always configure buckets in `supabase/config.toml` and commit to git.

**See also**: `supabase/migrations/README.md` → "Storage Buckets Are NOT in Migrations"

---

#### Reserved Word Errors

**Problem**: PostgreSQL reserves words like `position`, `user`, `table`.

**Solution**: Use alternative names or quotes.

```sql
-- ❌ Wrong - reserved word
CREATE TABLE parts (position VARCHAR(50));

-- ✅ Correct - renamed
CREATE TABLE parts (position_type VARCHAR(50));

-- ✅ Also correct - quoted (not recommended)
CREATE TABLE parts ("position" VARCHAR(50));
```

---

#### Foreign Key Mismatches

**Problem**: Column names don't match between tables.

**Solution**: Ensure FK references correct column.

```sql
-- ❌ Wrong - column name mismatch
CREATE TABLE vehicle_applications (
    parts_id UUID REFERENCES parts(id)  -- Wrong: parts_id vs part_id
);

-- ✅ Correct
CREATE TABLE vehicle_applications (
    part_id UUID REFERENCES parts(id)
);
```

---

#### Missing Semicolons in Functions

**Problem**: Function bodies fail without semicolons.

**Solution**: Add semicolons after each statement.

```sql
-- ❌ Wrong
CREATE FUNCTION my_func() RETURNS void AS $$
BEGIN
    INSERT INTO parts (acr_sku) VALUES ('test')
END;
$$ LANGUAGE plpgsql;

-- ✅ Correct
CREATE FUNCTION my_func() RETURNS void AS $$
BEGIN
    INSERT INTO parts (acr_sku) VALUES ('test');  -- ← Semicolon
END;
$$ LANGUAGE plpgsql;
```

---

#### Orphaned Records After Delete

**Problem**: Deleting part leaves orphaned vehicle_applications.

**Solution**: Already solved with `ON DELETE CASCADE`.

```sql
-- With CASCADE configured:
DELETE FROM parts WHERE id = '...';
-- Automatically deletes:
-- - All vehicle_applications for this part
-- - All cross_references for this part
-- - All part_images for this part
-- - All part_360_frames for this part
```

---

### Performance Monitoring

**Key Metrics**:

- ✅ Search response time: Target <300ms (currently ~150ms avg)
- ✅ Database connections: Monitor concurrent usage
- ✅ Index usage: Ensure queries use indexes (not seq scans)
- ✅ Storage usage: Track image uploads

**Query Analysis**:

```sql
-- Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes;

-- Check missing indexes (sequential scans)
SELECT schemaname, tablename, seq_scan, seq_tup_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

---

## Database Development Workflows

This section explains how to work with the database during daily development, schema changes, and data management.

### Understanding the Architecture

**ACR Automotive uses a PULL-BASED schema workflow:**

```
Remote TEST Database (Supabase Cloud)
        ↓
   Source of Truth
        ↓
Apply schema changes here FIRST
        ↓
Pull schema diff (auto-generates migration)
        ↓
Local Docker Supabase
        ↓
Team stays synchronized
```

**Why remote-first?**

- Catches Supabase-specific features/limitations early
- Tests RLS policies in real cloud environment
- Ensures team alignment on schema changes
- Auto-generates migration SQL (less error-prone than manual)

---

### Local vs Remote Databases

| Environment      | Type        | Purpose                | URL                                        | Data Persistence          |
| ---------------- | ----------- | ---------------------- | ------------------------------------------ | ------------------------- |
| **Local Docker** | Development | Day-to-day coding      | `http://localhost:54321`                   | Ephemeral (reset anytime) |
| **Remote TEST**  | Staging     | Schema source of truth | `https://fzsdaqpwwbuwkvbzyiax.supabase.co` | Persistent                |
| **Remote PROD**  | Production  | Live customer data     | `https://bzfnqhghtmsiecvvgmkw.supabase.co` | Persistent                |

**Local Supabase Access**:

- API: `http://localhost:54321`
- Studio (web UI): `http://localhost:54323`
- Direct DB: `postgresql://postgres:postgres@localhost:54322/postgres`

---

### Daily Development Workflow

**Goal**: Normal day-to-day coding with database access

```bash
# Morning: Start your environment
npm run supabase:start   # Start Docker Supabase (if not running)
npm run dev              # Start Next.js dev server

# During development
# - Make code changes
# - Query database via API routes
# - View data in Supabase Studio (localhost:54323)

# Before committing
npm run type-check       # Validate TypeScript
```

**Database state**: Preserved between starts/stops

**If you break something**: `npm run db:restore-snapshot`

---

### Creating & Applying Migrations

**IMPORTANT**: This project uses a **pull-based workflow** where remote TEST is the source of truth!

#### Step 1: Apply Change to Remote TEST First

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Select TEST project
3. Navigate to **SQL Editor**
4. Write and execute your schema change:
   ```sql
   -- Example: Add new column
   ALTER TABLE parts ADD COLUMN inventory_count INTEGER DEFAULT 0;
   ```
5. **Test thoroughly** in remote TEST environment
6. Verify RLS policies still work
7. Test with real data

**Why remote first?**

- You're testing in the exact environment that production uses
- Catches Supabase-specific issues (RLS, extensions, functions)
- Ensures change works before team sees it

#### Step 2: Pull Schema Diff

Once tested in remote, pull the change to create a migration file:

```bash
npx supabase db diff --linked -f add_inventory_tracking
```

**This creates**: `supabase/migrations/YYYYMMDDHHMMSS_add_inventory_tracking.sql`

**What happens**:

- Supabase CLI compares remote TEST schema to your local schema
- Generates SQL to bring local up to date
- Saves as timestamped migration file

**Good migration names**:

- `add_inventory_tracking` - Clear what it does
- `update_parts_search_function` - Describes the change
- `create_user_roles_table` - Describes what's created

**Bad names**:

- `migration` - Too generic
- `fix` - What does it fix?
- `update` - Update what?

#### Step 3: Apply Migration Locally

```bash
# Apply migration to your local database
npm run supabase:reset         # Drops DB, re-applies ALL migrations
npm run db:restore-snapshot    # Restores your local data

# Verify it works
npm run dev                     # Test the change locally
```

**What `supabase:reset` does**:

1. Drops all tables and data
2. Re-runs ALL migrations in `supabase/migrations/` in chronological order
3. Creates fresh schema
4. **Deletes your local data** (that's why we restore snapshot after)

#### Step 4: Review & Commit

```bash
# Review the generated migration
cat supabase/migrations/20251114*_add_inventory_tracking.sql

# Add to git
git add supabase/migrations/*.sql
git commit -m "feat: add inventory tracking to parts table"
git push
```

#### Step 5: Team Applies Migration

When team members pull your changes:

```bash
git pull                       # Get latest code + migrations
npm run supabase:reset         # Apply all migrations (including new one)
npm run db:restore-snapshot    # Restore their local data
```

**See also**: `supabase/migrations/README.md` for detailed migration workflow

---

### Data Management

#### Save Current State (Before Experiments)

Before making risky changes or experiments:

```bash
npm run db:save-snapshot
```

**What it does**:

- Exports all parts, vehicle_applications, cross_references
- Saves to `.snapshots/dev-snapshot.json`
- Gitignored (personal backup)
- Non-destructive (safe to run anytime)

**Use before**:

- Testing destructive operations
- Experimenting with data changes
- Trying new features that modify data
- Running unfamiliar scripts

**Time**: ~2 seconds

#### Restore After Breaking Things

```bash
npm run db:restore-snapshot
```

**What it does**:

- Deletes current data (in FK order to avoid conflicts)
- Inserts data from `.snapshots/dev-snapshot.json`
- Preserves schema/structure

**Requires**: Previously saved snapshot

**Time**: ~1 second

#### Get Fresh Data from Staging

When you need the latest data from remote TEST database:

```bash
# Option A: Export only (creates seed file for team)
npm run staging:export         # Creates fixtures/seed-data.sql

# Option B: Export + import to local (one command)
npm run staging:import         # Exports + imports to local

# After importing, save as baseline
npm run db:save-snapshot
```

**Use when**:

- Staging has new parts/data
- You need production-like data for testing
- Creating new baseline for team

**Time**: ~15 seconds

#### Seed Data from File

Import team's shared seed data:

```bash
npm run db:import-seed
```

**What it does**:

- Imports `fixtures/seed-data.sql` into local database
- Uses direct PostgreSQL connection (cross-platform, no `psql` needed)
- **Replaces** existing data

**Seed file contains**:

- 865 parts from ACR catalog
- 1000 vehicle applications
- 1000 cross-references

**Use when**:

- First time setup
- After `supabase:reset`
- Want team's shared baseline

**Time**: ~5 seconds

---

### Debugging Database Issues

#### View Database in Supabase Studio

Open **http://localhost:54323** in your browser

**You can**:

- Browse all tables and data
- Run SQL queries
- View table structure
- Check indexes
- Monitor performance
- View logs

#### Direct PostgreSQL Access

For advanced queries or tools like pgAdmin:

```
postgresql://postgres:postgres@localhost:54322/postgres
```

**Use with**:

- pgAdmin
- psql command line
- Database GUI tools (TablePlus, DBeaver, etc.)

#### Common Debugging Queries

**Check table sizes**:

```sql
SELECT
    schemaname AS schema,
    tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Find duplicate SKUs**:

```sql
SELECT acr_sku, COUNT(*)
FROM parts
GROUP BY acr_sku
HAVING COUNT(*) > 1;
```

**Check index usage**:

```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**Find slow queries** (if pg_stat_statements enabled):

```sql
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### View Docker Logs

See what's happening in the database container:

```bash
npm run supabase:status        # Get container IDs
docker logs <container-id>     # View logs
docker logs -f <container-id>  # Follow logs (live)
```

---

### Production Database Access

⚠️ **DANGER ZONE**: Production database contains real customer data!

#### Safety Checklist

Before accessing production database:

- [ ] Do I have explicit approval?
- [ ] Is there a backup plan?
- [ ] Have I tested this in staging first?
- [ ] Do I understand the rollback procedure?
- [ ] Is this during low-traffic hours?
- [ ] Have I communicated with the team?

#### Read-Only Access

**Safe way to check production**:

```bash
npm run check-prod
```

**What it does**:

- Connects to production database
- Runs read-only queries (SELECT only)
- Reports statistics (part count, vehicle count, etc.)
- **Cannot modify data**

**Use for**:

- Verifying deployment success
- Checking data integrity
- Monitoring database health

#### Write Access

**If you must modify production**:

1. **Get approval** from team lead
2. **Test in staging** first
3. **Create backup** (if possible)
4. **Document the change** in TASKS.md
5. **Communicate** with team before/after
6. **Monitor** for errors after change

**Never**:

- ❌ Run `clear-prod` unless you want to lose all data
- ❌ Apply untested migrations to production
- ❌ Make schema changes during peak hours
- ❌ Delete data without backups

---

### Backup & Restore Procedures

#### Local Development Backups

**Daily snapshots** (recommended):

```bash
npm run db:save-snapshot
```

**Create named backups** for experiments:

```bash
# Save before risky change
npm run db:save-snapshot
# Snapshot saved to .snapshots/dev-snapshot.json

# If something breaks
npm run db:restore-snapshot
```

#### Staging Backups

**Export staging data**:

```bash
npm run staging:export
```

**This creates**: `fixtures/seed-data.sql` (can be committed to git)

**Use for**:

- Creating team baseline
- Before major staging changes
- Regression testing

#### Production Backups

**Supabase automatic backups**:

- Daily automatic backups (retained 7 days)
- Point-in-time recovery available
- Access via Supabase Dashboard

**Manual export** (if needed):

```bash
# Use Supabase Dashboard:
# Settings → Database → Backups → Download
```

---

### Data Seeding Strategies

**When to use each approach**:

| Approach              | Use When                        | Speed          | Data Source                    |
| --------------------- | ------------------------------- | -------------- | ------------------------------ |
| `db:import-seed`      | First-time setup, team baseline | Fast (5s)      | `fixtures/seed-data.sql`       |
| `staging:import`      | Need latest staging data        | Medium (15s)   | Remote TEST DB                 |
| `db:restore-snapshot` | Restore personal backup         | Very fast (1s) | `.snapshots/dev-snapshot.json` |
| `staging:export`      | Update team seed file           | Medium (10s)   | Remote TEST → file             |

**Data flow**:

```
Remote TEST DB
    ↓ staging:export
fixtures/seed-data.sql (committed to git)
    ↓ db:import-seed
Local Docker Supabase
    ↓ db:save-snapshot
.snapshots/dev-snapshot.json (gitignored)
    ↓ db:restore-snapshot
Local Docker Supabase
```

---

### Troubleshooting Workflows

#### "Lost my data after supabase:reset"

**Cause**: `supabase:reset` wipes all data to apply fresh migrations

**Solution**:

```bash
# If you saved a snapshot:
npm run db:restore-snapshot

# Otherwise, use team seed file:
npm run db:import-seed

# Or pull from staging:
npm run staging:import
```

**Prevention**: Always `db:save-snapshot` before `supabase:reset`

#### "Schema migration failed"

**Cause**: Migration SQL has errors or conflicts

**Solution**:

```bash
# Nuclear option - fresh start
npm run supabase:stop
rm -rf .supabase               # Delete local Supabase state
npm run supabase:start         # Fresh start
npm run db:import-seed         # Restore data
```

#### "My local schema differs from team"

**Cause**: Pulled new code with migrations you haven't applied

**Check for drift**:

```bash
npx supabase db diff --linked  # Shows differences
```

**Solution**:

```bash
git pull                       # Get latest migrations
npm run supabase:reset         # Apply all migrations
npm run db:restore-snapshot    # Restore your data
```

#### "Types don't match database"

**Cause**: TypeScript types out of sync with database schema

**Solution**:

```bash
npm run types:generate         # Regenerate from TEST database
npm run type-check             # Verify types are correct
```

**When to run**:

- After schema changes
- After pulling team migrations
- When seeing TypeScript errors about database types

---

### Quick Command Reference

| Task                | Command                                 | Time |
| ------------------- | --------------------------------------- | ---- |
| Start database      | `npm run supabase:start`                | 10s  |
| Stop database       | `npm run supabase:stop`                 | 2s   |
| Save current data   | `npm run db:save-snapshot`              | 2s   |
| Restore data        | `npm run db:restore-snapshot`           | 1s   |
| Apply migrations    | `npm run supabase:reset`                | 10s  |
| Check schema drift  | `npx supabase db diff --linked`         | 5s   |
| Pull schema changes | `npx supabase db diff --linked -f name` | 5s   |
| Import seed data    | `npm run db:import-seed`                | 5s   |
| Get staging data    | `npm run staging:import`                | 15s  |
| Update types        | `npm run types:generate`                | 5s   |
| View database       | Open `http://localhost:54323`           | -    |

---

## Related Documentation

### Database Files

- **[schema.sql](../../src/lib/supabase/schema.sql)** - Base schema SQL
- **[migrations/](../../src/lib/supabase/migrations/)** - All migration files
- **[types.ts](../../src/lib/supabase/types.ts)** - TypeScript types (auto-generated)

### Architecture Documentation

- **[Architecture Overview](../architecture/OVERVIEW.md)** - Database layer in system architecture
- **[Data Flow](../architecture/DATA_FLOW.md)** - How database fits in request lifecycle
- **[Validation](../architecture/VALIDATION.md)** - Zod schemas that validate database operations
- **[API Design](../architecture/API_DESIGN.md)** - API routes that query the database

### Project Documentation

- **[PLANNING.md](../PLANNING.md)** - Overall project architecture and tech stack rationale
- **[TASKS.md](../TASKS.md)** - Current development status

---

**Database Version**: Migration 004 (October 17, 2025)
**Next Migration**: 005 (Multi-Tenancy Preparation)
**Maintained By**: ACR Automotive Development Team
