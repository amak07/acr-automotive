-- Add has_product_images column to parts table
-- This denormalized flag allows efficient sorting of parts with images first

-- Add the column with default false
ALTER TABLE "public"."parts"
ADD COLUMN IF NOT EXISTS "has_product_images" boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN "public"."parts"."has_product_images" IS 'True if part has at least one product image uploaded';

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS "idx_parts_has_product_images" ON "public"."parts" ("has_product_images");

-- Backfill existing data: set has_product_images = true for parts that have images
UPDATE "public"."parts" p
SET "has_product_images" = true
WHERE EXISTS (
    SELECT 1 FROM "public"."part_images" pi WHERE pi.part_id = p.id
);

-- Create trigger function to maintain has_product_images flag
CREATE OR REPLACE FUNCTION "public"."update_has_product_images"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Set flag to true when first image is added
        UPDATE parts SET has_product_images = true WHERE id = NEW.part_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Check if any images remain, if not set flag to false
        UPDATE parts
        SET has_product_images = EXISTS (
            SELECT 1 FROM part_images WHERE part_id = OLD.part_id
        )
        WHERE id = OLD.part_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers on part_images table
DROP TRIGGER IF EXISTS "trigger_update_has_product_images_insert" ON "public"."part_images";
CREATE TRIGGER "trigger_update_has_product_images_insert"
    AFTER INSERT ON "public"."part_images"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_has_product_images"();

DROP TRIGGER IF EXISTS "trigger_update_has_product_images_delete" ON "public"."part_images";
CREATE TRIGGER "trigger_update_has_product_images_delete"
    AFTER DELETE ON "public"."part_images"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_has_product_images"();
