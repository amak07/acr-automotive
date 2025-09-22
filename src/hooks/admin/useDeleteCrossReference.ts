import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { deleteCrossRefSchema } from "@/app/api/admin/cross-references/zod-schemas";
import { queryKeys } from "@/hooks";

export type DeleteCrossReferenceParams = z.infer<typeof deleteCrossRefSchema>;

export type DeleteCrossReferenceError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useDeleteCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    DeleteCrossReferenceError,
    DeleteCrossReferenceParams
  >({
    mutationFn: async (params: DeleteCrossReferenceParams) => {
      const response = await fetch("/api/admin/cross-references", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all parts queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: queryKeys.parts.all,
      });
    },
    onError: (error) => {
      console.error("Failed to delete cross reference:", error);
    },
  });
}