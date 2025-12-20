-- ============================================================================
-- Migration 007: Add Updated At Tracking (Rollback Conflict Detection)
-- Description: Add timestamp tracking to detect manual edits between imports
-- Date: 2025-10-27
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Add updated_at and updated_by columns
-- =====================================================

-- Parts table
ALTER TABLE parts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'manual';

-- Vehicle applications table
ALTER TABLE vehicle_applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'manual';

-- Cross references table
ALTER TABLE cross_references
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'manual';

-- Add helpful comments
COMMENT ON COLUMN parts.updated_at IS
    'Timestamp of last modification. Used for rollback conflict detection.';
COMMENT ON COLUMN parts.updated_by IS
    'Source of last modification: "manual" (admin UI) or "import" (Excel import). Used to distinguish user edits from bulk imports.';

COMMENT ON COLUMN vehicle_applications.updated_at IS
    'Timestamp of last modification. Used for rollback conflict detection.';
COMMENT ON COLUMN vehicle_applications.updated_by IS
    'Source of last modification: "manual" (admin UI) or "import" (Excel import).';

COMMENT ON COLUMN cross_references.updated_at IS
    'Timestamp of last modification. Used for rollback conflict detection.';
COMMENT ON COLUMN cross_references.updated_by IS
    'Source of last modification: "manual" (admin UI) or "import" (Excel import).';

-- =====================================================
-- 2. Create trigger function to auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update timestamp on any modification
  NEW.updated_at = NOW();

  -- If updated_by is not explicitly set, default to 'manual'
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by = 'manual';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS
    'Trigger function to auto-update updated_at timestamp and set default updated_by value.';

-- =====================================================
-- 3. Create triggers for all tables
-- =====================================================

-- Parts trigger
DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vehicle applications trigger
DROP TRIGGER IF EXISTS update_vehicle_applications_updated_at ON vehicle_applications;
CREATE TRIGGER update_vehicle_applications_updated_at
  BEFORE UPDATE ON vehicle_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cross references trigger
DROP TRIGGER IF EXISTS update_cross_references_updated_at ON cross_references;
CREATE TRIGGER update_cross_references_updated_at
  BEFORE UPDATE ON cross_references
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Backfill existing records with current timestamp
-- =====================================================

-- Update existing parts (if any) with current timestamp
UPDATE parts
SET
  updated_at = COALESCE(updated_at, created_at, NOW()),
  updated_by = COALESCE(updated_by, 'manual')
WHERE updated_at IS NULL;

UPDATE vehicle_applications
SET
  updated_at = COALESCE(updated_at, created_at, NOW()),
  updated_by = COALESCE(updated_by, 'manual')
WHERE updated_at IS NULL;

UPDATE cross_references
SET
  updated_at = COALESCE(updated_at, created_at, NOW()),
  updated_by = COALESCE(updated_by, 'manual')
WHERE updated_at IS NULL;

-- =====================================================
-- 5. Create indexes for rollback conflict queries
-- =====================================================

-- Index for conflict detection queries (find records modified after import timestamp)
CREATE INDEX IF NOT EXISTS idx_parts_updated_at
    ON parts(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_applications_updated_at
    ON vehicle_applications(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cross_references_updated_at
    ON cross_references(updated_at DESC);

-- Composite index for conflict detection by source
CREATE INDEX IF NOT EXISTS idx_parts_updated_tracking
    ON parts(updated_at DESC, updated_by);

CREATE INDEX IF NOT EXISTS idx_vehicle_applications_updated_tracking
    ON vehicle_applications(updated_at DESC, updated_by);

CREATE INDEX IF NOT EXISTS idx_cross_references_updated_tracking
    ON cross_references(updated_at DESC, updated_by);

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 007 completed successfully';
  RAISE NOTICE 'Added updated_at and updated_by columns to all tables';
  RAISE NOTICE 'Created auto-update triggers (updates timestamp on every modification)';
  RAISE NOTICE 'Backfilled existing records with timestamps';
  RAISE NOTICE 'Created 6 indexes for efficient conflict detection';
  RAISE NOTICE '';
  RAISE NOTICE 'Rollback conflict detection system ready!';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '  - updated_at: Auto-updated on every modification';
  RAISE NOTICE '  - updated_by: Set to "import" during bulk imports, defaults to "manual"';
  RAISE NOTICE '  - Conflict detection: Compare updated_at > import_timestamp';
END $$;
