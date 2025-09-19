import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { updateCrossRefSchema } from "@/app/api/admin/cross-references/zod-schemas";
import { queryKeys } from "./queryKeys";

export type UpdateCrossReferenceParams = z.infer<typeof updateCrossRefSchema>;

export type UpdateCrossReferenceError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useUpdateCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    UpdateCrossReferenceError,
    UpdateCrossReferenceParams
  >({
    mutationFn: async (params: UpdateCrossReferenceParams) => {
      const response = await fetch("/api/admin/cross-references", {
        method: "PUT",
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

      // Optionally update the cache directly for immediate UI update
      queryClient.setQueryData(
        queryKeys.crossReferences.detail(variables.id),
        data
      );
    },
    onError: (error) => {
      console.error("Failed to update cross reference:", error);
    },
  });
}

// Helper function to extract form errors from API response
export function mapCrossReferenceErrors(
  error: UpdateCrossReferenceError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}