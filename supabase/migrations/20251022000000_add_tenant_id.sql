-- ============================================================================
-- Migration 005: Add Multi-Tenancy Support (Preparation)
-- Description: Add tenant_id columns for future multi-tenancy
-- Date: 2025-10-22
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Create tenants table (for future use)
-- =====================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'inactive'))
);

-- Add comment
COMMENT ON TABLE tenants IS
    'Multi-tenant support. MVP uses NULL tenant_id (default tenant). Future: One row per dealer/business.';

-- =====================================================
-- 2. Add tenant_id columns to all core tables
-- =====================================================

-- Parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Vehicle applications
ALTER TABLE vehicle_applications
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Cross references
ALTER TABLE cross_references
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Part images
ALTER TABLE part_images
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Part 360 frames
ALTER TABLE part_360_frames
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- All tenant_id columns default to NULL for MVP (single tenant)
-- Future: Will be populated with actual tenant IDs from auth context

-- =====================================================
-- 3. Update unique constraints for tenant isolation
-- =====================================================

-- Parts: ACR_SKU must be unique per tenant (not globally unique)
-- Drop old global unique constraint (created by UNIQUE keyword in schema.sql)
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_acr_sku_key;

-- Create new tenant-scoped unique constraint
-- NULL tenant_id is treated as default tenant UUID (00000000-0000-0000-0000-000000000000)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_sku_tenant
    ON parts(acr_sku, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'));

-- Comment explaining NULL tenant_id handling
COMMENT ON INDEX idx_parts_sku_tenant IS
    'Ensures ACR_SKU uniqueness per tenant. NULL tenant_id treated as default tenant (00000000-0000-0000-0000-000000000000).';

-- Vehicle Applications: (part_id, make, model, start_year) unique per tenant
-- This prevents duplicate vehicle applications within same tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_apps_unique_per_tenant
    ON vehicle_applications(
        part_id,
        make,
        model,
        start_year,
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')
    );

COMMENT ON INDEX idx_vehicle_apps_unique_per_tenant IS
    'Prevents duplicate vehicle applications per tenant. NULL tenant_id = default tenant.';

-- Cross References: (acr_part_id, competitor_sku, competitor_brand) unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_refs_unique_per_tenant
    ON cross_references(
        acr_part_id,
        competitor_sku,
        COALESCE(competitor_brand, ''),
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')
    );

COMMENT ON INDEX idx_cross_refs_unique_per_tenant IS
    'Prevents duplicate cross-references per tenant. NULL tenant_id = default tenant.';

-- =====================================================
-- 4. Add performance indexes for tenant_id
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_parts_tenant_id ON parts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_applications_tenant_id ON vehicle_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_references_tenant_id ON cross_references(tenant_id);
CREATE INDEX IF NOT EXISTS idx_part_images_tenant_id ON part_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_part_360_frames_tenant_id ON part_360_frames(tenant_id);

-- =====================================================
-- 5. Enable Row Level Security (RLS) for tenants table
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public read tenants" ON tenants;
DROP POLICY IF EXISTS "Admin write tenants" ON tenants;

-- Public read (for now - will restrict later)
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);

-- Admin write (for now - will restrict later)
CREATE POLICY "Admin write tenants" ON tenants FOR ALL USING (true);

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed successfully';
  RAISE NOTICE 'Added tenant_id columns to 5 tables';
  RAISE NOTICE 'Updated 3 unique constraints for tenant isolation';
  RAISE NOTICE 'Created 5 indexes for tenant_id queries';
  RAISE NOTICE 'Created tenants table for future multi-tenancy';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: All existing data has tenant_id = NULL (default tenant)';
  RAISE NOTICE 'This migration is backward compatible - no breaking changes';
END $$;
