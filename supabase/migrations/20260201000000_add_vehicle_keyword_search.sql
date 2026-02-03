-- Migration: Add Vehicle Keyword Search
-- Purpose: Enable keyword-based vehicle search (e.g., "mustang", "chevy", "f-150")
-- This allows users to type vehicle names instead of using dropdowns

-- ============================================================================
-- STEP 1: Create vehicle_aliases table for nickname/abbreviation lookups
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias VARCHAR(50) NOT NULL UNIQUE,
  canonical_name VARCHAR(100) NOT NULL,
  alias_type VARCHAR(20) NOT NULL CHECK (alias_type IN ('make', 'model')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE vehicle_aliases IS 'Lookup table for vehicle nickname/abbreviation mappings (e.g., chevy -> CHEVROLET)';
COMMENT ON COLUMN vehicle_aliases.alias IS 'The nickname or abbreviation (lowercase)';
COMMENT ON COLUMN vehicle_aliases.canonical_name IS 'The actual make/model name as stored in vehicle_applications';
COMMENT ON COLUMN vehicle_aliases.alias_type IS 'Whether this maps to a make or model';

-- ============================================================================
-- STEP 2: Seed initial aliases based on ACR inventory + common nicknames
-- ============================================================================

INSERT INTO vehicle_aliases (alias, canonical_name, alias_type) VALUES
  -- Makes (based on web research + ACR inventory)
  ('chevy', 'CHEVROLET', 'make'),
  ('beemer', 'BMW', 'make'),
  ('bimmer', 'BMW', 'make'),
  ('caddy', 'CADILLAC', 'make'),
  ('ram', 'DODGE-RAM', 'make'),
  ('dodge', 'DODGE-RAM', 'make'),
  ('vw', 'VOLKSWAGEN', 'make'),
  ('merc', 'MERCEDES-BENZ', 'make'),
  ('benz', 'MERCEDES-BENZ', 'make'),
  ('mercedes', 'MERCEDES-BENZ', 'make'),
  -- Models (common nicknames)
  ('stang', 'MUSTANG', 'model'),
  ('vette', 'CORVETTE', 'model'),
  ('slade', 'ESCALADE', 'model'),
  ('cammy', 'CAMRY', 'model'),
  ('monte', 'MONTE CARLO', 'model')
ON CONFLICT (alias) DO NOTHING;

-- ============================================================================
-- STEP 3: Create trigram indexes for fuzzy vehicle search performance
-- ============================================================================

-- Ensure pg_trgm extension is available (should already be from SKU search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fuzzy search on make/model
CREATE INDEX IF NOT EXISTS idx_vehicle_applications_make_trgm
  ON vehicle_applications USING gin(make gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicle_applications_model_trgm
  ON vehicle_applications USING gin(model gin_trgm_ops);

-- B-tree index on aliases for fast lookup
CREATE INDEX IF NOT EXISTS idx_vehicle_aliases_alias
  ON vehicle_aliases(LOWER(alias));

COMMENT ON INDEX idx_vehicle_applications_make_trgm IS 'Trigram index for fuzzy make searching';
COMMENT ON INDEX idx_vehicle_applications_model_trgm IS 'Trigram index for fuzzy model searching';

-- ============================================================================
-- STEP 4: Create the search_by_vehicle_keyword function
-- ============================================================================

CREATE OR REPLACE FUNCTION search_by_vehicle_keyword(search_term TEXT)
RETURNS TABLE (
    id UUID,
    acr_sku VARCHAR(50),
    part_type VARCHAR(100),
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(50),
    specifications TEXT,
    has_product_images BOOLEAN,
    has_360_viewer BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    match_type TEXT,
    matched_vehicle TEXT
) AS $$
DECLARE
  normalized_term TEXT;
  expanded_term TEXT;
  alias_type_found TEXT;
BEGIN
    -- Normalize input: uppercase, trim whitespace
    normalized_term := UPPER(TRIM(search_term));

    -- Strategy 0: Check for alias expansion first
    SELECT va.canonical_name, va.alias_type
    INTO expanded_term, alias_type_found
    FROM vehicle_aliases va
    WHERE LOWER(va.alias) = LOWER(search_term)
    LIMIT 1;

    -- If alias found, use the canonical name
    IF expanded_term IS NOT NULL THEN
        normalized_term := expanded_term;
    END IF;

    -- Strategy 1: Exact make match
    RETURN QUERY
    SELECT DISTINCT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           CASE WHEN expanded_term IS NOT NULL THEN 'alias_make' ELSE 'exact_make' END::TEXT AS match_type,
           va.make::TEXT AS matched_vehicle
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE UPPER(va.make) = normalized_term
      AND p.part_type != 'PENDING';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 2: Exact model match
    RETURN QUERY
    SELECT DISTINCT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           CASE WHEN expanded_term IS NOT NULL THEN 'alias_model' ELSE 'exact_model' END::TEXT AS match_type,
           (va.make || ' ' || va.model)::TEXT AS matched_vehicle
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE UPPER(va.model) = normalized_term
      AND p.part_type != 'PENDING';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 3: Partial make match (ILIKE for case-insensitive)
    RETURN QUERY
    SELECT DISTINCT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'partial_make'::TEXT AS match_type,
           va.make::TEXT AS matched_vehicle
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.make ILIKE '%' || search_term || '%'
      AND p.part_type != 'PENDING'
    LIMIT 100;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 4: Partial model match
    RETURN QUERY
    SELECT DISTINCT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'partial_model'::TEXT AS match_type,
           (va.make || ' ' || va.model)::TEXT AS matched_vehicle
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.model ILIKE '%' || search_term || '%'
      AND p.part_type != 'PENDING'
    LIMIT 100;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 5: Fuzzy matching on make OR model (uses pg_trgm)
    -- Use subquery to handle ORDER BY with DISTINCT
    RETURN QUERY
    SELECT * FROM (
      SELECT DISTINCT ON (p.id)
             p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
             p.bolt_pattern, p.drive_type, p.specifications,
             p.has_product_images, p.has_360_viewer,
             p.created_at, p.updated_at,
             'fuzzy_vehicle'::TEXT AS match_type,
             (va.make || ' ' || va.model)::TEXT AS matched_vehicle
      FROM parts p
      JOIN vehicle_applications va ON p.id = va.part_id
      WHERE (similarity(va.make, search_term) > 0.3
         OR similarity(va.model, search_term) > 0.3)
        AND p.part_type != 'PENDING'
      ORDER BY p.id, GREATEST(similarity(va.make, search_term), similarity(va.model, search_term)) DESC
    ) sub
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_by_vehicle_keyword IS 'Search for parts by vehicle make/model keywords with alias expansion and multi-tier fallback';

-- ============================================================================
-- STEP 5: Add RLS policies for vehicle_aliases table
-- ============================================================================

ALTER TABLE vehicle_aliases ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see aliases)
CREATE POLICY "Public can view aliases"
  ON vehicle_aliases
  FOR SELECT
  USING (true);

-- Only admins can modify aliases
CREATE POLICY "Admins can manage aliases"
  ON vehicle_aliases
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  alias_count INTEGER;
  make_index_exists BOOLEAN;
  model_index_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO alias_count FROM vehicle_aliases;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_applications_make_trgm'
  ) INTO make_index_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicle_applications_model_trgm'
  ) INTO model_index_exists;

  RAISE NOTICE 'Vehicle Keyword Search Migration Complete:';
  RAISE NOTICE '  - vehicle_aliases table created with % initial aliases', alias_count;
  RAISE NOTICE '  - Make trigram index: %', CASE WHEN make_index_exists THEN 'created' ELSE 'FAILED' END;
  RAISE NOTICE '  - Model trigram index: %', CASE WHEN model_index_exists THEN 'created' ELSE 'FAILED' END;
  RAISE NOTICE '  - search_by_vehicle_keyword() function created';
  RAISE NOTICE '  - RLS policies applied';
END $$;
