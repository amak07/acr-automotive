import z from "zod";

// ===== HELPER FUNCTIONS =====
/**
 * Preprocessor to convert empty strings to undefined for optional fields.
 * Solves the validation trap where .optional() + .min(1) rejects empty strings.
 *
 * @example
 * // Without preprocess:
 * z.string().min(1).optional()
 *   - undefined → ✅ passes (optional)
 *   - "MAZA" → ✅ passes (valid string)
 *   - "" → ❌ FAILS (empty string is not undefined and doesn't meet min(1))
 *
 * // With preprocess:
 * z.preprocess(preprocessOptionalString, z.string().min(1).optional())
 *   - undefined → ✅ passes (optional)
 *   - "MAZA" → ✅ passes (valid string)
 *   - "" → ✅ passes (converted to undefined)
 */
const preprocessOptionalString = (val: unknown) =>
  val === "" ? undefined : val;

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

  // Image stats parameters (for bulk image upload page)
  include_image_stats: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  has_images: z.enum(["all", "yes", "no"]).optional().default("all"),
  has_360: z.enum(["all", "yes", "no"]).optional().default("all"),
});

export const createPartSchema = z.object({
  sku_number: z
    .string()
    .min(1, "SKU number is required")
    .refine((val) => !val.toUpperCase().startsWith("ACR"), {
      message:
        "SKU number should not include 'ACR' prefix - it will be added automatically",
    }),
  part_type: z.string().min(1).max(100),
  position_type: z.string().max(50).optional(),
  abs_type: z.string().max(20).optional(),
  bolt_pattern: z.string().max(50).optional(),
  drive_type: z.string().max(50).optional(),
  specifications: z.string().optional(),
  image_url: z.string().url().optional(),
});

export const updatePartSchema = z.object({
  id: z.string().min(1, "PartID is required."),
  part_type: z.preprocess(
    preprocessOptionalString,
    z.string().min(1).max(100).optional()
  ),
  position_type: z.preprocess(
    preprocessOptionalString,
    z.string().max(50).optional()
  ),
  abs_type: z.preprocess(
    preprocessOptionalString,
    z.string().max(20).optional()
  ),
  bolt_pattern: z.preprocess(
    preprocessOptionalString,
    z.string().max(50).optional()
  ),
  drive_type: z.preprocess(
    preprocessOptionalString,
    z.string().max(50).optional()
  ),
  specifications: z.preprocess(preprocessOptionalString, z.string().optional()),
  image_url: z.preprocess(
    preprocessOptionalString,
    z.string().url().optional()
  ),
});

export const deletePartSchema = z.object({
  id: z.uuid("PartID is required."),
});

// ===== CROSS REFERENCES SCHEMAS =====
export const queryCrossRefSchema = z.object({
  id: z.uuid().optional(), // Get single CR
  acr_part_id: z.uuid().optional(), // Get all CRs for specific part (main use case)
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
  sort_by: z
    .enum(["competitor_sku", "competitor_brand", "created_at"])
    .default("competitor_sku"),
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
export type CreateVehicleApplicationParams = z.infer<
  typeof createVehicleSchema
>;
export type UpdateVehicleApplicationParams = z.infer<
  typeof updateVehicleSchema
>;
export type DeleteVehicleApplicationParams = z.infer<
  typeof deleteVehicleSchema
>;

// ===== SITE SETTINGS SCHEMAS =====
export const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  whatsapp: z.string(),
  address: z.string(),
});

export const bannerSchema = z.object({
  id: z.string(),
  image_url: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL or empty",
    }),
  mobile_image_url: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Must be a valid URL or empty",
    })
    .optional(),
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

// ===== BULK OPERATIONS SCHEMAS =====

// Parts Bulk Operations
export const bulkCreatePartsSchema = z.object({
  parts: z
    .array(createPartSchema)
    .min(1, "At least one part is required")
    .max(1000, "Maximum 1000 parts per request"),
});

export const bulkUpdatePartsSchema = z.object({
  parts: z
    .array(
      updatePartSchema.extend({
        id: z.uuid("Part ID is required for bulk update"),
      })
    )
    .min(1, "At least one part is required")
    .max(1000, "Maximum 1000 parts per request"),
});

export const bulkDeletePartsSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "At least one part ID is required")
    .max(1000, "Maximum 1000 parts per request"),
});

// Vehicle Applications Bulk Operations
export const bulkCreateVehiclesSchema = z.object({
  vehicles: z
    .array(createVehicleSchema)
    .min(1, "At least one vehicle application is required")
    .max(5000, "Maximum 5000 vehicle applications per request"),
});

export const bulkUpdateVehiclesSchema = z.object({
  vehicles: z
    .array(
      updateVehicleSchema.extend({
        id: z.uuid("Vehicle Application ID is required for bulk update"),
      })
    )
    .min(1, "At least one vehicle application is required")
    .max(5000, "Maximum 5000 vehicle applications per request"),
});

export const bulkDeleteVehiclesSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "At least one vehicle application ID is required")
    .max(5000, "Maximum 5000 vehicle applications per request"),
});

// Cross References Bulk Operations
export const bulkCreateCrossRefsSchema = z.object({
  cross_references: z
    .array(createCrossRefSchema)
    .min(1, "At least one cross reference is required")
    .max(10000, "Maximum 10000 cross references per request"),
});

export const bulkUpdateCrossRefsSchema = z.object({
  cross_references: z
    .array(
      updateCrossRefSchema.extend({
        id: z.uuid("Cross Reference ID is required for bulk update"),
      })
    )
    .min(1, "At least one cross reference is required")
    .max(10000, "Maximum 10000 cross references per request"),
});

export const bulkDeleteCrossRefsSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1, "At least one cross reference ID is required")
    .max(10000, "Maximum 10000 cross references per request"),
});

// Bulk Operation Result Types
export const bulkOperationResultSchema = z.object({
  success: z.boolean(),
  created: z.number().optional(),
  updated: z.number().optional(),
  deleted: z.number().optional(),
  errors: z
    .array(
      z.object({
        index: z.number(),
        field: z.string().optional(),
        message: z.string(),
      })
    )
    .optional(),
});

// ===== BULK OPERATIONS TYPE EXPORTS =====
export type BulkCreatePartsParams = z.infer<typeof bulkCreatePartsSchema>;
export type BulkUpdatePartsParams = z.infer<typeof bulkUpdatePartsSchema>;
export type BulkDeletePartsParams = z.infer<typeof bulkDeletePartsSchema>;

export type BulkCreateVehiclesParams = z.infer<typeof bulkCreateVehiclesSchema>;
export type BulkUpdateVehiclesParams = z.infer<typeof bulkUpdateVehiclesSchema>;
export type BulkDeleteVehiclesParams = z.infer<typeof bulkDeleteVehiclesSchema>;

export type BulkCreateCrossRefsParams = z.infer<
  typeof bulkCreateCrossRefsSchema
>;
export type BulkUpdateCrossRefsParams = z.infer<
  typeof bulkUpdateCrossRefsSchema
>;
export type BulkDeleteCrossRefsParams = z.infer<
  typeof bulkDeleteCrossRefsSchema
>;

export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>;
