-- Migration 009: Add SKU Normalization for Flexible Search
-- Purpose: Enable flexible SKU searching regardless of user input format
-- Examples: "15002", "ACR-15002", "acr 15002" all find the same part

-- ============================================================================
-- STEP 1: Create normalization function
-- ============================================================================
-- Strips spaces, hyphens, special characters and converts to uppercase
-- Examples:
--   "ACR-15002" → "ACR15002"
--   "acr 15002" → "ACR15002"
--   "Timken-512348" → "TIMKEN512348"
CREATE OR REPLACE FUNCTION normalize_sku(input_sku TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return NULL if input is NULL
  IF input_sku IS NULL THEN
    RETURN NULL;
  END IF;

  -- Remove all non-alphanumeric characters and convert to uppercase
  -- [^A-Za-z0-9] matches anything that's NOT a letter or number
  -- 'g' flag = global (replace all occurrences)
  RETURN UPPER(REGEXP_REPLACE(input_sku, '[^A-Za-z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mark function as IMMUTABLE for better query optimization
-- IMMUTABLE means same input always produces same output (enables indexing)

COMMENT ON FUNCTION normalize_sku IS 'Normalizes SKU by removing special characters and converting to uppercase. Used for flexible SKU searching.';

-- ============================================================================
-- STEP 2: Add normalized columns
-- ============================================================================

-- Add normalized column to parts table (NULLABLE initially for backfill)
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS acr_sku_normalized VARCHAR(50);

-- Add normalized column to cross_references table
ALTER TABLE cross_references
ADD COLUMN IF NOT EXISTS competitor_sku_normalized VARCHAR(50);

COMMENT ON COLUMN parts.acr_sku_normalized IS 'Auto-populated normalized ACR SKU for search optimization. Computed from acr_sku.';
COMMENT ON COLUMN cross_references.competitor_sku_normalized IS 'Auto-populated normalized competitor SKU for search optimization. Computed from competitor_sku.';

-- ============================================================================
-- STEP 3: Create trigger function for auto-population
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_normalize_part_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically populate normalized ACR SKU on INSERT or UPDATE
  NEW.acr_sku_normalized := normalize_sku(NEW.acr_sku);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_normalize_cross_ref_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically populate normalized competitor SKU on INSERT or UPDATE
  NEW.competitor_sku_normalized := normalize_sku(NEW.competitor_sku);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Attach triggers to tables
-- ============================================================================

-- Trigger for parts table (fires BEFORE INSERT/UPDATE)
DROP TRIGGER IF EXISTS trigger_normalize_part_sku ON parts;
CREATE TRIGGER trigger_normalize_part_sku
  BEFORE INSERT OR UPDATE OF acr_sku ON parts
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_part_sku();

-- Trigger for cross_references table (fires BEFORE INSERT/UPDATE)
DROP TRIGGER IF EXISTS trigger_normalize_cross_ref_sku ON cross_references;
CREATE TRIGGER trigger_normalize_cross_ref_sku
  BEFORE INSERT OR UPDATE OF competitor_sku ON cross_references
  FOR EACH ROW
  EXECUTE FUNCTION auto_normalize_cross_ref_sku();

COMMENT ON TRIGGER trigger_normalize_part_sku ON parts IS 'Auto-populates acr_sku_normalized on INSERT/UPDATE';
COMMENT ON TRIGGER trigger_normalize_cross_ref_sku ON cross_references IS 'Auto-populates competitor_sku_normalized on INSERT/UPDATE';

-- ============================================================================
-- STEP 5: Backfill existing data
-- ============================================================================

-- Backfill parts table (triggers will fire automatically)
UPDATE parts
SET acr_sku_normalized = normalize_sku(acr_sku)
WHERE acr_sku_normalized IS NULL OR acr_sku_normalized != normalize_sku(acr_sku);

-- Backfill cross_references table (triggers will fire automatically)
UPDATE cross_references
SET competitor_sku_normalized = normalize_sku(competitor_sku)
WHERE competitor_sku_normalized IS NULL OR competitor_sku_normalized != normalize_sku(competitor_sku);

-- ============================================================================
-- STEP 6: Data validation and cleanup (BEFORE adding constraint)
-- ============================================================================

-- Check for parts that don't start with "ACR" prefix
DO $$
DECLARE
  invalid_count INTEGER;
  sample_skus TEXT;
BEGIN
  -- Get count of invalid SKUs
  SELECT COUNT(*)
  INTO invalid_count
  FROM parts
  WHERE acr_sku !~* '^ACR';

  -- Get sample SKUs (first 10)
  SELECT STRING_AGG(acr_sku, ', ')
  INTO sample_skus
  FROM (
    SELECT acr_sku
    FROM parts
    WHERE acr_sku !~* '^ACR'
    ORDER BY acr_sku
    LIMIT 10
  ) sample;

  IF invalid_count > 0 THEN
    RAISE NOTICE '⚠️  Found % parts without ACR prefix. Sample SKUs: %', invalid_count, sample_skus;
    RAISE NOTICE '   These parts need to be fixed before applying the constraint.';
    RAISE NOTICE '   Options:';
    RAISE NOTICE '     1. Update SKUs to add ACR prefix: UPDATE parts SET acr_sku = ''ACR'' || acr_sku WHERE acr_sku !~* ''^ACR'';';
    RAISE NOTICE '     2. Delete invalid parts: DELETE FROM parts WHERE acr_sku !~* ''^ACR'';';
    RAISE NOTICE '     3. Skip constraint for now (not recommended for production)';

    -- Uncomment ONE of these options:

    -- OPTION 1: Auto-fix by prepending "ACR" (recommended for test/dev)
    UPDATE parts SET acr_sku = 'ACR' || acr_sku WHERE acr_sku !~* '^ACR';
    RAISE NOTICE '✅ Fixed % parts by prepending ACR prefix', invalid_count;

    -- OPTION 2: Delete invalid parts (use with caution!)
    -- DELETE FROM parts WHERE acr_sku !~* '^ACR';
    -- RAISE NOTICE '✅ Deleted % invalid parts', invalid_count;

    -- OPTION 3: Abort migration (fail-safe default)
    -- RAISE EXCEPTION 'Migration aborted: % parts found without ACR prefix. Please fix data first or uncomment auto-fix option in migration file.', invalid_count;
  ELSE
    RAISE NOTICE '✅ All parts have valid ACR prefix';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: Add CHECK constraint for ACR prefix enforcement
-- ============================================================================

-- Enforce that all ACR SKUs must start with "ACR" (case-insensitive)
-- Allows variations: "ACR15002", "ACR-15002", "acr 15002"
-- Rejects: "15002", "XYZ15002", etc.
ALTER TABLE parts
ADD CONSTRAINT check_acr_sku_prefix
CHECK (acr_sku ~* '^ACR');

-- ~* operator = case-insensitive regex match
-- ^ACR = must start with "ACR" (case doesn't matter)

COMMENT ON CONSTRAINT check_acr_sku_prefix ON parts IS 'Ensures all ACR SKUs start with "ACR" prefix (case-insensitive)';

-- ============================================================================
-- STEP 8: Create indexes for performance
-- ============================================================================

-- Index on normalized ACR SKU for fast lookups
CREATE INDEX IF NOT EXISTS idx_parts_acr_sku_normalized
ON parts(acr_sku_normalized)
WHERE acr_sku_normalized IS NOT NULL;

-- Index on normalized competitor SKU for fast cross-reference lookups
CREATE INDEX IF NOT EXISTS idx_cross_ref_competitor_sku_normalized
ON cross_references(competitor_sku_normalized)
WHERE competitor_sku_normalized IS NOT NULL;

-- Composite index for join optimization (part lookup via competitor SKU)
CREATE INDEX IF NOT EXISTS idx_cross_ref_normalized_with_part
ON cross_references(competitor_sku_normalized, acr_part_id)
WHERE competitor_sku_normalized IS NOT NULL;

COMMENT ON INDEX idx_parts_acr_sku_normalized IS 'Performance index for normalized ACR SKU searches';
COMMENT ON INDEX idx_cross_ref_competitor_sku_normalized IS 'Performance index for normalized competitor SKU searches';
COMMENT ON INDEX idx_cross_ref_normalized_with_part IS 'Composite index for optimized cross-reference joins';

-- ============================================================================
-- STEP 9: Update search_by_sku() function for flexible searching
-- ============================================================================

-- Enhanced search function that uses normalized columns
-- Supports multiple search strategies:
--   1. Exact normalized ACR SKU match
--   2. ACR SKU with "ACR" prefix added (handles "15002" → "ACR15002")
--   3. Partial normalized ACR SKU match (LIKE)
--   4. Exact normalized competitor SKU match
--   5. Competitor SKU with partial match (handles brand prefixes)
--   6. Fuzzy matching fallback (existing logic)

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
DECLARE
  normalized_input TEXT;
BEGIN
    -- Normalize user input for consistent searching
    normalized_input := normalize_sku(search_sku);

    -- Strategy 1: Try exact normalized ACR SKU match (highest priority)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'exact_normalized_acr'::TEXT AS match_type,
      1.0::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized = normalized_input;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 2: Try with "ACR" prefix added (handles "15002" → "ACR15002")
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'with_acr_prefix'::TEXT AS match_type,
      0.95::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized = 'ACR' || normalized_input;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 3: Try partial normalized ACR SKU match (handles partial searches)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'partial_acr'::TEXT AS match_type,
      0.9::REAL AS similarity_score
    FROM parts p
    WHERE p.acr_sku_normalized LIKE '%' || normalized_input || '%'
    LIMIT 10;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 4: Try exact normalized competitor SKU match
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'exact_competitor'::TEXT AS match_type,
      1.0::REAL AS similarity_score
    FROM parts p
    JOIN cross_references c ON p.id = c.acr_part_id
    WHERE c.competitor_sku_normalized = normalized_input;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 5: Try partial normalized competitor SKU match (handles brand prefixes)
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.created_at, p.updated_at,
      'partial_competitor'::TEXT AS match_type,
      0.85::REAL AS similarity_score
    FROM parts p
    JOIN cross_references c ON p.id = c.acr_part_id
    WHERE c.competitor_sku_normalized LIKE '%' || normalized_input || '%'
    LIMIT 10;

    IF FOUND THEN RETURN; END IF;

    -- Strategy 6: Fuzzy matching fallback (handles typos) - using ORIGINAL SKU values
    RETURN QUERY
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

    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_by_sku IS 'Flexible SKU search using normalized columns with multiple fallback strategies';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify migration success
DO $$
DECLARE
  parts_count INTEGER;
  cross_ref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO parts_count FROM parts WHERE acr_sku_normalized IS NOT NULL;
  SELECT COUNT(*) INTO cross_ref_count FROM cross_references WHERE competitor_sku_normalized IS NOT NULL;

  RAISE NOTICE 'Migration 009 complete:';
  RAISE NOTICE '  - Parts normalized: %', parts_count;
  RAISE NOTICE '  - Cross-references normalized: %', cross_ref_count;
  RAISE NOTICE '  - Triggers created: 2';
  RAISE NOTICE '  - Indexes created: 3';
  RAISE NOTICE '  - search_by_sku() function updated';
END $$;
