-- Add view_type column to part_images for bulk upload categorization
-- This column stores the image angle/view type: front, top, bottom, other, generic
-- Used by bulk upload to implement replace-by-viewType logic
ALTER TABLE part_images ADD COLUMN view_type TEXT;

COMMENT ON COLUMN part_images.view_type IS 'Image view type: front, top, bottom, other, generic. Used for bulk upload replace-by-viewType logic.';
