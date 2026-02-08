-- Fix: cleanup trigger was deleting test runner snapshots
-- The trigger keeps only 3 most recent import_history rows per tenant,
-- but stress tests create many imports, pushing the test runner's
-- snapshot out before it can be restored.
--
-- Fix: exclude rows with file_name = '__TEST_DEV_SNAPSHOT__' from cleanup.

CREATE OR REPLACE FUNCTION cleanup_old_import_snapshots()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep only last 3 real snapshots per tenant (exclude test snapshots)
    DELETE FROM import_history
    WHERE id IN (
        SELECT id FROM import_history
        WHERE tenant_id IS NOT DISTINCT FROM NEW.tenant_id
        AND file_name IS DISTINCT FROM '__TEST_DEV_SNAPSHOT__'
        ORDER BY created_at DESC
        OFFSET 3
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
