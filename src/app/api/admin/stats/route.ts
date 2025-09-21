import { supabase } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export type AdminStats = {
  totalParts: number;
  totalVehicles: number;
  totalCrossReferences: number;
};

export type AdminStatsApiResponse = {
  success: boolean;
  data?: AdminStats;
  error?: any;
};

export async function GET() {
  try {
    const [
      { count: totalPartsCount, error: partError },
      { count: totalVehiclesCount, error: vaError },
      { count: totalCrossRefsCount, error: crError },
    ] = await Promise.all([
      supabase.from("parts").select("*", { count: "exact", head: true }),
      supabase
        .from("vehicle_applications")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("cross_references")
        .select("*", { count: "exact", head: true }),
    ]);

    // Check for any errors after all queries
    if (partError) throw partError;
    if (vaError) throw vaError;
    if (crError) throw crError;

    // Default to 0 if count is null (edge case, though unlikely)
    const stats: AdminStats = {
      totalParts: totalPartsCount ?? 0,
      totalVehicles: totalVehiclesCount ?? 0,
      totalCrossReferences: totalCrossRefsCount ?? 0,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return Response.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
