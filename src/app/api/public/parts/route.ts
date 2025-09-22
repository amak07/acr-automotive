import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { DatabasePartRow } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";

export const publicSearchSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  sku_term: z.string().optional(),
});

export type PublicSearchParams = z.infer<typeof publicSearchSchema>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: PublicSearchParams = publicSearchSchema.parse(rawParams);

    // Default: return all parts if no search parameters
    if (!params.make && !params.model && !params.year && !params.sku_term) {
      let query = supabase.from("parts").select(`*`, { count: "exact" });

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
      const { data, error: rpcError } = await supabase.rpc("search_by_sku", {
        search_sku: params.sku_term,
      });

      if (rpcError) throw rpcError;

      return Response.json({
        data,
        count: data?.length || 0,
        search_type: "sku",
      });
    }

    // Vehicle search using RPC
    if (params.make && params.model && params.year) {
      const { data, error: rpcError } = await supabase.rpc(
        "search_by_vehicle",
        {
          make: params.make,
          model: params.model,
          target_year: parseInt(params.year),
        }
      );

      if (rpcError) throw rpcError;

      return Response.json({
        data,
        count: data?.length || 0,
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
