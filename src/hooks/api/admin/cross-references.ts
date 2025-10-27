"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  createCrossRefSchema,
  updateCrossRefSchema,
  deleteCrossRefSchema,
} from "@/app/api/admin/cross-references/zod-schemas";
import { queryKeys } from "@/hooks/common/queryKeys";

// ============================================================================
// Types
// ============================================================================

export type CreateCrossReferenceParams = z.infer<typeof createCrossRefSchema>;
export type UpdateCrossReferenceParams = z.infer<typeof updateCrossRefSchema>;
export type DeleteCrossReferenceParams = z.infer<typeof deleteCrossRefSchema>;

export type CrossReferenceError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * useCreateCrossReference - Create a new cross-reference
 */
export function useCreateCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    CrossReferenceError,
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

/**
 * useUpdateCrossReference - Update an existing cross-reference
 */
export function useUpdateCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    CrossReferenceError,
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

/**
 * useDeleteCrossReference - Delete a cross-reference
 */
export function useDeleteCrossReference() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    CrossReferenceError,
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map cross-reference errors to form field errors
 */
export function mapCrossReferenceErrors(
  error: CrossReferenceError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}
