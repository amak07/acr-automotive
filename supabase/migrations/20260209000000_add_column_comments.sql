-- Add descriptive comments to key columns for documentation
COMMENT ON COLUMN public.parts.acr_sku IS 'Unique ACR part number (e.g., ACR2302006). Must start with "ACR". Primary identifier for cross-referencing.';
COMMENT ON COLUMN public.parts.part_type IS 'Part category (e.g., Brake Rotor, CV Axle, Wheel Hub). Used for filtering and display.';
