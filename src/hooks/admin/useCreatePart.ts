"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createPartSchema } from "@/app/api/admin/parts/schemas";
import { DatabasePartRow } from "@/types";
import { queryKeys } from "@/hooks/common/queryKeys";

export type CreatePartsParams = z.infer<typeof createPartSchema>;

export function useCreatePart() {
  const queryClient = useQueryClient();

  return useMutation<DatabasePartRow[], Error, CreatePartsParams>({
    mutationFn: async (params: CreatePartsParams) => {
      const response = await fetch(`/api/admin/parts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create part: ${response.json()}`);
      }

      const result = await response.json();
      return result.data as DatabasePartRow[];
    },
    onSuccess: () => {
      // Also invalidate the parts list so it shows updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.parts(),
      });
    },
  });
}
