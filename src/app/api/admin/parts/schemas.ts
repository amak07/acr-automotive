import z from "zod";

export const querySchema = z.object({
  id: z.uuid().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
  search: z.string().optional(),
  sort_by: z.string().optional().default("acr_sku"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  
  // Filter parameters
  part_type: z.string().optional(),
  position_type: z.string().optional(),
  abs_type: z.string().optional(),
  drive_type: z.string().optional(),
  bolt_pattern: z.string().optional(),
});

export const createPartSchema = z.object({
  sku_number: z.string().min(1),
  part_type: z.string().min(1).max(100),
  position_type: z.string().max(50).optional(),
  abs_type: z.string().max(20).optional(),
  bolt_pattern: z.string().max(50).optional(),
  drive_type: z.string().max(50).optional(),
  specifications: z.string().optional(),
});

export const updatePartSchema = createPartSchema
  .omit({ sku_number: true })
  .extend({ id: z.uuid("PartID is required.") });

export const deletePartSchema = z.object({
  id: z.uuid("PartID is required."),
});