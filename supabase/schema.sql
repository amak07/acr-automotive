-- ACR Automotive Database Schema
-- Auto parts cross-reference search system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Parts catalog table (main parts data from Excel)
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acr_sku VARCHAR(50) UNIQUE NOT NULL,           -- Humberto's SKU (Column B)
  competitor_sku VARCHAR(50),                    -- Cross-reference SKU (Column D)
  part_type VARCHAR(100) NOT NULL,               -- MAZA, etc. (Column E)
  position VARCHAR(50),                          -- TRASERA, DELANTERA (Column F)
  abs_type VARCHAR(20),                          -- C/ABS, S/ABS (Column G)
  bolt_pattern VARCHAR(50),                      -- 5 ROSCAS, 4, etc. (Column H)
  drive_type VARCHAR(20),                        -- 4X2, 4X4 (Column I)
  specifications TEXT,                           -- 28 ESTRIAS, etc. (Column J)
  image_url TEXT,                                -- Supabase Storage URL (admin upload)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle compatibility table (from Excel columns K, L, M)
CREATE TABLE vehicle_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  make VARCHAR(50) NOT NULL,                     -- ACURA, BMW (Column K)
  model VARCHAR(100) NOT NULL,                   -- MDX, 328i (Column L)
  year_range VARCHAR(20) NOT NULL,               -- 2007-2013 (Column M)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-reference mapping table (derived from Excel)
CREATE TABLE cross_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acr_part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  competitor_sku VARCHAR(50) NOT NULL,           -- From Excel Column D
  competitor_brand VARCHAR(50),                  -- TM, Bosch, Denso (extracted)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast searches
CREATE INDEX idx_parts_acr_sku ON parts(acr_sku);
CREATE INDEX idx_parts_competitor_sku ON parts(competitor_sku) WHERE competitor_sku IS NOT NULL;
CREATE INDEX idx_parts_part_type ON parts(part_type);
CREATE INDEX idx_vehicle_applications_make ON vehicle_applications(make);
CREATE INDEX idx_vehicle_applications_model ON vehicle_applications(model);
CREATE INDEX idx_vehicle_applications_year ON vehicle_applications(year_range);
CREATE INDEX idx_vehicle_applications_part_id ON vehicle_applications(part_id);
CREATE INDEX idx_cross_references_competitor_sku ON cross_references(competitor_sku);
CREATE INDEX idx_cross_references_acr_part_id ON cross_references(acr_part_id);

-- Trigram indexes for fuzzy search
CREATE INDEX idx_parts_acr_sku_trgm ON parts USING gin(acr_sku gin_trgm_ops);
CREATE INDEX idx_parts_competitor_sku_trgm ON parts USING gin(competitor_sku gin_trgm_ops) WHERE competitor_sku IS NOT NULL;
CREATE INDEX idx_cross_references_competitor_sku_trgm ON cross_references USING gin(competitor_sku gin_trgm_ops);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to parts table
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SKU search function with fuzzy matching
CREATE OR REPLACE FUNCTION search_by_sku(search_sku TEXT)
RETURNS TABLE (
  id UUID,
  acr_sku VARCHAR(50),
  competitor_sku VARCHAR(50),
  part_type VARCHAR(100),
  position VARCHAR(50),
  abs_type VARCHAR(20),
  bolt_pattern VARCHAR(50),
  drive_type VARCHAR(20),
  specifications TEXT,
  image_url TEXT,
  match_type TEXT
) AS $$
BEGIN
  -- First, try exact match on ACR SKU
  RETURN QUERY
  SELECT 
    p.id, p.acr_sku, p.competitor_sku, p.part_type, p.position,
    p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
    'exact_acr'::TEXT as match_type
  FROM parts p
  WHERE p.acr_sku = search_sku;
  
  -- If no exact ACR match, try exact match on competitor SKU
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.competitor_sku, p.part_type, p.position,
      p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'exact_competitor'::TEXT as match_type
    FROM parts p
    WHERE p.competitor_sku = search_sku;
  END IF;
  
  -- If no exact match, try cross-reference table
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.competitor_sku, p.part_type, p.position,
      p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'cross_reference'::TEXT as match_type
    FROM parts p
    INNER JOIN cross_references cr ON p.id = cr.acr_part_id
    WHERE cr.competitor_sku = search_sku;
  END IF;
  
  -- If still no match, try fuzzy matching (similarity > 0.6)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.id, p.acr_sku, p.competitor_sku, p.part_type, p.position,
      p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.image_url,
      'fuzzy'::TEXT as match_type
    FROM parts p
    WHERE 
      similarity(p.acr_sku, search_sku) > 0.6 
      OR (p.competitor_sku IS NOT NULL AND similarity(p.competitor_sku, search_sku) > 0.6)
    ORDER BY 
      GREATEST(
        similarity(p.acr_sku, search_sku),
        COALESCE(similarity(p.competitor_sku, search_sku), 0)
      ) DESC
    LIMIT 10;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Vehicle search function
CREATE OR REPLACE FUNCTION search_by_vehicle(
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year_range TEXT DEFAULT NULL,
  part_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  acr_sku VARCHAR(50),
  competitor_sku VARCHAR(50),
  part_type VARCHAR(100),
  position VARCHAR(50),
  abs_type VARCHAR(20),
  bolt_pattern VARCHAR(50),
  drive_type VARCHAR(20),
  specifications TEXT,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id, p.acr_sku, p.competitor_sku, p.part_type, p.position,
    p.abs_type, p.bolt_pattern, p.drive_type, p.specifications, p.image_url
  FROM parts p
  INNER JOIN vehicle_applications va ON p.id = va.part_id
  WHERE 
    va.make ILIKE vehicle_make
    AND va.model ILIKE vehicle_model
    AND (vehicle_year_range IS NULL OR va.year_range = vehicle_year_range)
    AND (part_type_filter IS NULL OR p.part_type ILIKE part_type_filter)
  ORDER BY p.acr_sku;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (search functionality)
CREATE POLICY "Enable read access for all users" ON parts FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON vehicle_applications FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON cross_references FOR SELECT USING (true);

-- Admin write access (will be enhanced when auth is added)
-- For now, allow all writes in development
CREATE POLICY "Enable write access for development" ON parts FOR ALL USING (true);
CREATE POLICY "Enable write access for development" ON vehicle_applications FOR ALL USING (true);
CREATE POLICY "Enable write access for development" ON cross_references FOR ALL USING (true);

-- Create storage bucket for part images
INSERT INTO storage.buckets (id, name, public) VALUES ('part-images', 'part-images', true);

-- Storage RLS policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'part-images');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'part-images');
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'part-images');
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'part-images');

-- Sample data for testing (optional)
-- This will be replaced by Excel import in production
/*
INSERT INTO parts (acr_sku, competitor_sku, part_type, position, abs_type, bolt_pattern, drive_type, specifications) VALUES
('ACR-MAZA-001', 'TM-513121', 'MAZA', 'DELANTERA', 'C/ABS', '5 ROSCAS', '4X2', '28 ESTRIAS'),
('ACR-MAZA-002', 'BOSCH-HU513121', 'MAZA', 'TRASERA', 'S/ABS', '4 ROSCAS', '4X4', '32 ESTRIAS');

INSERT INTO vehicle_applications (part_id, make, model, year_range) VALUES
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-001'), 'TOYOTA', 'CAMRY', '2007-2011'),
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-001'), 'HONDA', 'ACCORD', '2008-2012'),
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-002'), 'NISSAN', 'ALTIMA', '2009-2013');

INSERT INTO cross_references (acr_part_id, competitor_sku, competitor_brand) VALUES
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-001'), 'TM-513121', 'TM'),
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-001'), 'DENSO-513121', 'DENSO'),
((SELECT id FROM parts WHERE acr_sku = 'ACR-MAZA-002'), 'BOSCH-HU513121', 'BOSCH');
*/