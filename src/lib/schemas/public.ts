import { z } from "zod";

export const publicSearchSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  sku_term: z.string().optional(),
  limit: z.coerce.number().default(15),
  offset: z.coerce.number().default(0),
});

export type PublicSearchParams = z.infer<typeof publicSearchSchema>;