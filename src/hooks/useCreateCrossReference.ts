import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createCrossRefSchema } from "@/app/api/admin/cross-references/zod-schemas";
import { queryKeys } from "./queryKeys";

export type CreateCrossReferenceParams = z.infer<typeof createCrossRefSchema>;

export type CreateCrossReferenceError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useCreateCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    CreateCrossReferenceError,
    CreateCrossReferenceParams
  >({
    mutationFn: async (params: CreateCrossReferenceParams) => {
      const response = await fetch("/api/admin/cross-references", {
        method: "POST",
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
      console.error("Failed to create cross reference:", error);
    },
  });
}

// Helper function to extract form errors from API response
export function mapCreateCrossReferenceErrors(
  error: CreateCrossReferenceError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}