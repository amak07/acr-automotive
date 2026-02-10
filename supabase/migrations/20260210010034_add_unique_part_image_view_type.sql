-- Phase 1: Add missing unique constraint on (part_id, view_type)
-- Fixes critical bug where Excel import's onConflict: "part_id,view_type" silently
-- creates duplicates instead of upserts (no constraint existed to enforce uniqueness).

-- Step 0: Normalize legacy view_type values from staging/production data
-- 'bottom' → 'back' (4-slot model: front/back/top/other)
UPDATE part_images SET view_type = 'back' WHERE view_type = 'bottom';
-- Any other non-standard values → NULL (Steps 2-3 will reassign or delete)
UPDATE part_images SET view_type = NULL
  WHERE view_type IS NOT NULL
  AND view_type NOT IN ('front', 'back', 'top', 'other');

-- Step 1: Deduplicate any existing rows with same (part_id, view_type)
-- Keep the row with the highest ID (most recently inserted)
DELETE FROM part_images a
USING part_images b
WHERE a.part_id = b.part_id
  AND a.view_type = b.view_type
  AND a.view_type IS NOT NULL
  AND a.id < b.id;

-- Step 2: Assign view_type to legacy images (uploaded via admin CRUD with NULL view_type)
-- Map by display_order: 1st→front, 2nd→back, 3rd→top, 4th→other
-- Only for parts that don't already have typed images in that slot
WITH legacy AS (
  SELECT id, part_id, display_order,
    ROW_NUMBER() OVER (PARTITION BY part_id ORDER BY display_order) AS rn
  FROM part_images
  WHERE view_type IS NULL
),
mapped AS (
  SELECT l.id, l.part_id,
    CASE
      WHEN l.rn = 1 THEN 'front'
      WHEN l.rn = 2 THEN 'back'
      WHEN l.rn = 3 THEN 'top'
      WHEN l.rn = 4 THEN 'other'
    END AS new_view_type
  FROM legacy l
  WHERE l.rn <= 4
)
UPDATE part_images
SET view_type = mapped.new_view_type
FROM mapped
WHERE part_images.id = mapped.id
  -- Don't assign if another image already has this view_type for the part
  AND NOT EXISTS (
    SELECT 1 FROM part_images pi2
    WHERE pi2.part_id = mapped.part_id
      AND pi2.view_type = mapped.new_view_type
      AND pi2.id != mapped.id
  );

-- Step 3: Delete overflow images (5th+ per part) and any that couldn't be assigned
DELETE FROM part_images WHERE view_type IS NULL;

-- Step 4: Set is_primary for front images (front is always the hero)
UPDATE part_images SET is_primary = true WHERE view_type = 'front';
UPDATE part_images SET is_primary = false WHERE view_type != 'front';

-- Step 5: Add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_part_images_part_view_type
  ON part_images (part_id, view_type);

-- Step 6: Add CHECK constraint for valid view_type values
DO $$ BEGIN
  ALTER TABLE part_images
    ADD CONSTRAINT chk_part_images_view_type
    CHECK (view_type IN ('front', 'back', 'top', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
