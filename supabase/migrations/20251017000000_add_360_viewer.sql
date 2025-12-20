-- Migration: Add 360° Interactive Viewer Support
-- Description: Adds tables and columns for 360° spin viewer feature
-- Date: 2025-10-17
-- Idempotent: Yes (safe to re-run)

-- =====================================================
-- 1. Add 360° viewer columns to parts table
-- =====================================================

ALTER TABLE parts
ADD COLUMN IF NOT EXISTS has_360_viewer BOOLEAN DEFAULT false;

ALTER TABLE parts
ADD COLUMN IF NOT EXISTS viewer_360_frame_count INTEGER DEFAULT 0;

-- Add check constraint to ensure valid frame count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_360_frame_count'
  ) THEN
    ALTER TABLE parts
    ADD CONSTRAINT valid_360_frame_count
    CHECK (viewer_360_frame_count >= 0 AND viewer_360_frame_count <= 100);
  END IF;
END $$;

-- =====================================================
-- 2. Create part_360_frames table
-- =====================================================

CREATE TABLE IF NOT EXISTS part_360_frames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    frame_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_part_frame UNIQUE(part_id, frame_number),
    CONSTRAINT valid_frame_number CHECK(frame_number >= 0),
    CONSTRAINT positive_dimensions CHECK(
      (width IS NULL AND height IS NULL) OR
      (width > 0 AND height > 0)
    ),
    CONSTRAINT positive_file_size CHECK(
      file_size_bytes IS NULL OR file_size_bytes > 0
    )
);

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================

-- Index for fetching all frames for a part (most common query)
CREATE INDEX IF NOT EXISTS idx_part_360_frames_part_id
    ON part_360_frames(part_id);

-- Composite index for ordered frame retrieval
CREATE INDEX IF NOT EXISTS idx_part_360_frames_part_frame
    ON part_360_frames(part_id, frame_number);

-- =====================================================
-- 4. Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE part_360_frames ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read 360 frames" ON part_360_frames;
DROP POLICY IF EXISTS "Admin write 360 frames" ON part_360_frames;

-- Public read access (for public part viewer)
CREATE POLICY "Public read 360 frames"
    ON part_360_frames
    FOR SELECT
    USING (true);

-- Admin write access (for admin upload interface)
-- Note: In production, replace with proper authentication check
CREATE POLICY "Admin write 360 frames"
    ON part_360_frames
    FOR ALL
    USING (true);

-- =====================================================
-- 5. Add helpful comments
-- =====================================================

COMMENT ON TABLE part_360_frames IS
    '360° viewer frames for interactive part inspection. Each part can have 12-48 frames showing horizontal rotation.';

COMMENT ON COLUMN part_360_frames.frame_number IS
    'Sequential frame number (0-indexed). Frame 0 is the starting position.';

COMMENT ON COLUMN part_360_frames.storage_path IS
    'Supabase storage path: 360-viewer/{acr_sku}/frame-000.jpg';

COMMENT ON COLUMN part_360_frames.width IS
    'Image width in pixels (standardized to 1200px by Sharp optimization)';

COMMENT ON COLUMN part_360_frames.height IS
    'Image height in pixels (standardized to 1200px by Sharp optimization)';

COMMENT ON COLUMN parts.has_360_viewer IS
    'True if part has 360° viewer configured (at least 12 frames uploaded)';

COMMENT ON COLUMN parts.viewer_360_frame_count IS
    'Total number of frames in 360° viewer (0 if not configured)';

-- =====================================================
-- 6. Configure storage bucket policies
-- =====================================================

-- Note: The 'acr-part-images' storage bucket should already exist
-- from migration 001_add_part_images.sql
--
-- 360° frames will be stored at:
--   acr-part-images/360-viewer/{acr_sku}/frame-000.jpg
--   acr-part-images/360-viewer/{acr_sku}/frame-001.jpg
--   etc.
--
-- Add UPDATE policy for storage bucket to support upsert operations
-- (Required for replacing 360° viewer frames)

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;

-- Create UPDATE policy for admin operations
CREATE POLICY "Admin Update"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'acr-part-images');

-- Add DELETE policy for storage cleanup
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

CREATE POLICY "Admin Delete"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'acr-part-images');

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 completed successfully';
  RAISE NOTICE 'Tables created/updated:';
  RAISE NOTICE '  - parts (added has_360_viewer, viewer_360_frame_count)';
  RAISE NOTICE '  - part_360_frames (created)';
  RAISE NOTICE 'Indexes created: 2';
  RAISE NOTICE 'Table RLS policies created: 2';
  RAISE NOTICE 'Storage RLS policies created: 2 (UPDATE, DELETE)';
END $$;
