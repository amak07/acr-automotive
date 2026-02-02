import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { DatabasePartRow, PartSearchResult } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { publicSearchSchema, PublicSearchParams } from "@/lib/schemas/public";
import { normalizeSku } from "@/lib/utils/sku";

// Helper function to detect if a search term looks like a vehicle keyword
// (vs a SKU pattern like "ACR-15002" or "512348")
function detectVehicleKeyword(term: string): boolean {
  const normalized = term.trim().toLowerCase();

  // Too short to be meaningful
  if (normalized.length < 3) return false;

  // Starts with ACR prefix - definitely a SKU
  if (normalized.startsWith("acr")) return false;

  // Matches SKU patterns: digits, or alphanumeric with hyphens containing numbers
  // Examples: "512348", "15002", "ACR-15002", "WB-123"
  if (/^\d+$/.test(normalized)) return false; // Pure digits = SKU
  if (/^[a-z]+-\d+/i.test(normalized)) return false; // "prefix-numbers" = SKU

  // Contains mostly letters (with optional spaces/hyphens) = vehicle keyword
  // Examples: "mustang", "f-150", "monte carlo", "chevy"
  return /^[a-z][a-z0-9\s-]*$/i.test(normalized);
}

// Helper function to enrich parts with primary image URLs
// Falls back to first 360° frame if no product images exist
async function enrichWithPrimaryImages(
  parts: DatabasePartRow[]
): Promise<PartSearchResult[]> {
  if (!parts || parts.length === 0) return [];

  const partIds = parts.map((p) => p.id);

  // Fetch all product images for these parts in one query
  const { data: images, error: imagesError } = await supabase
    .from("part_images")
    .select("part_id, image_url, is_primary, display_order")
    .in("part_id", partIds)
    .order("display_order", { ascending: true });

  if (imagesError) {
    console.error("Error fetching primary images:", imagesError);
  }

  // Group product images by part_id
  const imagesByPartId = (images || []).reduce(
    (acc, img) => {
      if (!acc[img.part_id]) acc[img.part_id] = [];
      acc[img.part_id].push(img);
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Find parts without product images to fetch their 360 frames
  const partsWithoutImages = parts.filter(
    (p) => !imagesByPartId[p.id] || imagesByPartId[p.id].length === 0
  );

  // Fetch first 360 frame for parts without product images
  let framesByPartId: Record<string, string> = {};
  if (partsWithoutImages.length > 0) {
    const partIdsWithoutImages = partsWithoutImages.map((p) => p.id);
    const { data: frames, error: framesError } = await supabase
      .from("part_360_frames")
      .select("part_id, image_url, frame_number")
      .in("part_id", partIdsWithoutImages)
      .eq("frame_number", 1); // Get first frame only

    if (framesError) {
      console.error("Error fetching 360 frames:", framesError);
    } else if (frames) {
      framesByPartId = frames.reduce(
        (acc, frame) => {
          acc[frame.part_id] = frame.image_url;
          return acc;
        },
        {} as Record<string, string>
      );
    }
  }

  // Add primary_image_url to each part
  // Priority: product image > first 360 frame > null
  return parts.map((part) => {
    const partImages = imagesByPartId[part.id] || [];
    const primaryImage =
      partImages[0]?.image_url || framesByPartId[part.id] || null;

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
        .eq("workflow_status", "ACTIVE") // Only show active parts (Phase 5)
        .order("has_360_viewer", { ascending: false }) // Parts with 360° viewer first
        .order("has_product_images", { ascending: false }) // Then parts with product images
        .order("acr_sku", { ascending: true }) // Then alphabetically
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

    // SKU or Vehicle Keyword search
    if (params.sku_term) {
      // Detect if this looks like a vehicle keyword vs a SKU
      const isVehicleKeyword = detectVehicleKeyword(params.sku_term);

      if (isVehicleKeyword) {
        // Use vehicle keyword search
        const { data: allData, error: rpcError } = await supabase.rpc(
          "search_by_vehicle_keyword",
          {
            search_term: params.sku_term,
          }
        );

        if (rpcError) throw rpcError;

        // Extract unique matched vehicles for display
        const matchedVehicles = [
          ...new Set(
            (allData || []).map(
              (d: { matched_vehicle: string }) => d.matched_vehicle
            )
          ),
        ].slice(0, 5);

        // Apply pagination
        const totalCount = allData?.length || 0;
        const paginatedData =
          allData?.slice(params.offset, params.offset + params.limit) || [];

        // Enrich with primary images
        const enrichedData = await enrichWithPrimaryImages(paginatedData);

        return Response.json({
          data: enrichedData,
          count: totalCount,
          search_type: "vehicle_keyword",
          matched_vehicles: matchedVehicles,
        });
      }

      // Use existing SKU search
      const { data: allData, error: rpcError } = await supabase.rpc(
        "search_by_sku",
        {
          search_term: params.sku_term,
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
          p_make: params.make,
          p_model: params.model,
          p_year: parseInt(params.year),
        }
      );

      if (rpcError) throw rpcError;

      // Sort by has_360_viewer DESC, has_product_images DESC, then acr_sku ASC
      const sortedData = (allData || []).sort(
        (a: DatabasePartRow, b: DatabasePartRow) => {
          // First: parts with 360° viewer come first
          if (a.has_360_viewer !== b.has_360_viewer) {
            return a.has_360_viewer ? -1 : 1;
          }
          // Second: parts with product images
          if (a.has_product_images !== b.has_product_images) {
            return a.has_product_images ? -1 : 1;
          }
          // Then: alphabetically by SKU
          return (a.acr_sku || "").localeCompare(b.acr_sku || "");
        }
      );

      // Apply pagination to sorted results
      const totalCount = sortedData.length;
      const paginatedData = sortedData.slice(
        params.offset,
        params.offset + params.limit
      );

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
