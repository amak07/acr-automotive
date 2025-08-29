# Supabase Database Setup - ACR Automotive

## Overview

This document explains the ACR Automotive database architecture built on Supabase PostgreSQL, designed for an auto parts cross-reference search system.

## Project Requirements

**Business Goal**: Enable counter staff at auto parts distributors to quickly find Humberto's ACR parts by searching competitor SKUs or vehicle compatibility.

**Performance Target**: Sub-300ms search response times with 865+ parts and 7,530+ cross-references.

## Database Architecture

### Core Tables

#### 1. `parts` - Main Parts Catalog
Primary table storing ACR part information from both Excel files.

```sql
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_sku VARCHAR(50) NOT NULL UNIQUE,
    part_type VARCHAR(100) NOT NULL,
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(20),
    specifications TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Decisions:**
- **UUID Primary Keys**: Better for distributed systems and security
- **acr_sku UNIQUE**: Business rule - one part per ACR SKU number
- **position_type vs position**: Avoided PostgreSQL reserved word
- **TEXT for specs**: Unlimited length for technical descriptions

#### 2. `vehicle_applications` - Vehicle Compatibility
One-to-many relationship: one part fits multiple vehicles.

```sql
CREATE TABLE vehicle_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year_range VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Decisions:**
- **Separate table**: Avoids data duplication when parts fit multiple vehicles
- **CASCADE DELETE**: When part is deleted, remove its applications
- **year_range**: Stores "2007-2013" format from Excel

#### 3. `cross_references` - Competitor SKU Mapping
One-to-many relationship: one ACR part has multiple competitor equivalents.

```sql
CREATE TABLE cross_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(50) NOT NULL,
    competitor_brand VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Design Decisions:**
- **acr_part_id vs part_id**: Clearer naming for this specific relationship
- **competitor_brand optional**: Sometimes we know SKU but not exact brand
- **50 char limit**: Handles longest competitor SKUs found in real data

## Performance Optimization

### Regular Indexes
```sql
-- Exact searches
CREATE INDEX idx_parts_acr_sku ON parts(acr_sku);
CREATE INDEX idx_cross_references_competitor_sku ON cross_references(competitor_sku);

-- Vehicle searches  
CREATE INDEX idx_vehicle_applications_make ON vehicle_applications(make);
CREATE INDEX idx_vehicle_applications_model ON vehicle_applications(model);
CREATE INDEX idx_vehicle_applications_year ON vehicle_applications(year_range);

-- JOIN optimization
CREATE INDEX idx_vehicle_applications_part_id ON vehicle_applications(part_id);
CREATE INDEX idx_cross_references_acr_part_id ON cross_references(acr_part_id);
```

### Fuzzy Search Indexes (Trigram)
```sql
-- Handle typos in SKU searches
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin(acr_sku gin_trgm_ops);
CREATE INDEX idx_cross_references_competitor_sku_trgm ON cross_references USING gin(competitor_sku gin_trgm_ops);
```

**Why Trigrams**: Breaks text into 3-character chunks for similarity matching. "ACR-MAZA-001" vs "ACR-MAZA-O01" (typo) = high similarity score.

## Database Functions

### `search_by_sku(search_sku TEXT)` - Intelligent SKU Search

**Purpose**: Multi-fallback search strategy for maximum hit rate.

**Algorithm**:
1. **Step 1**: Try exact ACR SKU match → Return with `similarity_score = 1.0`
2. **Step 2**: Try exact competitor SKU in cross_references → Return with `similarity_score = 1.0`
3. **Step 3**: Try fuzzy search on both ACR and competitor SKUs → Return best matches

**Returns**: All part columns plus:
- `match_type`: 'exact_acr' | 'competitor_sku' | 'fuzzy'
- `similarity_score`: 0.6-1.0 (fuzzy) or 1.0 (exact)

**Business Value**: Counter staff can tell customers "Found 85% match for your search" and understand the match quality.

### `search_by_vehicle(make, model, year_range TEXT)` - Vehicle Search

**Purpose**: Find parts that fit specific vehicles.

**Algorithm**: Simple JOIN between parts and vehicle_applications with filtering.

**Returns**: All part columns for matching vehicle compatibility.

**Usage**: Powers the Make → Model → Year → Part Type dropdown workflow.

## Security (Row Level Security)

### Development-Friendly MVP Policies
```sql
-- Public read access (anyone can search parts)
CREATE POLICY "Public read" ON parts FOR SELECT USING (true);

-- Admin write access (wide-open for MVP)
CREATE POLICY "Admin write" ON parts FOR ALL USING (true);
```

**Why Simple**: MVP focuses on core functionality. Real authentication comes post-MVP.

### Post-MVP Security Plan
- Supabase Auth integration
- Admin-only write policies  
- API key restrictions
- Rate limiting

## Storage Setup

### Part Images Bucket
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('acr-part-images', 'acr-part-images', true);

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'acr-part-images');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'acr-part-images');
```

**File Structure**:
```
acr-part-images/
├── ACR-MAZA-001.jpg
├── ACR-MAZA-002.jpg
└── ACR-BRAKE-100.jpg
```

**Integration**: `parts.image_url` stores the full Supabase Storage URL.

## Data Flow

### Excel Import Workflow
```
PRECIOS.xlsx → Parse → parts + cross_references tables
CATALOGACION.xlsx → Parse → part details + vehicle_applications table
```

### Search Workflow  
```
User Input → search_by_sku() OR search_by_vehicle() → Results with match metadata
```

### Image Workflow
```
Admin Upload → Supabase Storage → URL saved to parts.image_url → Display in search results
```

## Environment Configuration

### Required Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development vs Production
- **Development**: Same database, English interface, wide-open security
- **Production**: Same database, Spanish interface, tighter security policies

## Deployment Process

1. **Create Supabase Project**
2. **Run schema.sql** in SQL Editor
3. **Verify tables created** in Table Editor
4. **Test functions** with sample data
5. **Update environment variables**
6. **Deploy Next.js app** to Vercel

## Performance Monitoring

### Key Metrics
- **Search response time**: Target <300ms
- **Database connections**: Monitor concurrent usage  
- **Index usage**: Ensure queries use indexes
- **Storage usage**: Track image uploads

### Query Analysis
```sql
-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes;
```

## Troubleshooting

### Common Issues

**Reserved Words**: PostgreSQL reserves words like `position`. Use quotes or rename (we chose `position_type`).

**Foreign Key Mismatches**: Ensure column names match between tables (`part_id` vs `acr_part_id`).

**Missing Semicolons**: Function bodies require semicolons after each statement.

**Case Sensitivity**: Use consistent casing in column names and always use lowercase for table names.

### Error Patterns
```sql
-- ✅ Correct
CREATE TABLE parts (position_type VARCHAR(50));

-- ❌ Wrong - reserved word
CREATE TABLE parts (position VARCHAR(50));
```

## Future Enhancements

### Phase 2 Features
- Advanced search filters
- Multi-language support
- Real-time inventory integration
- Advanced analytics dashboard

### Performance Optimizations
- Connection pooling
- Query result caching
- Database-side search result ranking
- Materialized views for complex queries

## Related Documentation

- `EXCEL_PARSING.md` - Excel file processing details
- `SEARCH_ARCHITECTURE.md` - Search system design
- `API_DOCUMENTATION.md` - API endpoint specifications