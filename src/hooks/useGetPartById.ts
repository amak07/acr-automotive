"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { querySchema } from "@/app/api/admin/parts/schemas";
import { PartWithRelations } from "@/types";

type UsePartsParams = Pick<z.infer<typeof querySchema>, "id">;

export function useGetPartById(queryParams: UsePartsParams) {
  const { id } = queryParams;

  return useQuery<PartWithRelations>({
    queryKey: ["parts", { id }],
    queryFn: async () => {
      const url = `/api/admin/parts?id=${queryParams.id}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`failed to fetch part: ${id}}`);
      const result = await response.json();
      return result.data as PartWithRelations;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
