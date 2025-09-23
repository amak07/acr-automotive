"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/common/queryKeys";
import { PublicSearchParams } from "@/app/api/public/parts/route";
import { DatabasePartRow } from "@/types";

type UsePartsParams = PublicSearchParams;

export function usePublicParts(queryParams: UsePartsParams) {
  const { make, model, year, sku_term, limit = 15, offset = 0 } = queryParams;

  return useQuery<{ data: DatabasePartRow[]; count: number }>({
    queryKey: queryKeys.public.parts.list({
      make,
      model,
      year,
      sku_term,
      limit,
      offset,
    }),
    queryFn: async () => {
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
      return {
        data: result.data,
        count: result.count,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
