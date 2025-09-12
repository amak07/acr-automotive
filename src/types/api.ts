import { 
  querySchema, 
  createPartSchema, 
  updatePartSchema, 
  deletePartSchema 
} from '@/app/api/admin/parts/schemas';
import { z } from 'zod';

// API request/response types - Parts Admin
export type AdminPartsQueryParams = z.infer<typeof querySchema>;
export type CreatePartRequest = z.infer<typeof createPartSchema>;
export type UpdatePartRequest = z.infer<typeof updatePartSchema>;
export type DeletePartRequest = z.infer<typeof deletePartSchema>;