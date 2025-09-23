import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export interface VehicleOptionsResponse {
  makes: string[];
  models: { [brand: string]: string[] };
  years: { [va: string]: number[] };
}

async function getAllVehicles() {
  let allVehicles = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from("vehicle_applications")
      .select("make, model, start_year, end_year")
      .not("make", "is", null)
      .not("model", "is", null)
      .range(from, from + batchSize - 1);

    if (error) throw error;

    allVehicles.push(...batch);
    hasMore = batch.length === batchSize;
    from += batchSize;
  }

  return allVehicles as [
    { make: string; model: string; start_year: number; end_year: number },
  ];
}

export async function GET() {
  try {
    // Get all vehicle combinations in batch query (supabase restricts us to 1000 rows per query)
    const vehicles = await getAllVehicles();

    // Extract unique makes
    const makes = [...new Set(vehicles.map((v) => v.make))].sort();

    // Group models by make
    const modelsGrouped = vehicles.reduce(
      (acc, v) => {
        if (!acc[v.make]) {
          acc[v.make] = new Set();
        }
        acc[v.make].add(v.model);
        return acc;
      },
      {} as { [make: string]: Set<string> }
    );

    // Convert Sets to sorted arrays
    const models = Object.keys(modelsGrouped).reduce(
      (acc, make) => {
        acc[make] = [...modelsGrouped[make]].sort();
        return acc;
      },
      {} as { [make: string]: string[] }
    );

    // Group years by make-model combination
    const yearsGrouped = vehicles.reduce(
      (acc, v) => {
        const key = `${v.make}-${v.model}`;
        if (!acc[key]) {
          acc[key] = new Set();
        }
        // Add all years in the range from start_year to end_year
        for (let year = v.start_year; year <= v.end_year; year++) {
          acc[key].add(year);
        }
        return acc;
      },
      {} as { [key: string]: Set<number> }
    );

    // Convert Sets to sorted arrays
    const years = Object.keys(yearsGrouped).reduce(
      (acc, key) => {
        acc[key] = [...yearsGrouped[key]].sort((a, b) => b - a); // Newest first
        return acc;
      },
      {} as { [key: string]: number[] }
    );

    const vehicleOptions: VehicleOptionsResponse = {
      makes,
      models,
      years,
    };

    return NextResponse.json({
      success: true,
      data: vehicleOptions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching vehicle options:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle options",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
