import z from "zod";

// ===== PARTS SCHEMAS =====
export const queryPartsSchema = z.object({
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
  image_url: z.string().url().optional(),
});

export const updatePartSchema = createPartSchema
  .omit({ sku_number: true })
  .partial()
  .extend({ id: z.uuid("PartID is required.") });

export const deletePartSchema = z.object({
  id: z.uuid("PartID is required."),
});

// ===== CROSS REFERENCES SCHEMAS =====
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

// ===== VEHICLE APPLICATIONS SCHEMAS =====
export const queryVehicleSchema = z.object({
  id: z.uuid().optional(), // Get single VA
  part_id: z.uuid().optional(), // Get all VAs for specific part (main use case)
  limit: z.coerce.number().default(50), // Pagination in part details VA tab
  offset: z.coerce.number().default(0),
  sort_by: z.string().optional().default("make"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const createVehicleSchema = z.object({
  part_id: z.uuid(),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  start_year: z.number().int(),
  end_year: z.number().int(),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({ part_id: true })
  .extend({
    id: z.uuid("Vehicle ID is required"),
  });

export const deleteVehicleSchema = z.object({
  id: z.uuid("Vehicle ID is required."),
});

// ===== TYPE EXPORTS =====
export type QueryPartsParams = z.infer<typeof queryPartsSchema>;
export type CreatePartParams = z.infer<typeof createPartSchema>;
export type UpdatePartParams = z.infer<typeof updatePartSchema>;
export type DeletePartParams = z.infer<typeof deletePartSchema>;

export type QueryCrossRefParams = z.infer<typeof queryCrossRefSchema>;
export type CreateCrossReferenceParams = z.infer<typeof createCrossRefSchema>;
export type UpdateCrossReferenceParams = z.infer<typeof updateCrossRefSchema>;
export type DeleteCrossReferenceParams = z.infer<typeof deleteCrossRefSchema>;

export type QueryVehicleParams = z.infer<typeof queryVehicleSchema>;
export type CreateVehicleApplicationParams = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleApplicationParams = z.infer<typeof updateVehicleSchema>;
export type DeleteVehicleApplicationParams = z.infer<typeof deleteVehicleSchema>;

// ===== SITE SETTINGS SCHEMAS =====
export const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  whatsapp: z.string(),
  address: z.string(),
});

export const bannerSchema = z.object({
  id: z.string(),
  image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ),
  mobile_image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const brandingSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  logo_url: z.string(),
  favicon_url: z.string(),
  banners: z.array(bannerSchema),
});

export const updateSettingSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("contact_info"), value: contactInfoSchema }),
  z.object({ key: z.literal("branding"), value: brandingSchema }),
]);

// Type exports
export type ContactInfoParams = z.infer<typeof contactInfoSchema>;
export type BrandingParams = z.infer<typeof brandingSchema>;
export type UpdateSettingParams = z.infer<typeof updateSettingSchema>;