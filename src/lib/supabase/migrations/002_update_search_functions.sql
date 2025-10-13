-- ============================================================================
-- Migration 002: Update Search Functions to Remove image_url
-- Fix database functions to not reference removed image_url column
-- Date: October 13, 2025
-- ============================================================================

-- Drop existing functions first (required when changing return type)
DROP FUNCTION IF EXISTS search_by_sku(TEXT);
DROP FUNCTION IF EXISTS search_by_vehicle(TEXT, TEXT, INT);

-- Update search_by_sku function to remove image_url column
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

-- Update search_by_vehicle function to remove image_url column
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
-- IMPLEMENTATION NOTES:
-- ============================================================================
-- 1. Removed image_url from both search functions' return types
-- 2. Images are now fetched separately via the part_images table
-- 3. Frontend enrichWithPrimaryImages() function handles image fetching
-- 4. This fixes the "column p.image_url does not exist" error in public search
