-- ============================================================================
-- ACR Automotive Database Schema - LEARNING VERSION
-- Auto parts cross-reference search system for Humberto's business
-- ============================================================================

-- We need UUID generation and fuzzy text search capabilities
-- Extensions to enable:
-- 1. "uuid-ossp" - for generating unique IDs
-- 2. "pg_trgm" - for fuzzy search (finding similar SKUs when users make typos)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- TABLE 1: PARTS (Main parts catalog)
-- ============================================================================
-- This stores the main parts data from both Excel files
-- Data comes from: PRECIOS (basic info) + CATALOGACION (detailed specs)

-- Requirements from PLANNING.md:
-- - Primary key: UUID (auto-generated)
-- - ACR SKU: Humberto's part number (UNIQUE, required)
-- - Part details: type, position, ABS, bolt pattern, drive type, specs
-- - Image URL: for admin-uploaded photos
-- - Timestamps: created_at, updated_at

CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_sku VARCHAR(50) NOT NULL UNIQUE,
    part_type VARCHAR(100) NOT NULL,
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(50),
    specifications TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- TABLE 2: VEHICLE_APPLICATIONS (Which parts fit which cars)
-- ============================================================================
-- This stores vehicle compatibility from CATALOGACION Excel
-- One part can fit multiple vehicles, so this is a separate table

CREATE TABLE vehicle_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- TABLE 3: CROSS_REFERENCES (Competitor SKU mappings)
-- ============================================================================
-- This stores competitor SKU to ACR part mappings from PRECIOS Excel
-- One ACR part can have multiple competitor equivalents

CREATE TABLE cross_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(50) NOT NULL,
    competitor_brand VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- PERFORMANCE INDEXES (Make searches fast)
-- ============================================================================
-- These make database searches much faster
-- Critical for sub-300ms search response times

-- Indexes for parts table:
CREATE INDEX idx_parts_acr_sku ON parts(acr_sku);  -- For ACR SKU lookup
CREATE INDEX idx_parts_part_type ON parts(part_type);  -- For part type filtering

-- Indexes for vehicle_applications table:
CREATE INDEX idx_vehicle_applications_make ON vehicle_applications(make);  -- For make search
CREATE INDEX idx_vehicle_applications_model ON vehicle_applications(model);  -- For model search
CREATE INDEX idx_vehicle_applications_year ON vehicle_applications(start_year, end_year); -- For year search
CREATE INDEX idx_vehicle_applications_part_id ON vehicle_applications(part_id);  -- For joining to parts

-- Indexes for cross_references table:
CREATE INDEX idx_cross_references_competitor_sku ON cross_references(competitor_sku);  -- For competitor SKU lookup
CREATE INDEX idx_cross_references_acr_part_id ON cross_references(acr_part_id);  -- For joining to parts


-- ============================================================================
-- FUZZY SEARCH INDEXES (Handle typos in SKU searches)
-- ============================================================================
-- These use the pg_trgm extension for fuzzy matching

CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin(acr_sku gin_trgm_ops);
CREATE INDEX idx_cross_references_competitor_sku_trgm ON cross_references USING gin(competitor_sku gin_trgm_ops);


-- ============================================================================
-- DATABASE FUNCTIONS (Search logic)
-- ============================================================================
-- These are stored procedures that handle complex search queries

-- Drop existing functions if they exist (needed when changing return types)
DROP FUNCTION IF EXISTS search_by_sku(TEXT);
DROP FUNCTION IF EXISTS search_by_vehicle(TEXT, TEXT, INT);

-- Search for parts by SKU with intelligent fallback strategy
-- Priority order: exact ACR → exact competitor → fuzzy search
-- Returns parts with match quality information for UI display
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
    match_type TEXT,
    similarity_score REAL
) AS $$
BEGIN
    -- Step 1: Try exact match on ACR SKU (highest priority)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'exact_acr'::TEXT AS match_type,
      1.0::REAL AS similarity_score  -- Perfect match = 1.0
    FROM parts p
    WHERE p.acr_sku = search_sku;

    -- Step 2: If no ACR match, try exact competitor SKU match
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
        'competitor_sku'::TEXT AS match_type,
        1.0::REAL AS similarity_score  -- Perfect match = 1.0
      FROM parts p
      JOIN cross_references c ON p.id = c.acr_part_id
      WHERE c.competitor_sku = search_sku;
    END IF;

    -- Step 3: If still no match, try fuzzy search (handles typos)
    IF NOT FOUND THEN
      RETURN QUERY
      -- Search both ACR and competitor SKUs for similar matches
      SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
             'fuzzy'::TEXT AS match_type,
             similarity(p.acr_sku, search_sku) AS similarity_score
      FROM parts p
      WHERE similarity(p.acr_sku, search_sku) > 0.6

      UNION

      SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
             'fuzzy'::TEXT AS match_type,
             similarity(c.competitor_sku, search_sku) AS similarity_score
      FROM parts p
      JOIN cross_references c ON p.id = c.acr_part_id
      WHERE similarity(c.competitor_sku, search_sku) > 0.6

      ORDER BY similarity_score DESC  -- Best matches first
      LIMIT 10;  -- Return top 10 fuzzy matches
    END IF;
END;
$$ LANGUAGE plpgsql;


-- This should find parts that fit specific vehicles
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications,
    p.created_at, p.updated_at
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.make = $1 AND va.model = $2 AND $3 BETWEEN va.start_year AND va.end_year;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECURITY (Row Level Security policies). NEEDED by Supabase.
-- ============================================================================
-- These control who can read/write data

-- Enable RLS on all tables
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;

-- Public read access for search functionality:
CREATE POLICY "Public read" ON parts FOR SELECT USING (true);
CREATE POLICY "Public read" ON vehicle_applications FOR SELECT USING (true);
CREATE POLICY "Public read" ON cross_references FOR SELECT USING (true);

-- Admin write access (for now, allow all writes in development):
CREATE POLICY "Admin write" ON parts FOR ALL USING (true);
CREATE POLICY "Admin write" ON vehicle_applications FOR ALL USING (true);
CREATE POLICY "Admin write" ON cross_references FOR ALL USING (true);


-- ============================================================================
-- STORAGE SETUP (For part images)
-- ============================================================================

-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public) VALUES ('acr-part-images', 'acr-part-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'acr-part-images');
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'acr-part-images');


