import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { updateVehicleSchema } from "@/app/api/admin/vehicles/zod-schemas";
import { queryKeys } from "@/hooks";

export type UpdateVehicleApplicationParams = z.infer<typeof updateVehicleSchema>;

export type UpdateVehicleApplicationError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useUpdateVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    UpdateVehicleApplicationError,
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

// Helper function to extract form errors from API response
export function mapVehicleApplicationErrors(
  error: UpdateVehicleApplicationError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error.issues) {
    error.issues.forEach((issue) => {
      fieldErrors[issue.field] = issue.message;
    });
  }

  return fieldErrors;
}