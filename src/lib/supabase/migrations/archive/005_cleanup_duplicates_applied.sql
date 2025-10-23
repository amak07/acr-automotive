-- ============================================================================
-- Migration 005 Pre-Cleanup: Remove Duplicate Vehicle Applications
-- Description: Removes duplicate vehicle applications (keeps oldest record)
-- Date: 2025-10-22
-- Run this BEFORE Migration 005
-- ============================================================================

-- Delete duplicate vehicle applications (keeps oldest by created_at)
-- NOTE: Checks (part_id, make, model, start_year) WITHOUT end_year
-- This matches the unique index we're creating in Migration 005
DELETE FROM vehicle_applications
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY part_id, make, model, start_year
                ORDER BY created_at ASC  -- Keep oldest
            ) as row_num
        FROM vehicle_applications
    ) ranked
    WHERE row_num > 1  -- Delete all except first (oldest)
);

-- Show results
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Cleanup complete: Deleted % duplicate vehicle application(s)', deleted_count;
    RAISE NOTICE 'Kept oldest record for each duplicate group';
END $$;

-- Verify no duplicates remain (should return 0 rows)
SELECT
    part_id,
    make,
    model,
    start_year,
    COUNT(*) as count
FROM vehicle_applications
GROUP BY part_id, make, model, start_year
HAVING COUNT(*) > 1;