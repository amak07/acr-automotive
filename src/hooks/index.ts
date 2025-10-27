// Re-export all hooks for convenient importing

// Common utilities (query keys, toast, URL state, etc.)
export * from './common';

// New organized API hooks (domain-based structure)
export * from './api';

// Legacy folders (admin/, public/) remain for backwards compatibility
// Import directly from those folders if needed during migration:
// - import { useGetParts } from '@/hooks/admin'
// - import { usePublicParts } from '@/hooks/public'