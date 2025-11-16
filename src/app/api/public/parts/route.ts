import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { DatabasePartRow, PartSearchResult } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { publicSearchSchema, PublicSearchParams } from "@/lib/schemas/public";
import { normalizeSku } from "@/lib/utils/sku-utils";

// Helper function to enrich parts with primary image URLs
async function enrichWithPrimaryImages(
  parts: DatabasePartRow[]
): Promise<PartSearchResult[]> {
  if (!parts || parts.length === 0) return [];

  const partIds = parts.map((p) => p.id);

  // Fetch all primary images for these parts in one query
  const { data: images, error } = await supabase
    .from("part_images")
    .select("part_id, image_url, is_primary, display_order")
    .in("part_id", partIds)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching primary images:", error);
    // Return parts without images rather than failing
    return parts.map((part) => ({ ...part, primary_image_url: null }));
  }

  // Group images by part_id
  const imagesByPartId = images.reduce(
    (acc, img) => {
      if (!acc[img.part_id]) acc[img.part_id] = [];
      acc[img.part_id].push(img);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Add primary_image_url to each part
  // Primary image is always the first one by display_order (already sorted)
  return parts.map((part) => {
    const partImages = imagesByPartId[part.id] || [];
    const primaryImage = partImages[0]?.image_url || null;

    return {
      ...part,
      primary_image_url: primaryImage,
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    // Handle get by ID or SKU first
    if (rawParams.id || rawParams.sku) {
      const lookupField = rawParams.sku ? "acr_sku" : "id";
      const lookupValue = rawParams.sku
        ? normalizeSku(rawParams.sku)
        : rawParams.id;

      // Query 1: Get the part
      const { data: partData, error: partError } = await supabase
        .from("parts")
        .select("*")
        .eq(lookupField, lookupValue)
        .single();

      if (partError) {
        if (partError.code === "PGRST116") {
          return Response.json(
            {
              success: false,
              error: "Part not found",
              timestamp: new Date().toISOString(),
            },
            { status: 404 }
          );
        }
        throw partError;
      }

      // Use the part's UUID for related queries
      const partId = partData.id;

      // Query 2: Get vehicle applications
      const { data: vehicleApps, error: vehicleError } = await supabase
        .from("vehicle_applications")
        .select("*")
        .eq("part_id", partId);

      if (vehicleError) throw vehicleError;

      // Query 3: Get cross-references
      const { data: crossRefs, error: crossError } = await supabase
        .from("cross_references")
        .select("*")
        .eq("acr_part_id", partId);

      if (crossError) throw crossError;

      // Query 4: Get part images
      const { data: images, error: imagesError } = await supabase
        .from("part_images")
        .select("*")
        .eq("part_id", partId)
        .order("display_order", { ascending: true });

      if (imagesError) throw imagesError;

      // Query 5: Get 360° viewer frames
      const { data: frames360, error: frames360Error } = await supabase
        .from("part_360_frames")
        .select("*")
        .eq("part_id", partId)
        .order("frame_number", { ascending: true });

      if (frames360Error) throw frames360Error;

      // Combine the results
      const result = {
        ...partData,
        vehicle_applications: vehicleApps || [],
        cross_references: crossRefs || [],
        images: images || [],
        frames_360: frames360 || [],
      };

      return Response.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

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

      // Enrich with primary images
      const enrichedData = await enrichWithPrimaryImages(data || []);

      return Response.json({ data: enrichedData, count });
    }

    // SKU search using RPC
    if (params.sku_term) {
      const { data: allData, error: rpcError } = await supabase.rpc(
        "search_by_sku",
        {
          search_sku: params.sku_term,
        }
      );

      if (rpcError) throw rpcError;

      // Apply pagination to RPC results
      const totalCount = allData?.length || 0;
      const paginatedData =
        allData?.slice(params.offset, params.offset + params.limit) || [];

      // Enrich with primary images
      const enrichedData = await enrichWithPrimaryImages(paginatedData);

      return Response.json({
        data: enrichedData,
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
      const paginatedData =
        allData?.slice(params.offset, params.offset + params.limit) || [];

      // Enrich with primary images
      const enrichedData = await enrichWithPrimaryImages(paginatedData);

      return Response.json({
        data: enrichedData,
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
