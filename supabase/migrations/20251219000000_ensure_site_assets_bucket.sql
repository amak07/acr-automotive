-- ============================================================================
-- Migration: Ensure acr-site-assets storage bucket exists
-- Date: December 19, 2025
-- ============================================================================
-- This migration ensures the acr-site-assets bucket exists for banner/logo uploads.
-- It's idempotent and safe to run on databases where the bucket may already exist.
--
-- Background: The bucket was originally created in 20251013010000_add_site_settings.sql
-- but databases seeded from remote snapshots may be missing it. This migration
-- ensures the bucket exists regardless of how the database was initialized.
-- ============================================================================

-- Create the acr-site-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('acr-site-assets', 'acr-site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Site Assets" ON storage.objects;

-- Public read access for site assets (logos, banners, favicons)
CREATE POLICY "Public Access Site Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'acr-site-assets');

-- Allow uploads via anon key (admin authenticated via password in app)
CREATE POLICY "Admin Upload Site Assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'acr-site-assets');

-- Allow updates to existing assets
CREATE POLICY "Admin Update Site Assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'acr-site-assets');

-- Allow deletions of assets
CREATE POLICY "Admin Delete Site Assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'acr-site-assets');
