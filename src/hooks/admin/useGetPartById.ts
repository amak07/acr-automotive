"use client";

import { useQuery } from "@tanstack/react-query";
import { PartWithDetails } from "@/types";
import { queryKeys } from "@/hooks";

interface UseGetPartByIdParams {
  sku: string;
}

export function useGetPartById(queryParams: UseGetPartByIdParams) {
  const { sku } = queryParams;

  return useQuery<PartWithDetails>({
    queryKey: queryKeys.parts.detail(sku || ""),
    enabled: !!sku, // Only run query if sku exists
    queryFn: async () => {
      const url = `/api/admin/parts?sku=${encodeURIComponent(sku)}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`failed to fetch part: ${sku}`);
      const result = await response.json();
      return result.data as PartWithDetails;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
