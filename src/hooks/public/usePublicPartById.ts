import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";
import { DatabasePartRow } from "@/types";

interface PublicPartApiResponse {
  success: boolean;
  data?: DatabasePartRow;
  error?: string;
  timestamp: string;
}

async function fetchPublicPartById(id: string): Promise<DatabasePartRow | null> {
  const response = await fetch(`/api/public/parts?id=${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch part details");
  }

  const result: PublicPartApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch part details");
  }

  return result.data || null;
}

export function usePublicPartById(id: string) {
  return useQuery({
    queryKey: queryKeys.parts.detail(id),
    queryFn: () => fetchPublicPartById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });
}