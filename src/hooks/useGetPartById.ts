"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { querySchema } from "@/app/api/admin/parts/schemas";
import { PartWithDetails } from "@/types";
import { queryKeys } from "./queryKeys";

type UsePartsParams = Pick<z.infer<typeof querySchema>, "id">;

export function useGetPartById(queryParams: UsePartsParams) {
  const { id } = queryParams;

  return useQuery<PartWithDetails>({
    queryKey: queryKeys.parts.detail(id),
    queryFn: async () => {
      const url = `/api/admin/parts?id=${queryParams.id}`;
      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) throw new Error(`failed to fetch part: ${id}}`);
      const result = await response.json();
      return result.data as PartWithDetails;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
