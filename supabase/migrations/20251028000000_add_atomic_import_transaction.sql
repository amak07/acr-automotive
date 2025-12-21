-- =====================================================
-- Migration 008: Atomic Import Transaction Function
-- =====================================================
-- Description: Add PostgreSQL function to execute imports
--              atomically (all-or-nothing). Prevents partial
--              imports that leave database inconsistent.
--
-- Created: October 28, 2025
-- =====================================================

-- =====================================================
-- Atomic Import Transaction Function
-- =====================================================
-- Executes all import operations in a single transaction
-- If ANY operation fails, ALL changes are rolled back
-- =====================================================

CREATE OR REPLACE FUNCTION execute_atomic_import(
  -- Parts to add/update
  parts_to_add JSONB DEFAULT '[]'::jsonb,
  parts_to_update JSONB DEFAULT '[]'::jsonb,

  -- Vehicle applications to add/update
  vehicles_to_add JSONB DEFAULT '[]'::jsonb,
  vehicles_to_update JSONB DEFAULT '[]'::jsonb,

  -- Cross references to add/update
  cross_refs_to_add JSONB DEFAULT '[]'::jsonb,
  cross_refs_to_update JSONB DEFAULT '[]'::jsonb,

  -- Optional tenant filter
  tenant_id_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  parts_added INTEGER,
  parts_updated INTEGER,
  vehicles_added INTEGER,
  vehicles_updated INTEGER,
  cross_refs_added INTEGER,
  cross_refs_updated INTEGER
)
SECURITY DEFINER
AS $$
DECLARE
  v_parts_added INTEGER := 0;
  v_parts_updated INTEGER := 0;
  v_vehicles_added INTEGER := 0;
  v_vehicles_updated INTEGER := 0;
  v_cross_refs_added INTEGER := 0;
  v_cross_refs_updated INTEGER := 0;
BEGIN
  -- ============================================
  -- TRANSACTION STARTS HERE
  -- All operations below are atomic
  -- ============================================

  -- Step 1: Add new parts
  IF jsonb_array_length(parts_to_add) > 0 THEN
    INSERT INTO parts (
      id,
      tenant_id,
      acr_sku,
      part_type,
      position_type,
      abs_type,
      bolt_pattern,
      drive_type,
      specifications,
      has_360_viewer,
      viewer_360_frame_count,
      updated_by
    )
    SELECT
      (value->>'id')::uuid,
      COALESCE((value->>'tenant_id')::uuid, tenant_id_filter),
      value->>'acr_sku',
      value->>'part_type',
      value->>'position_type',
      value->>'abs_type',
      value->>'bolt_pattern',
      value->>'drive_type',
      value->>'specifications',
      COALESCE((value->>'has_360_viewer')::boolean, false),
      (value->>'viewer_360_frame_count')::integer,
      COALESCE(value->>'updated_by', 'import')
    FROM jsonb_array_elements(parts_to_add);

    GET DIAGNOSTICS v_parts_added = ROW_COUNT;
  END IF;

  -- Step 2: Update existing parts
  IF jsonb_array_length(parts_to_update) > 0 THEN
    WITH updates AS (
      SELECT * FROM jsonb_to_recordset(parts_to_update) AS x(
        id uuid,
        acr_sku text,
        part_type text,
        position_type text,
        abs_type text,
        bolt_pattern text,
        drive_type text,
        specifications text,
        has_360_viewer boolean,
        viewer_360_frame_count integer,
        updated_by text
      )
    )
    UPDATE parts p
    SET
      acr_sku = u.acr_sku,
      part_type = u.part_type,
      position_type = u.position_type,
      abs_type = u.abs_type,
      bolt_pattern = u.bolt_pattern,
      drive_type = u.drive_type,
      specifications = u.specifications,
      has_360_viewer = COALESCE(u.has_360_viewer, false),
      viewer_360_frame_count = u.viewer_360_frame_count,
      updated_by = COALESCE(u.updated_by, 'import'),
      updated_at = NOW()
    FROM updates u
    WHERE p.id = u.id
      AND (tenant_id_filter IS NULL OR p.tenant_id = tenant_id_filter);

    GET DIAGNOSTICS v_parts_updated = ROW_COUNT;
  END IF;

  -- Step 3: Add new vehicle applications
  IF jsonb_array_length(vehicles_to_add) > 0 THEN
    INSERT INTO vehicle_applications (
      id,
      tenant_id,
      part_id,
      make,
      model,
      start_year,
      end_year,
      updated_by
    )
    SELECT
      (value->>'id')::uuid,
      COALESCE((value->>'tenant_id')::uuid, tenant_id_filter),
      (value->>'part_id')::uuid,
      value->>'make',
      value->>'model',
      (value->>'start_year')::integer,
      (value->>'end_year')::integer,
      COALESCE(value->>'updated_by', 'import')
    FROM jsonb_array_elements(vehicles_to_add);

    GET DIAGNOSTICS v_vehicles_added = ROW_COUNT;
  END IF;

  -- Step 4: Update existing vehicle applications
  IF jsonb_array_length(vehicles_to_update) > 0 THEN
    WITH updates AS (
      SELECT * FROM jsonb_to_recordset(vehicles_to_update) AS x(
        id uuid,
        part_id uuid,
        make text,
        model text,
        start_year integer,
        end_year integer,
        updated_by text
      )
    )
    UPDATE vehicle_applications va
    SET
      part_id = u.part_id,
      make = u.make,
      model = u.model,
      start_year = u.start_year,
      end_year = u.end_year,
      updated_by = COALESCE(u.updated_by, 'import'),
      updated_at = NOW()
    FROM updates u
    WHERE va.id = u.id
      AND (tenant_id_filter IS NULL OR va.tenant_id = tenant_id_filter);

    GET DIAGNOSTICS v_vehicles_updated = ROW_COUNT;
  END IF;

  -- Step 5: Add new cross references
  IF jsonb_array_length(cross_refs_to_add) > 0 THEN
    INSERT INTO cross_references (
      id,
      tenant_id,
      acr_part_id,
      competitor_brand,
      competitor_sku,
      updated_by
    )
    SELECT
      (value->>'id')::uuid,
      COALESCE((value->>'tenant_id')::uuid, tenant_id_filter),
      (value->>'acr_part_id')::uuid,
      value->>'competitor_brand',
      value->>'competitor_sku',
      COALESCE(value->>'updated_by', 'import')
    FROM jsonb_array_elements(cross_refs_to_add);

    GET DIAGNOSTICS v_cross_refs_added = ROW_COUNT;
  END IF;

  -- Step 6: Update existing cross references
  IF jsonb_array_length(cross_refs_to_update) > 0 THEN
    WITH updates AS (
      SELECT * FROM jsonb_to_recordset(cross_refs_to_update) AS x(
        id uuid,
        acr_part_id uuid,
        competitor_brand text,
        competitor_sku text,
        updated_by text
      )
    )
    UPDATE cross_references cr
    SET
      acr_part_id = u.acr_part_id,
      competitor_brand = u.competitor_brand,
      competitor_sku = u.competitor_sku,
      updated_by = COALESCE(u.updated_by, 'import'),
      updated_at = NOW()
    FROM updates u
    WHERE cr.id = u.id
      AND (tenant_id_filter IS NULL OR cr.tenant_id = tenant_id_filter);

    GET DIAGNOSTICS v_cross_refs_updated = ROW_COUNT;
  END IF;

  -- ============================================
  -- TRANSACTION ENDS HERE
  -- If we reach this point, all operations succeeded
  -- If ANY operation failed, PostgreSQL auto-rollback
  -- ============================================

  -- Return summary of operations
  RETURN QUERY SELECT
    v_parts_added,
    v_parts_updated,
    v_vehicles_added,
    v_vehicles_updated,
    v_cross_refs_added,
    v_cross_refs_updated;

END;
$$ LANGUAGE plpgsql;
