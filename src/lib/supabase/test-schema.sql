-- Test Schema for ACR Automotive
-- This creates test tables in a separate schema to avoid affecting production data

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test;

-- Create test tables (identical to production schema)
CREATE TABLE IF NOT EXISTS test.parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_sku VARCHAR(50) NOT NULL UNIQUE,
    part_type VARCHAR(100) NOT NULL,
    position_type VARCHAR(50),
    abs_type VARCHAR(20),
    bolt_pattern VARCHAR(50),
    drive_type VARCHAR(20),
    specifications TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test.vehicle_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES test.parts(id) ON DELETE CASCADE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year_range VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(part_id, make, model, year_range)
);

CREATE TABLE IF NOT EXISTS test.cross_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    acr_part_id UUID NOT NULL REFERENCES test.parts(id) ON DELETE CASCADE,
    competitor_sku VARCHAR(50) NOT NULL,
    competitor_brand VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(acr_part_id, competitor_sku)
);

-- Create indexes for test tables (same as production)
CREATE INDEX IF NOT EXISTS idx_test_parts_acr_sku ON test.parts(acr_sku);
CREATE INDEX IF NOT EXISTS idx_test_parts_part_type ON test.parts(part_type);
CREATE INDEX IF NOT EXISTS idx_test_vehicle_applications_make_model ON test.vehicle_applications(make, model);
CREATE INDEX IF NOT EXISTS idx_test_cross_references_competitor_sku ON test.cross_references(competitor_sku);
CREATE INDEX IF NOT EXISTS idx_test_cross_references_competitor_brand ON test.cross_references(competitor_brand);

-- Add trigram indexes for fuzzy search (test environment)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_test_cross_references_competitor_sku_trgm ON test.cross_references USING gin(competitor_sku gin_trgm_ops);

-- Grant permissions for test schema
GRANT USAGE ON SCHEMA test TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA test TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON SEQUENCES TO anon, authenticated;