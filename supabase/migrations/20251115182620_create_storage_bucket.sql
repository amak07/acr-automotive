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
