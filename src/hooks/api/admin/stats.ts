"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";
import type { FilterOptionsResponse } from "@/app/api/admin/filter-options/route";
import type { AdminStats, AdminStatsApiResponse } from "@/app/api/admin/stats/route";

// ============================================================================
// Types
// ============================================================================

interface FilterOptionsApiResponse {
  success: boolean;
  data?: FilterOptionsResponse;
  error?: string;
  timestamp: string;
}

// ============================================================================
// Query Functions
// ============================================================================

async function fetchFilterOptions(): Promise<FilterOptionsResponse> {
  const response = await fetch("/api/admin/filter-options");

  if (!response.ok) {
    throw new Error("Failed to fetch filter options");
  }

  const result: FilterOptionsApiResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch filter options");
  }

  return result.data;
}

async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch("/api/admin/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch admin stats");
  }

  const result: AdminStatsApiResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch admin stats");
  }

  return result.data;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * useFilterOptions - Fetch available filter options for admin interface
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: queryKeys.admin.filterOptions(),
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * useGetAdminStats - Fetch admin dashboard statistics
 */
export function useGetAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}
