"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";
import { PartSearchResult } from "@/types";
import { PublicSearchParams } from "@/lib/schemas";

type UsePartsParams = PublicSearchParams;

export function usePublicParts(queryParams: UsePartsParams) {
  const { make, model, year, sku_term, limit = 15, offset = 0 } = queryParams;

  const queryKey = queryKeys.public.parts.list({
    make,
    model,
    year,
    sku_term,
    limit,
    offset,
  });

  console.log("[DEBUG] usePublicParts query key:", JSON.stringify(queryKey));

  return useQuery<{ data: PartSearchResult[]; count: number }>({
    queryKey,
    queryFn: async () => {
      console.log("[DEBUG] Fetching public parts list");
      const searchParams = new URLSearchParams();

      // Add search parameters
      if (make) searchParams.set("make", make);
      if (model) searchParams.set("model", model);
      if (year) searchParams.set("year", year);
      if (sku_term) searchParams.set("sku_term", sku_term);

      // Add pagination parameters
      searchParams.set("limit", limit.toString());
      searchParams.set("offset", offset.toString());

      const url = `/api/public/parts?${searchParams.toString()}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error("failed to fetch parts list");
      const result = await response.json();
      console.log("[DEBUG] Public parts fetched:", result.data.length, "parts");
      return {
        data: result.data,
        count: result.count,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
