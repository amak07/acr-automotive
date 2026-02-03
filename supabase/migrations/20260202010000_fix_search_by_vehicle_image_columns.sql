-- Fix search_by_vehicle to use correct part_images columns
-- The table uses is_primary and view_type, not image_type and angle

-- Must DROP first because return type and parameter names are changing
DROP FUNCTION IF EXISTS search_by_vehicle(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION search_by_vehicle(
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  acr_sku TEXT,
  part_type TEXT,
  position_type TEXT,
  abs_type TEXT,
  drive_type TEXT,
  bolt_pattern TEXT,
  specifications TEXT,
  workflow_status workflow_status_enum,
  primary_image_url TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sub.id,
    sub.acr_sku,
    sub.part_type,
    sub.position_type,
    sub.abs_type,
    sub.drive_type,
    sub.bolt_pattern,
    sub.specifications,
    sub.workflow_status,
    sub.primary_image_url
  FROM (
    SELECT DISTINCT ON (p.id)
      p.id,
      p.acr_sku::TEXT,
      p.part_type::TEXT,
      p.position_type::TEXT,
      p.abs_type::TEXT,
      p.drive_type::TEXT,
      p.bolt_pattern::TEXT,
      p.specifications::TEXT,
      p.workflow_status,
      (
        SELECT pi.image_url
        FROM part_images pi
        WHERE pi.part_id = p.id
          AND pi.is_primary = true
        ORDER BY pi.created_at DESC
        LIMIT 1
      ) as primary_image_url
    FROM parts p
    INNER JOIN vehicle_applications va ON p.id = va.part_id
    WHERE
      p.workflow_status = 'ACTIVE'
      AND (p_make IS NULL OR va.make ILIKE p_make)
      AND (p_model IS NULL OR va.model ILIKE p_model)
      AND (p_year IS NULL OR (va.start_year <= p_year AND va.end_year >= p_year))
    ORDER BY p.id
  ) sub
  ORDER BY sub.acr_sku
  LIMIT 100;
END;
$$;

COMMENT ON FUNCTION search_by_vehicle IS 'Search parts by vehicle make/model/year with workflow_status filtering';
