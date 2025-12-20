-- ============================================================================
-- Migration 006: Add Import History (Rollback Support)
-- Description: Table for storing import snapshots for rollback feature
-- Date: 2025-10-22
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Create import_history table
-- =====================================================

CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    imported_by TEXT,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER,
    rows_imported INTEGER NOT NULL DEFAULT 0,
    snapshot_data JSONB NOT NULL,
    import_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_snapshot CHECK (
        snapshot_data ? 'parts' AND
        snapshot_data ? 'vehicle_applications' AND
        snapshot_data ? 'cross_references' AND
        snapshot_data ? 'timestamp'
    ),
    CONSTRAINT valid_import_summary CHECK (
        import_summary IS NULL OR (
            import_summary ? 'adds' AND
            import_summary ? 'updates' AND
            import_summary ? 'deletes'
        )
    )
);

-- Add helpful comments
COMMENT ON TABLE import_history IS
    'Stores last 3 import snapshots for rollback feature. snapshot_data contains full pre-import state of all affected records.';

COMMENT ON COLUMN import_history.snapshot_data IS
    'JSONB structure: { parts: [...], vehicle_applications: [...], cross_references: [...], timestamp: "..." }. Contains complete pre-import snapshot for rollback.';

COMMENT ON COLUMN import_history.import_summary IS
    'JSONB structure: { adds: N, updates: N, deletes: N }. Summary of changes made during import.';

COMMENT ON COLUMN import_history.file_name IS
    'Original filename of uploaded Excel file.';

COMMENT ON COLUMN import_history.rows_imported IS
    'Total number of rows processed (adds + updates + deletes).';

COMMENT ON COLUMN import_history.imported_by IS
    'Username or ID of user who performed import (for audit trail).';

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================

-- Query last N imports per tenant (most common query)
CREATE INDEX IF NOT EXISTS idx_import_history_tenant_created
    ON import_history(tenant_id, created_at DESC);

-- Query all imports (admin audit trail)
CREATE INDEX IF NOT EXISTS idx_import_history_created
    ON import_history(created_at DESC);

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================

ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read import history" ON import_history;
DROP POLICY IF EXISTS "Admin write import history" ON import_history;

-- Public read (for rollback status check)
CREATE POLICY "Public read import history"
    ON import_history FOR SELECT USING (true);

-- Admin write (for creating/deleting snapshots)
CREATE POLICY "Admin write import history"
    ON import_history FOR ALL USING (true);

-- =====================================================
-- 4. Create function to auto-cleanup old snapshots
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_import_snapshots()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_import_snapshots ON import_history;

CREATE TRIGGER trigger_cleanup_import_snapshots
    AFTER INSERT ON import_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_import_snapshots();

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 006 completed successfully';
  RAISE NOTICE 'Created import_history table';
  RAISE NOTICE 'Created 2 indexes';
  RAISE NOTICE 'Created auto-cleanup trigger (keeps last 3 snapshots)';
  RAISE NOTICE '';
  RAISE NOTICE 'Rollback system ready for Phase 8.2 implementation';
END $$;
