import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { DatabasePartRow } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { publicSearchSchema, PublicSearchParams } from "@/lib/schemas/public";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: PublicSearchParams = publicSearchSchema.parse(rawParams);

    // Default: return all parts if no search parameters
    if (!params.make && !params.model && !params.year && !params.sku_term) {
      let query = supabase
        .from("parts")
        .select(`*`, { count: "exact" })
        .not("part_type", "eq", "PENDING") // remove any unready parts.
        .range(params.offset, params.offset + params.limit - 1);

      const {
        data,
        count,
        error: supabaseError,
      }: {
        data: DatabasePartRow[] | null;
        count: number | null;
        error: PostgrestError | null;
      } = await query;

      if (supabaseError) throw supabaseError;

      return Response.json({ data, count });
    }

    // SKU search using RPC
    if (params.sku_term) {
      const { data: allData, error: rpcError } = await supabase.rpc("search_by_sku", {
        search_sku: params.sku_term,
      });

      if (rpcError) throw rpcError;

      // Apply pagination to RPC results
      const totalCount = allData?.length || 0;
      const paginatedData = allData?.slice(params.offset, params.offset + params.limit) || [];

      return Response.json({
        data: paginatedData,
        count: totalCount,
        search_type: "sku",
      });
    }

    // Vehicle search using RPC
    if (params.make && params.model && params.year) {
      const { data: allData, error: rpcError } = await supabase.rpc(
        "search_by_vehicle",
        {
          make: params.make,
          model: params.model,
          target_year: parseInt(params.year),
        }
      );

      if (rpcError) throw rpcError;

      // Apply pagination to RPC results
      const totalCount = allData?.length || 0;
      const paginatedData = allData?.slice(params.offset, params.offset + params.limit) || [];

      return Response.json({
        data: paginatedData,
        count: totalCount,
        search_type: "vehicle",
      });
    }

    // If partial vehicle params, return error
    return Response.json(
      { error: "Vehicle search requires make, model, and year" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Public search error:", error);
    return Response.json(
      {
        error: "failed to fetch parts",
      },
      { status: 500 }
    );
  }
}
