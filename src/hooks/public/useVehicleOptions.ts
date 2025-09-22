import { VehicleOptionsResponse } from "@/app/api/public/vehicle-options/route";
import { useQuery } from "@tanstack/react-query";

interface VehicleOptionsApiResponse {
  success: boolean;
  data?: VehicleOptionsResponse;
  error?: string;
  timestamp: string;
}

async function fetchVehicleOptions(): Promise<VehicleOptionsResponse> {
  const response = await fetch("/api/public/vehicle-options");

  if (!response.ok) {
    throw new Error("Failed to fetch vehicle options");
  }

  const result: VehicleOptionsApiResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch vehicle options");
  }

  return result.data;
}

export function useVehicleOptions() {
  return useQuery({
    queryKey: ["vehicle-options"],
    queryFn: fetchVehicleOptions,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}
