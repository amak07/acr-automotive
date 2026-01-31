-- =====================================================
-- Migration 014b: Add Index and Fix RLS Policies
-- =====================================================
-- Description: Add missing index on competitor_brand
--              and fix import_history RLS policies.
--
-- Created: January 27, 2026
--
-- NOTE: Split from 014a due to Supabase CLI bug #4746
-- =====================================================

-- =====================================================
-- Part 1: Add missing index on competitor_brand
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cross_references_competitor_brand
ON cross_references(competitor_brand);

COMMENT ON INDEX idx_cross_references_competitor_brand IS
  'Speeds up brand filtering in admin UI and search API';

-- =====================================================
-- Part 2: Fix import_history RLS policy for INSERT
-- =====================================================
-- Server-side API routes use anon key client, so auth.uid() is null.
-- Allow both authenticated users AND service_role to manage import_history.

DROP POLICY IF EXISTS "Authenticated users can manage import_history" ON import_history;

-- Allow authenticated users (browser-based)
CREATE POLICY "Authenticated users can manage import_history"
    ON import_history FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow anon role for server-side API operations (uses anon key)
CREATE POLICY "Anon can manage import_history"
    ON import_history FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
