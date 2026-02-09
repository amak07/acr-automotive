import { z } from "zod";

export const publicSearchSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  sku_term: z.string().trim().min(1).optional().or(z.literal('').transform(() => undefined)),
  limit: z.coerce.number().default(15).transform((v) => Math.max(1, Math.min(100, v))),
  offset: z.coerce.number().default(0).transform((v) => Math.max(0, v)),
});

export type PublicSearchParams = z.infer<typeof publicSearchSchema>;