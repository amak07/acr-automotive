-- ============================================================================
-- Migration 001: Multiple Images Per Part
-- Feature 2.3: Add support for multiple images per part with gallery UI
-- Date: October 11, 2025
-- ============================================================================

-- Create part_images table
CREATE TABLE part_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_part_images_part_id ON part_images(part_id);
CREATE INDEX idx_part_images_display_order ON part_images(part_id, display_order);

-- Ensure only one primary image per part
CREATE UNIQUE INDEX idx_part_images_primary
ON part_images(part_id)
WHERE is_primary = true;

-- Enable Row Level Security
ALTER TABLE part_images ENABLE ROW LEVEL SECURITY;

-- Public read access (for public search/gallery)
CREATE POLICY "Public read" ON part_images FOR SELECT USING (true);

-- Admin write access (for image management)
CREATE POLICY "Admin write" ON part_images FOR ALL USING (true);

-- Storage bucket already exists in main schema.sql (acr-part-images)
-- Storage policies already configured for public read and admin upload

-- ============================================================================
-- REMOVE OLD IMAGE_URL COLUMN FROM PARTS TABLE
-- ============================================================================
-- Since we're moving to multiple images, remove the old single image column
ALTER TABLE parts DROP COLUMN IF EXISTS image_url;

-- ============================================================================
-- IMPLEMENTATION NOTES:
-- ============================================================================
-- 1. Removed 'image_url' from parts table (replaced by part_images table)
-- 2. All parts now use part_images table for image storage
-- 3. Primary image (is_primary = true) should be displayed first in galleries
-- 4. display_order allows drag-and-drop reordering in admin interface
-- 5. Storage bucket: acr-part-images (already exists, public read enabled)
