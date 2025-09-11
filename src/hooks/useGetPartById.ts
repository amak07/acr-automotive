"use client";

import { useQuery } from "@tanstack/react-query";
import { querySchema } from "@/app/api/admin/parts/zod-schemas";
import { z } from "zod";
import { DatabasePartRow } from "@/lib/supabase/utils";

type UsePartsParams = z.infer<typeof querySchema>;

export function useGetPartById(queryParams: UsePartsParams) {
  const { id } = queryParams;

  return useQuery<DatabasePartRow>({
    queryKey: ["parts", { id }],
    queryFn: async () => {
      const url = `/api/admin/parts?id=${queryParams.id}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`failed to fetch part: ${id}}`);
      const result = await response.json();
      return result.data as DatabasePartRow;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
