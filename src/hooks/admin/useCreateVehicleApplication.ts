import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createVehicleSchema } from "@/app/api/admin/vehicles/zod-schemas";
import { queryKeys } from "@/hooks";

export type CreateVehicleApplicationParams = z.infer<typeof createVehicleSchema>;

export type CreateVehicleApplicationError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useCreateVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    CreateVehicleApplicationError,
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

// Helper function to extract form errors from API response
export function mapCreateVehicleApplicationErrors(
  error: CreateVehicleApplicationError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}