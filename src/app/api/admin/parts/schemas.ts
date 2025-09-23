// Re-export from centralized schemas
export {
  queryPartsSchema as querySchema,
  createPartSchema,
  updatePartSchema,
  deletePartSchema,
  type QueryPartsParams,
  type CreatePartParams,
  type UpdatePartParams,
  type DeletePartParams,
} from '@/lib/schemas/admin';