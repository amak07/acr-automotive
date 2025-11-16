-- Create storage bucket for part images and 360° frames
-- This bucket is used for both regular part photos and 360° viewer frames
-- Storage path structure:
--   - Regular images: {part_id}_{timestamp}_{random}.{ext}
--   - 360° frames: 360-viewer/{acr_sku}/frame-000.jpg

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'acr-part-images',
  'acr-part-images',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Row-Level Security Policies for Storage Objects
-- =====================================================

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Public read access for acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update acr-part-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from acr-part-images" ON storage.objects;

-- Policy: Allow public SELECT (read) for this bucket
-- This allows anyone to view uploaded images (bucket is public)
CREATE POLICY "Public read access for acr-part-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'acr-part-images');

-- Policy: Allow authenticated INSERT (upload)
-- This allows logged-in users to upload new files
CREATE POLICY "Authenticated users can upload to acr-part-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'acr-part-images');

-- Policy: Allow authenticated UPDATE
-- This allows logged-in users to update existing files (via upsert)
CREATE POLICY "Authenticated users can update acr-part-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'acr-part-images');

-- Policy: Allow authenticated DELETE
-- This allows logged-in users to delete files
CREATE POLICY "Authenticated users can delete from acr-part-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'acr-part-images');
