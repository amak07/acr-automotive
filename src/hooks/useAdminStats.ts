import { AdminStats, AdminStatsApiResponse } from "@/app/api/admin/stats/route";
import { useQuery } from "@tanstack/react-query";

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

export function useGetAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}
