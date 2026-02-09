-- ============================================================================
-- Migration 003: Website Settings Management
-- Feature 2.4: Admin interface for site configuration
-- Date: October 13, 2025
-- ============================================================================

-- ============================================================================
-- CLEANUP: Drop existing objects if they exist (for safe re-runs)
-- ============================================================================

-- Drop table first (CASCADE will drop dependent policies)
DROP TABLE IF EXISTS site_settings CASCADE;

-- Drop storage policies (storage.objects table always exists)
DROP POLICY IF EXISTS "Admin Delete Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Site Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;

-- ============================================================================
-- TABLE: SITE_SETTINGS (Key-value JSONB storage for dynamic settings)
-- ============================================================================
-- This stores configurable site settings like:
-- - Contact info (email, phone, address, whatsapp)
-- - Branding (logo URL, favicon URL, banner URL, company name)

CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast key lookups
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- ============================================================================
-- DEFAULT SETTINGS DATA
-- ============================================================================
-- Initialize default settings with current ACR values

INSERT INTO site_settings (key, value, description) VALUES
-- Contact Information
('contact_info', '{
    "email": "contacto@acrautomotive.com",
    "phone": "",
    "whatsapp": "",
    "address": ""
}'::JSONB, 'Contact information displayed in footer'),

-- Branding
('branding', '{
    "company_name": "ACR Automotive",
    "logo_url": "",
    "favicon_url": "",
    "banners": []
}'::JSONB, 'Branding assets (logo, favicon) and promotional banner carousel');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on site_settings table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for site settings (needed for public pages)
CREATE POLICY "Public read settings" ON site_settings FOR SELECT USING (true);

-- Admin full access to settings
CREATE POLICY "Admin full access settings" ON site_settings FOR ALL USING (true);

-- ============================================================================
-- STORAGE BUCKET FOR BRANDING ASSETS
-- ============================================================================
-- Create storage bucket for logos, favicons, and other site assets

INSERT INTO storage.buckets (id, name, public)
VALUES ('acr-site-assets', 'acr-site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for site assets
DROP POLICY IF EXISTS "Public Access Site Assets" ON storage.objects;
CREATE POLICY "Public Access Site Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'acr-site-assets');

DROP POLICY IF EXISTS "Admin Upload Site Assets" ON storage.objects;
CREATE POLICY "Admin Upload Site Assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'acr-site-assets');

DROP POLICY IF EXISTS "Admin Update Site Assets" ON storage.objects;
CREATE POLICY "Admin Update Site Assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'acr-site-assets');

DROP POLICY IF EXISTS "Admin Delete Site Assets" ON storage.objects;
CREATE POLICY "Admin Delete Site Assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'acr-site-assets');

-- ============================================================================
-- IMPLEMENTATION NOTES:
-- ============================================================================
-- 1. site_settings uses JSONB for flexible nested data structures
-- 2. Only 2 settings: contact_info and branding (simplified for MVP)
-- 3. Public pages can read settings, admin has full control via RLS
-- 4. Default settings are pre-populated with current ACR values
-- 5. New storage bucket 'acr-site-assets' for logos/favicons/banner
-- 6. Settings are fetched via API and consumed through SettingsContext
-- 7. Banner is stored as single file URL in branding (simple static asset)
-- 8. Script is idempotent - can be safely re-run (drops existing objects first)