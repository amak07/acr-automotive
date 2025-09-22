"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { updatePartSchema } from "@/app/api/admin/parts/schemas";
import { DatabasePartRow } from "@/types";

export type UpdatePartsParams = z.infer<typeof updatePartSchema>;

export function useUpdatePartById() {
  const queryClient = useQueryClient();

  return useMutation<DatabasePartRow[], Error, UpdatePartsParams>({
    mutationFn: async (params: UpdatePartsParams) => {
      const response = await fetch(`/api/admin/parts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to update part: ${params.id}`);
      }

      const result = await response.json();
      return result.data as DatabasePartRow[];
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the part details data
      queryClient.invalidateQueries({
        queryKey: ["parts", { id: variables.id }]
      });
      // Also invalidate the parts list so it shows updated data
      queryClient.invalidateQueries({
        queryKey: ["admin", "parts"]
      });
    },
  });
}
