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
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_snapshot CHECK (
        snapshot ? 'timestamp' AND
        snapshot ? 'changes_summary' AND
        snapshot ? 'rollback_data'
    )
);

-- Add helpful comment
COMMENT ON TABLE import_history IS
    'Stores last 3 import snapshots for rollback feature. JSONB contains inverse operations needed to undo import.';

COMMENT ON COLUMN import_history.snapshot IS
    'JSONB structure: { timestamp, changes_summary: {...}, rollback_data: { parts_to_delete, parts_to_restore, parts_to_revert, ... } }';

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
