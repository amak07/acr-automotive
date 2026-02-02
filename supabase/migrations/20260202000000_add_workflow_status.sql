-- ============================================================================
-- Migration: Add workflow_status Column to Parts Table
-- Phase 5: Workflow Status for Parts Lifecycle Management
-- ============================================================================
--
-- Purpose: Enable data managers to control part visibility via Excel export/import
--
-- Status Values:
--   ACTIVE   - Part is visible and searchable (default)
--   INACTIVE - Part is hidden from public search
--   DELETE   - Part will be removed on next import
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Create ENUM type for workflow status
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status_enum') THEN
    CREATE TYPE workflow_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'DELETE');
  END IF;
END
$$;

COMMENT ON TYPE workflow_status_enum IS
  'Part workflow status: ACTIVE=visible, INACTIVE=hidden, DELETE=pending removal';

-- ============================================================================
-- STEP 2: Add workflow_status column to parts table
-- ============================================================================

ALTER TABLE parts
ADD COLUMN IF NOT EXISTS workflow_status workflow_status_enum NOT NULL DEFAULT 'ACTIVE';

COMMENT ON COLUMN parts.workflow_status IS
  'Workflow status: ACTIVE (visible), INACTIVE (hidden from search), DELETE (pending removal)';

-- ============================================================================
-- STEP 3: Migrate existing PENDING parts to INACTIVE status
-- ============================================================================

-- Parts with part_type='PENDING' were used as a makeshift "not ready" marker
-- Migrate these to INACTIVE status for the new workflow
UPDATE parts
SET workflow_status = 'INACTIVE'
WHERE UPPER(part_type) = 'PENDING'
  AND workflow_status = 'ACTIVE';

-- ============================================================================
-- STEP 4: Create indexes for efficient status filtering
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parts_workflow_status
ON parts(workflow_status);

-- Partial index for active parts (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_parts_active_sku
ON parts(acr_sku) WHERE workflow_status = 'ACTIVE';

COMMENT ON INDEX idx_parts_workflow_status IS 'Index for filtering by workflow status';
COMMENT ON INDEX idx_parts_active_sku IS 'Partial index for active parts SKU lookups';

-- ============================================================================
-- STEP 5: Update search_by_sku() to filter by workflow_status
-- ============================================================================

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
    has_product_images BOOLEAN,
    has_360_viewer BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    match_type TEXT,
    similarity_score REAL
) AS $$
DECLARE
  normalized_input TEXT;
BEGIN
    -- Normalize user input for consistent searching
    normalized_input := normalize_sku(search_sku);

    -- Strategy 1: Try exact normalized ACR SKU match (highest priority)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'exact_normalized_acr'::TEXT AS match_type,
           1.0::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized = normalized_input
      AND p.workflow_status = 'ACTIVE';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 2: Try with "ACR" prefix added (handles "15002" → "ACR15002")
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'with_acr_prefix'::TEXT AS match_type,
           0.95::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized = 'ACR' || normalized_input
      AND p.workflow_status = 'ACTIVE';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 3: Try partial normalized ACR SKU match (handles partial searches)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'partial_acr'::TEXT AS match_type,
           0.9::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized LIKE '%' || normalized_input || '%'
      AND p.workflow_status = 'ACTIVE'
    LIMIT 10;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 4: Try exact normalized competitor SKU match
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'exact_competitor'::TEXT AS match_type,
           1.0::REAL AS similarity_score
    FROM parts p
    JOIN cross_references c ON p.id = c.acr_part_id
    WHERE c.competitor_sku_normalized = normalized_input
      AND p.workflow_status = 'ACTIVE';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 5: Try partial normalized competitor SKU match (handles brand prefixes)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'partial_competitor'::TEXT AS match_type,
           0.85::REAL AS similarity_score
    FROM parts p
    JOIN cross_references c ON p.id = c.acr_part_id
    WHERE c.competitor_sku_normalized LIKE '%' || normalized_input || '%'
      AND p.workflow_status = 'ACTIVE'
    LIMIT 10;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 6: Fuzzy matching fallback (handles typos) - using ORIGINAL SKU values
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'fuzzy'::TEXT AS match_type,
           similarity(p.acr_sku, search_sku) AS similarity_score
    FROM parts p
    WHERE similarity(p.acr_sku, search_sku) > 0.6
      AND p.workflow_status = 'ACTIVE'

    UNION

    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at,
           'fuzzy'::TEXT AS match_type,
           similarity(c.competitor_sku, search_sku) AS similarity_score
    FROM parts p
    JOIN cross_references c ON p.id = c.acr_part_id
    WHERE similarity(c.competitor_sku, search_sku) > 0.6
      AND p.workflow_status = 'ACTIVE'

    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_by_sku IS 'Flexible SKU search using normalized columns with workflow_status filtering';

-- ============================================================================
-- STEP 6: Update search_by_vehicle() to filter by workflow_status
-- ============================================================================

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
    has_product_images BOOLEAN,
    has_360_viewer BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type,
           p.bolt_pattern, p.drive_type, p.specifications,
           p.has_product_images, p.has_360_viewer,
           p.created_at, p.updated_at
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.make = $1
      AND va.model = $2
      AND $3 BETWEEN va.start_year AND va.end_year
      AND p.workflow_status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_by_vehicle IS 'Vehicle search with workflow_status filtering';

-- ============================================================================
-- STEP 7: Update search_by_vehicle_keyword() to use workflow_status
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

    -- Strategy 1: Exact make match (ACTIVE only)
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
      AND p.workflow_status = 'ACTIVE';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 2: Exact model match (ACTIVE only)
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
      AND p.workflow_status = 'ACTIVE';

    IF FOUND THEN RETURN; END IF;

    -- Strategy 3: Partial make match (ILIKE for case-insensitive) (ACTIVE only)
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
      AND p.workflow_status = 'ACTIVE'
    LIMIT 100;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 4: Partial model match (ACTIVE only)
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
      AND p.workflow_status = 'ACTIVE'
    LIMIT 100;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 5: Fuzzy matching on make OR model (uses pg_trgm) (ACTIVE only)
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
        AND p.workflow_status = 'ACTIVE'
      ORDER BY p.id, GREATEST(similarity(va.make, search_term), similarity(va.model, search_term)) DESC
    ) sub
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_by_vehicle_keyword IS 'Search by vehicle make/model with alias expansion and workflow_status filtering';

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================

DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM parts;
  SELECT COUNT(*) INTO active_count FROM parts WHERE workflow_status = 'ACTIVE';
  SELECT COUNT(*) INTO inactive_count FROM parts WHERE workflow_status = 'INACTIVE';

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration 20260202000000_add_workflow_status complete:';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '  - workflow_status column added to parts table';
  RAISE NOTICE '  - Total parts: %', total_count;
  RAISE NOTICE '  - ACTIVE parts: %', active_count;
  RAISE NOTICE '  - INACTIVE parts (migrated from PENDING): %', inactive_count;
  RAISE NOTICE '  - Indexes created: idx_parts_workflow_status, idx_parts_active_sku';
  RAISE NOTICE '  - search_by_sku() updated with workflow_status filtering';
  RAISE NOTICE '  - search_by_vehicle() updated with workflow_status filtering';
  RAISE NOTICE '  - search_by_vehicle_keyword() updated with workflow_status filtering';
  RAISE NOTICE '============================================================';
END $$;
