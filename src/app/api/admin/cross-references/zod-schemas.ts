import z from "zod";

export const queryCrossRefSchema = z.object({
  id: z.uuid().optional(), // Get single CR
  acr_part_id: z.uuid().optional(), // Get all CRs for specific part (main use case)
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
  sort_by: z.enum(["competitor_sku", "competitor_brand", "created_at"]).default("competitor_sku"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const createCrossRefSchema = z.object({
  acr_part_id: z.uuid(),
  competitor_sku: z.string().min(1).max(50),
  competitor_brand: z.string().max(50).optional(),
});

export const updateCrossRefSchema = createCrossRefSchema
  .omit({ acr_part_id: true })
  .extend({
    id: z.uuid("Cross Reference ID is required"),
  });

export const deleteCrossRefSchema = z.object({
  id: z.uuid("Cross Reference ID is required."),
});
