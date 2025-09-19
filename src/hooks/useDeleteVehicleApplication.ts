import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { deleteVehicleSchema } from "@/app/api/admin/vehicles/zod-schemas";
import { queryKeys } from "./queryKeys";

export type DeleteVehicleApplicationParams = z.infer<typeof deleteVehicleSchema>;

export type DeleteVehicleApplicationError = {
  error: string;
  issues?: Array<{
    field: string;
    message: string;
  }>;
};

export function useDeleteVehicleApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    { data: any },
    DeleteVehicleApplicationError,
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