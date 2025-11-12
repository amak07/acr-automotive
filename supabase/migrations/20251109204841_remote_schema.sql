

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_normalize_cross_ref_sku"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Automatically populate normalized competitor SKU on INSERT or UPDATE
  NEW.competitor_sku_normalized := normalize_sku(NEW.competitor_sku);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_normalize_cross_ref_sku"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_normalize_part_sku"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Automatically populate normalized ACR SKU on INSERT or UPDATE
  NEW.acr_sku_normalized := normalize_sku(NEW.acr_sku);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_normalize_part_sku"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_import_snapshots"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Keep only last 3 snapshots per tenant
    DELETE FROM import_history
    WHERE id IN (
        SELECT id FROM import_history
        WHERE tenant_id IS NOT DISTINCT FROM NEW.tenant_id
        ORDER BY created_at DESC
        OFFSET 3
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_import_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb" DEFAULT '[]'::"jsonb", "parts_to_update" "jsonb" DEFAULT '[]'::"jsonb", "vehicles_to_add" "jsonb" DEFAULT '[]'::"jsonb", "vehicles_to_update" "jsonb" DEFAULT '[]'::"jsonb", "cross_refs_to_add" "jsonb" DEFAULT '[]'::"jsonb", "cross_refs_to_update" "jsonb" DEFAULT '[]'::"jsonb", "tenant_id_filter" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("parts_added" integer, "parts_updated" integer, "vehicles_added" integer, "vehicles_updated" integer, "cross_refs_added" integer, "cross_refs_updated" integer)
    LANGUAGE "plpgsql"
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
$$;


ALTER FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb", "parts_to_update" "jsonb", "vehicles_to_add" "jsonb", "vehicles_to_update" "jsonb", "cross_refs_to_add" "jsonb", "cross_refs_to_update" "jsonb", "tenant_id_filter" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb", "parts_to_update" "jsonb", "vehicles_to_add" "jsonb", "vehicles_to_update" "jsonb", "cross_refs_to_add" "jsonb", "cross_refs_to_update" "jsonb", "tenant_id_filter" "uuid") IS 'Executes bulk import operations atomically. If ANY operation fails, ALL changes are rolled back automatically. This prevents partial imports that would leave the database in an inconsistent state.';



CREATE OR REPLACE FUNCTION "public"."normalize_sku"("input_sku" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."normalize_sku"("input_sku" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."normalize_sku"("input_sku" "text") IS 'Normalizes SKU by removing special characters and converting to uppercase. Used for flexible SKU searching.';



CREATE OR REPLACE FUNCTION "public"."search_by_sku"("search_sku" "text") RETURNS TABLE("id" "uuid", "acr_sku" character varying, "part_type" character varying, "position_type" character varying, "abs_type" character varying, "bolt_pattern" character varying, "drive_type" character varying, "specifications" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "match_type" "text", "similarity_score" real)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."search_by_sku"("search_sku" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."search_by_sku"("search_sku" "text") IS 'Flexible SKU search using normalized columns with multiple fallback strategies';



CREATE OR REPLACE FUNCTION "public"."search_by_vehicle"("make" "text", "model" "text", "target_year" integer) RETURNS TABLE("id" "uuid", "acr_sku" character varying, "part_type" character varying, "position_type" character varying, "abs_type" character varying, "bolt_pattern" character varying, "drive_type" character varying, "specifications" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY
    SELECT p.id, p.acr_sku, p.part_type, p.position_type, p.abs_type, p.bolt_pattern, p.drive_type, p.specifications,
    p.created_at, p.updated_at
    FROM parts p
    JOIN vehicle_applications va ON p.id = va.part_id
    WHERE va.make = $1 AND va.model = $2 AND $3 BETWEEN va.start_year AND va.end_year;
END;
$_$;


ALTER FUNCTION "public"."search_by_vehicle"("make" "text", "model" "text", "target_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Auto-update timestamp on any modification
  NEW.updated_at = NOW();

  -- If updated_by is not explicitly set, default to 'manual'
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by = 'manual';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to auto-update updated_at timestamp and set default updated_by value.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cross_references" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "acr_part_id" "uuid" NOT NULL,
    "competitor_sku" character varying(50) NOT NULL,
    "competitor_brand" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid",
    "updated_by" "text" DEFAULT 'manual'::"text",
    "competitor_sku_normalized" character varying(50)
);


ALTER TABLE "public"."cross_references" OWNER TO "postgres";


COMMENT ON COLUMN "public"."cross_references"."updated_at" IS 'Timestamp of last modification. Used for rollback conflict detection.';



COMMENT ON COLUMN "public"."cross_references"."updated_by" IS 'Source of last modification: "manual" (admin UI) or "import" (Excel import).';



COMMENT ON COLUMN "public"."cross_references"."competitor_sku_normalized" IS 'Auto-populated normalized competitor SKU for search optimization. Computed from competitor_sku.';



CREATE TABLE IF NOT EXISTS "public"."import_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "imported_by" "text",
    "file_name" "text" NOT NULL,
    "file_size_bytes" integer,
    "rows_imported" integer DEFAULT 0 NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "import_summary" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_import_summary" CHECK ((("import_summary" IS NULL) OR (("import_summary" ? 'adds'::"text") AND ("import_summary" ? 'updates'::"text") AND ("import_summary" ? 'deletes'::"text")))),
    CONSTRAINT "valid_snapshot" CHECK ((("snapshot_data" ? 'parts'::"text") AND ("snapshot_data" ? 'vehicle_applications'::"text") AND ("snapshot_data" ? 'cross_references'::"text") AND ("snapshot_data" ? 'timestamp'::"text")))
);


ALTER TABLE "public"."import_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."import_history" IS 'Stores last 3 import snapshots for rollback feature. snapshot_data contains full pre-import state of all affected records.';



COMMENT ON COLUMN "public"."import_history"."imported_by" IS 'Username or ID of user who performed import (for audit trail).';



COMMENT ON COLUMN "public"."import_history"."file_name" IS 'Original filename of uploaded Excel file.';



COMMENT ON COLUMN "public"."import_history"."rows_imported" IS 'Total number of rows processed (adds + updates + deletes).';



COMMENT ON COLUMN "public"."import_history"."snapshot_data" IS 'JSONB structure: { parts: [...], vehicle_applications: [...], cross_references: [...], timestamp: "..." }. Contains complete pre-import snapshot for rollback.';



COMMENT ON COLUMN "public"."import_history"."import_summary" IS 'JSONB structure: { adds: N, updates: N, deletes: N }. Summary of changes made during import.';



CREATE TABLE IF NOT EXISTS "public"."part_360_frames" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "part_id" "uuid" NOT NULL,
    "frame_number" integer NOT NULL,
    "image_url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_size_bytes" integer,
    "width" integer,
    "height" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid",
    CONSTRAINT "positive_dimensions" CHECK (((("width" IS NULL) AND ("height" IS NULL)) OR (("width" > 0) AND ("height" > 0)))),
    CONSTRAINT "positive_file_size" CHECK ((("file_size_bytes" IS NULL) OR ("file_size_bytes" > 0))),
    CONSTRAINT "valid_frame_number" CHECK (("frame_number" >= 0))
);


ALTER TABLE "public"."part_360_frames" OWNER TO "postgres";


COMMENT ON TABLE "public"."part_360_frames" IS '360° viewer frames for interactive part inspection. Each part can have 12-48 frames showing horizontal rotation.';



COMMENT ON COLUMN "public"."part_360_frames"."frame_number" IS 'Sequential frame number (0-indexed). Frame 0 is the starting position.';



COMMENT ON COLUMN "public"."part_360_frames"."storage_path" IS 'Supabase storage path: 360-viewer/{acr_sku}/frame-000.jpg';



COMMENT ON COLUMN "public"."part_360_frames"."width" IS 'Image width in pixels (standardized to 1200px by Sharp optimization)';



COMMENT ON COLUMN "public"."part_360_frames"."height" IS 'Image height in pixels (standardized to 1200px by Sharp optimization)';



CREATE TABLE IF NOT EXISTS "public"."part_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "part_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid"
);


ALTER TABLE "public"."part_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "acr_sku" character varying(50) NOT NULL,
    "part_type" character varying(100) NOT NULL,
    "position_type" character varying(50),
    "abs_type" character varying(20),
    "bolt_pattern" character varying(50),
    "drive_type" character varying(50),
    "specifications" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_360_viewer" boolean DEFAULT false,
    "viewer_360_frame_count" integer DEFAULT 0,
    "tenant_id" "uuid",
    "updated_by" "text" DEFAULT 'manual'::"text",
    "acr_sku_normalized" character varying(50),
    CONSTRAINT "check_acr_sku_prefix" CHECK ((("acr_sku")::"text" ~* '^ACR'::"text")),
    CONSTRAINT "valid_360_frame_count" CHECK ((("viewer_360_frame_count" >= 0) AND ("viewer_360_frame_count" <= 100)))
);


ALTER TABLE "public"."parts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."parts"."updated_at" IS 'Timestamp of last modification. Used for rollback conflict detection.';



COMMENT ON COLUMN "public"."parts"."has_360_viewer" IS 'True if part has 360° viewer configured (at least 12 frames uploaded)';



COMMENT ON COLUMN "public"."parts"."viewer_360_frame_count" IS 'Total number of frames in 360° viewer (0 if not configured)';



COMMENT ON COLUMN "public"."parts"."updated_by" IS 'Source of last modification: "manual" (admin UI) or "import" (Excel import). Used to distinguish user edits from bulk imports.';



COMMENT ON COLUMN "public"."parts"."acr_sku_normalized" IS 'Auto-populated normalized ACR SKU for search optimization. Computed from acr_sku.';



COMMENT ON CONSTRAINT "check_acr_sku_prefix" ON "public"."parts" IS 'Ensures all ACR SKUs start with "ACR" prefix (case-insensitive)';



CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_status" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


COMMENT ON TABLE "public"."tenants" IS 'Multi-tenant support. MVP uses NULL tenant_id (default tenant). Future: One row per dealer/business.';



CREATE TABLE IF NOT EXISTS "public"."vehicle_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "part_id" "uuid" NOT NULL,
    "make" character varying(50) NOT NULL,
    "model" character varying(100) NOT NULL,
    "start_year" integer NOT NULL,
    "end_year" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tenant_id" "uuid",
    "updated_by" "text" DEFAULT 'manual'::"text"
);


ALTER TABLE "public"."vehicle_applications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."vehicle_applications"."updated_at" IS 'Timestamp of last modification. Used for rollback conflict detection.';



COMMENT ON COLUMN "public"."vehicle_applications"."updated_by" IS 'Source of last modification: "manual" (admin UI) or "import" (Excel import).';



ALTER TABLE ONLY "public"."cross_references"
    ADD CONSTRAINT "cross_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_history"
    ADD CONSTRAINT "import_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."part_360_frames"
    ADD CONSTRAINT "part_360_frames_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."part_images"
    ADD CONSTRAINT "part_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."part_360_frames"
    ADD CONSTRAINT "unique_part_frame" UNIQUE ("part_id", "frame_number");



ALTER TABLE ONLY "public"."vehicle_applications"
    ADD CONSTRAINT "vehicle_applications_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_cross_ref_competitor_sku_normalized" ON "public"."cross_references" USING "btree" ("competitor_sku_normalized") WHERE ("competitor_sku_normalized" IS NOT NULL);



COMMENT ON INDEX "public"."idx_cross_ref_competitor_sku_normalized" IS 'Performance index for normalized competitor SKU searches';



CREATE INDEX "idx_cross_ref_normalized_with_part" ON "public"."cross_references" USING "btree" ("competitor_sku_normalized", "acr_part_id") WHERE ("competitor_sku_normalized" IS NOT NULL);



COMMENT ON INDEX "public"."idx_cross_ref_normalized_with_part" IS 'Composite index for optimized cross-reference joins';



CREATE INDEX "idx_cross_references_acr_part_id" ON "public"."cross_references" USING "btree" ("acr_part_id");



CREATE INDEX "idx_cross_references_competitor_sku" ON "public"."cross_references" USING "btree" ("competitor_sku");



CREATE INDEX "idx_cross_references_competitor_sku_trgm" ON "public"."cross_references" USING "gin" ("competitor_sku" "public"."gin_trgm_ops");



CREATE INDEX "idx_cross_references_tenant_id" ON "public"."cross_references" USING "btree" ("tenant_id");



CREATE INDEX "idx_cross_references_updated_at" ON "public"."cross_references" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_cross_references_updated_tracking" ON "public"."cross_references" USING "btree" ("updated_at" DESC, "updated_by");



CREATE UNIQUE INDEX "idx_cross_refs_unique_per_tenant" ON "public"."cross_references" USING "btree" ("acr_part_id", "competitor_sku", COALESCE("competitor_brand", ''::character varying), COALESCE("tenant_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



COMMENT ON INDEX "public"."idx_cross_refs_unique_per_tenant" IS 'Prevents duplicate cross-references per tenant. NULL tenant_id = default tenant.';



CREATE INDEX "idx_import_history_created" ON "public"."import_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_import_history_tenant_created" ON "public"."import_history" USING "btree" ("tenant_id", "created_at" DESC);



CREATE INDEX "idx_part_360_frames_part_frame" ON "public"."part_360_frames" USING "btree" ("part_id", "frame_number");



CREATE INDEX "idx_part_360_frames_part_id" ON "public"."part_360_frames" USING "btree" ("part_id");



CREATE INDEX "idx_part_360_frames_tenant_id" ON "public"."part_360_frames" USING "btree" ("tenant_id");



CREATE INDEX "idx_part_images_display_order" ON "public"."part_images" USING "btree" ("part_id", "display_order");



CREATE INDEX "idx_part_images_part_id" ON "public"."part_images" USING "btree" ("part_id");



CREATE UNIQUE INDEX "idx_part_images_primary" ON "public"."part_images" USING "btree" ("part_id") WHERE ("is_primary" = true);



CREATE INDEX "idx_part_images_tenant_id" ON "public"."part_images" USING "btree" ("tenant_id");



CREATE INDEX "idx_parts_acr_sku" ON "public"."parts" USING "btree" ("acr_sku");



CREATE INDEX "idx_parts_acr_sku_normalized" ON "public"."parts" USING "btree" ("acr_sku_normalized") WHERE ("acr_sku_normalized" IS NOT NULL);



COMMENT ON INDEX "public"."idx_parts_acr_sku_normalized" IS 'Performance index for normalized ACR SKU searches';



CREATE INDEX "idx_parts_acr_sku_trgm" ON "public"."parts" USING "gin" ("acr_sku" "public"."gin_trgm_ops");



CREATE INDEX "idx_parts_part_type" ON "public"."parts" USING "btree" ("part_type");



CREATE UNIQUE INDEX "idx_parts_sku_tenant" ON "public"."parts" USING "btree" ("acr_sku", COALESCE("tenant_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



COMMENT ON INDEX "public"."idx_parts_sku_tenant" IS 'Ensures ACR_SKU uniqueness per tenant. NULL tenant_id treated as default tenant (00000000-0000-0000-0000-000000000000).';



CREATE INDEX "idx_parts_tenant_id" ON "public"."parts" USING "btree" ("tenant_id");



CREATE INDEX "idx_parts_updated_at" ON "public"."parts" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_parts_updated_tracking" ON "public"."parts" USING "btree" ("updated_at" DESC, "updated_by");



CREATE INDEX "idx_site_settings_key" ON "public"."site_settings" USING "btree" ("key");



CREATE INDEX "idx_vehicle_applications_make" ON "public"."vehicle_applications" USING "btree" ("make");



CREATE INDEX "idx_vehicle_applications_model" ON "public"."vehicle_applications" USING "btree" ("model");



CREATE INDEX "idx_vehicle_applications_part_id" ON "public"."vehicle_applications" USING "btree" ("part_id");



CREATE INDEX "idx_vehicle_applications_tenant_id" ON "public"."vehicle_applications" USING "btree" ("tenant_id");



CREATE INDEX "idx_vehicle_applications_updated_at" ON "public"."vehicle_applications" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_vehicle_applications_updated_tracking" ON "public"."vehicle_applications" USING "btree" ("updated_at" DESC, "updated_by");



CREATE INDEX "idx_vehicle_applications_year" ON "public"."vehicle_applications" USING "btree" ("start_year", "end_year");



CREATE UNIQUE INDEX "idx_vehicle_apps_unique_per_tenant" ON "public"."vehicle_applications" USING "btree" ("part_id", "make", "model", "start_year", COALESCE("tenant_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



COMMENT ON INDEX "public"."idx_vehicle_apps_unique_per_tenant" IS 'Prevents duplicate vehicle applications per tenant. NULL tenant_id = default tenant.';



CREATE OR REPLACE TRIGGER "trigger_cleanup_import_snapshots" AFTER INSERT ON "public"."import_history" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_old_import_snapshots"();



CREATE OR REPLACE TRIGGER "trigger_normalize_cross_ref_sku" BEFORE INSERT OR UPDATE OF "competitor_sku" ON "public"."cross_references" FOR EACH ROW EXECUTE FUNCTION "public"."auto_normalize_cross_ref_sku"();



COMMENT ON TRIGGER "trigger_normalize_cross_ref_sku" ON "public"."cross_references" IS 'Auto-populates competitor_sku_normalized on INSERT/UPDATE';



CREATE OR REPLACE TRIGGER "trigger_normalize_part_sku" BEFORE INSERT OR UPDATE OF "acr_sku" ON "public"."parts" FOR EACH ROW EXECUTE FUNCTION "public"."auto_normalize_part_sku"();



COMMENT ON TRIGGER "trigger_normalize_part_sku" ON "public"."parts" IS 'Auto-populates acr_sku_normalized on INSERT/UPDATE';



CREATE OR REPLACE TRIGGER "update_cross_references_updated_at" BEFORE UPDATE ON "public"."cross_references" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parts_updated_at" BEFORE UPDATE ON "public"."parts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicle_applications_updated_at" BEFORE UPDATE ON "public"."vehicle_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cross_references"
    ADD CONSTRAINT "cross_references_acr_part_id_fkey" FOREIGN KEY ("acr_part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cross_references"
    ADD CONSTRAINT "cross_references_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."import_history"
    ADD CONSTRAINT "import_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."part_360_frames"
    ADD CONSTRAINT "part_360_frames_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."part_360_frames"
    ADD CONSTRAINT "part_360_frames_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."part_images"
    ADD CONSTRAINT "part_images_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."part_images"
    ADD CONSTRAINT "part_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."parts"
    ADD CONSTRAINT "parts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."vehicle_applications"
    ADD CONSTRAINT "vehicle_applications_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_applications"
    ADD CONSTRAINT "vehicle_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



CREATE POLICY "Admin full access settings" ON "public"."site_settings" USING (true);



CREATE POLICY "Admin write" ON "public"."cross_references" USING (true);



CREATE POLICY "Admin write" ON "public"."part_images" USING (true);



CREATE POLICY "Admin write" ON "public"."parts" USING (true);



CREATE POLICY "Admin write" ON "public"."vehicle_applications" USING (true);



CREATE POLICY "Admin write 360 frames" ON "public"."part_360_frames" USING (true);



CREATE POLICY "Admin write import history" ON "public"."import_history" USING (true);



CREATE POLICY "Admin write tenants" ON "public"."tenants" USING (true);



CREATE POLICY "Public read" ON "public"."cross_references" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."part_images" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."parts" FOR SELECT USING (true);



CREATE POLICY "Public read" ON "public"."vehicle_applications" FOR SELECT USING (true);



CREATE POLICY "Public read 360 frames" ON "public"."part_360_frames" FOR SELECT USING (true);



CREATE POLICY "Public read import history" ON "public"."import_history" FOR SELECT USING (true);



CREATE POLICY "Public read settings" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "Public read tenants" ON "public"."tenants" FOR SELECT USING (true);



ALTER TABLE "public"."cross_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."import_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."part_360_frames" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."part_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_applications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_normalize_cross_ref_sku"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_normalize_cross_ref_sku"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_normalize_cross_ref_sku"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_normalize_part_sku"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_normalize_part_sku"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_normalize_part_sku"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_import_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_import_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_import_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb", "parts_to_update" "jsonb", "vehicles_to_add" "jsonb", "vehicles_to_update" "jsonb", "cross_refs_to_add" "jsonb", "cross_refs_to_update" "jsonb", "tenant_id_filter" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb", "parts_to_update" "jsonb", "vehicles_to_add" "jsonb", "vehicles_to_update" "jsonb", "cross_refs_to_add" "jsonb", "cross_refs_to_update" "jsonb", "tenant_id_filter" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_atomic_import"("parts_to_add" "jsonb", "parts_to_update" "jsonb", "vehicles_to_add" "jsonb", "vehicles_to_update" "jsonb", "cross_refs_to_add" "jsonb", "cross_refs_to_update" "jsonb", "tenant_id_filter" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_sku"("input_sku" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_sku"("input_sku" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_sku"("input_sku" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_by_sku"("search_sku" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_by_sku"("search_sku" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_by_sku"("search_sku" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_by_vehicle"("make" "text", "model" "text", "target_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_by_vehicle"("make" "text", "model" "text", "target_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_by_vehicle"("make" "text", "model" "text", "target_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."cross_references" TO "anon";
GRANT ALL ON TABLE "public"."cross_references" TO "authenticated";
GRANT ALL ON TABLE "public"."cross_references" TO "service_role";



GRANT ALL ON TABLE "public"."import_history" TO "anon";
GRANT ALL ON TABLE "public"."import_history" TO "authenticated";
GRANT ALL ON TABLE "public"."import_history" TO "service_role";



GRANT ALL ON TABLE "public"."part_360_frames" TO "anon";
GRANT ALL ON TABLE "public"."part_360_frames" TO "authenticated";
GRANT ALL ON TABLE "public"."part_360_frames" TO "service_role";



GRANT ALL ON TABLE "public"."part_images" TO "anon";
GRANT ALL ON TABLE "public"."part_images" TO "authenticated";
GRANT ALL ON TABLE "public"."part_images" TO "service_role";



GRANT ALL ON TABLE "public"."parts" TO "anon";
GRANT ALL ON TABLE "public"."parts" TO "authenticated";
GRANT ALL ON TABLE "public"."parts" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_applications" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_applications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























