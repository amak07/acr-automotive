/**
 * Centralized Query Keys for TanStack Query
 *
 * This file contains all query keys used throughout the application
 * to ensure consistency and avoid cache invalidation issues.
 */

export const queryKeys = {
  // Parts
  parts: {
    all: ["parts"] as const,
    lists: () => [...queryKeys.parts.all, "list"] as const,
    list: (filters: Record<string, any>) => [...queryKeys.parts.lists(), { filters }] as const,
    details: () => [...queryKeys.parts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.parts.details(), { id }] as const,
  },

  // Vehicle Applications
  vehicleApplications: {
    all: ["vehicle-applications"] as const,
    lists: () => [...queryKeys.vehicleApplications.all, "list"] as const,
    list: (filters: Record<string, any>) => [...queryKeys.vehicleApplications.lists(), { filters }] as const,
    details: () => [...queryKeys.vehicleApplications.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.vehicleApplications.details(), { id }] as const,
    byPart: (partId: string) => [...queryKeys.vehicleApplications.all, "by-part", { partId }] as const,
  },

  // Cross References
  crossReferences: {
    all: ["cross-references"] as const,
    lists: () => [...queryKeys.crossReferences.all, "list"] as const,
    list: (filters: Record<string, any>) => [...queryKeys.crossReferences.lists(), { filters }] as const,
    details: () => [...queryKeys.crossReferences.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.crossReferences.details(), { id }] as const,
    byPart: (partId: string) => [...queryKeys.crossReferences.all, "by-part", { partId }] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    parts: () => [...queryKeys.admin.all, "parts"] as const,
    stats: () => [...queryKeys.admin.all, "stats"] as const,
    filterOptions: () => [...queryKeys.admin.all, "filter-options"] as const,
  },

  // Public
  public: {
    all: ["public"] as const,
    parts: {
      all: () => [...queryKeys.public.all, "parts"] as const,
      list: (filters: Record<string, any>) => [...queryKeys.public.parts.all(), "list", { filters }] as const,
    },
    partBySku: (sku: string) => [...queryKeys.public.all, "part", sku] as const,
    vehicleOptions: () => [...queryKeys.public.all, "vehicle-options"] as const,
  },
} as const;

/**
 * Helper function to invalidate all queries related to a specific part
 * Use this when operations affect multiple related entities for a part
 */
export const invalidatePartRelatedQueries = (queryClient: any, partId: string) => {
  // Invalidate the specific part
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.detail(partId),
  });

  // Invalidate vehicle applications for this part
  queryClient.invalidateQueries({
    queryKey: queryKeys.vehicleApplications.byPart(partId),
  });

  // Invalidate cross references for this part
  queryClient.invalidateQueries({
    queryKey: queryKeys.crossReferences.byPart(partId),
  });

  // Invalidate parts list in case counts changed
  queryClient.invalidateQueries({
    queryKey: queryKeys.parts.lists(),
  });
};