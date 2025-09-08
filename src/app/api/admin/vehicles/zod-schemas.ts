import z from "zod";

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
