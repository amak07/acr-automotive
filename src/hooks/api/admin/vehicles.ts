"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  createVehicleSchema,
  updateVehicleSchema,
  deleteVehicleSchema,
} from "@/app/api/admin/vehicles/zod-schemas";
import { queryKeys } from "@/hooks/common/queryKeys";

// ============================================================================
// Types
// ============================================================================

export type CreateVehicleApplicationParams = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleApplicationParams = z.infer<typeof updateVehicleSchema>;
export type DeleteVehicleApplicationParams = z.infer<typeof deleteVehicleSchema>;

export type VehicleApplicationError = {
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
 * useCreateVehicleApplication - Create a new vehicle application
 */
export function useCreateVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    VehicleApplicationError,
    CreateVehicleApplicationParams
  >({
    mutationFn: async (params: CreateVehicleApplicationParams) => {
      const response = await fetch("/api/admin/vehicles", {
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
      console.error("Failed to create vehicle application:", error);
    },
  });
}

/**
 * useUpdateVehicleApplication - Update an existing vehicle application
 */
export function useUpdateVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    VehicleApplicationError,
    UpdateVehicleApplicationParams
  >({
    mutationFn: async (params: UpdateVehicleApplicationParams) => {
      const response = await fetch("/api/admin/vehicles", {
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
        queryKeys.vehicleApplications.detail(variables.id),
        data
      );
    },
    onError: (error) => {
      console.error("Failed to update vehicle application:", error);
    },
  });
}

/**
 * useDeleteVehicleApplication - Delete a vehicle application
 */
export function useDeleteVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    VehicleApplicationError,
    DeleteVehicleApplicationParams
  >({
    mutationFn: async (params: DeleteVehicleApplicationParams) => {
      const response = await fetch("/api/admin/vehicles", {
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
      console.error("Failed to delete vehicle application:", error);
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map vehicle application errors to form field errors
 */
export function mapVehicleApplicationErrors(
  error: VehicleApplicationError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}
