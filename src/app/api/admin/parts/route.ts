import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import {
  AdminPartsQueryParams,
  CreatePartRequest,
  UpdatePartRequest,
  DeletePartRequest,
  DatabasePartRow,
  PartSummary,
  PartWithDetails,
  PartWithImageStats,
} from "@/types";
import {
  querySchema,
  createPartSchema,
  updatePartSchema,
  deletePartSchema,
} from "./schemas";
import { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { normalizeSku } from "@/lib/utils/sku";

// Type for part with image relations (internal use)
type PartWithImageRelations = PartWithDetails & {
  part_images?: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  part_360_frames?: Array<{
    id: string;
    image_url: string;
    frame_number: number;
  }>;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: AdminPartsQueryParams = querySchema.parse(rawParams);
    if (params.id || rawParams.sku) {
      const lookupField = rawParams.sku ? "acr_sku" : "id";
      const lookupValue = rawParams.sku
        ? normalizeSku(rawParams.sku)
        : params.id;

      // Query 1: Get the part
      const { data: partData, error: partError } = await supabase
        .from("parts")
        .select("*")
        .eq(lookupField, lookupValue)
        .single();

      if (partError) throw partError;
      if (!partData) {
        return NextResponse.json({ error: "Part not found" }, { status: 404 });
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

      // Combine the results
      const result = {
        ...partData,
        vehicle_applications: vehicleApps || [],
        cross_references: crossRefs || [],
        vehicle_count: vehicleApps?.length || 0,
        cross_reference_count: crossRefs?.length || 0,
      };

      return Response.json({ data: result });
    } else {
      // Build select query - conditionally include part_images and part_360_frames for image stats
      const baseSelect = "*, vehicle_applications(id), cross_references(id)";
      const selectWithImages =
        "*, vehicle_applications(id), cross_references(id), part_images(id, image_url, display_order), part_360_frames(id, image_url, frame_number)";

      let query = supabase
        .from("parts")
        .select(params.include_image_stats ? selectWithImages : baseSelect, {
          count: "exact",
        })
        .range(params.offset, params.offset + params.limit - 1);

      // Apply sorting - prioritize parts with media when image stats are requested
      if (params.include_image_stats) {
        query = query
          .order("has_360_viewer", { ascending: false }) // Parts with 360° viewer first
          .order("has_product_images", { ascending: false }) // Then parts with product images
          .order("acr_sku", { ascending: true }); // Then alphabetically
      } else {
        query = query.order(params.sort_by, {
          ascending: params.sort_order === "asc",
        });
      }

      // Text search in ACR SKU
      if (params.search) {
        query = query.ilike("acr_sku", `%${params.search}%`);
      }

      // Filter by part type
      if (params.part_type) {
        query = query.eq("part_type", params.part_type);
      }

      // Filter by position type
      if (params.position_type) {
        query = query.eq("position_type", params.position_type);
      }

      // Filter by ABS type
      if (params.abs_type) {
        query = query.eq("abs_type", params.abs_type);
      }

      // Filter by drive type
      if (params.drive_type) {
        query = query.eq("drive_type", params.drive_type);
      }

      // Filter by bolt pattern
      if (params.bolt_pattern) {
        query = query.eq("bolt_pattern", params.bolt_pattern);
      }

      // Filter by 360° viewer presence
      if (params.has_360 === "yes") {
        query = query.eq("has_360_viewer", true);
      } else if (params.has_360 === "no") {
        query = query.eq("has_360_viewer", false);
      }

      const result = await query;
      const { count, error: supabaseError } = result;
      // Cast data since Supabase doesn't infer types correctly for dynamic select
      const data = result.data as PartWithImageRelations[] | null;

      if (supabaseError) throw supabaseError;

      // Filter by image presence (post-query since Supabase doesn't support count-based filtering)
      let filteredData = data;
      if (params.has_images === "yes") {
        filteredData =
          data?.filter((part) => (part.part_images?.length || 0) > 0) || null;
      } else if (params.has_images === "no") {
        filteredData =
          data?.filter((part) => (part.part_images?.length || 0) === 0) || null;
      }

      // Enrich data based on whether image stats were requested
      const enrichedData: (PartSummary | PartWithImageStats)[] | null =
        filteredData?.map((part) => {
          const basePart: PartSummary = {
            id: part.id,
            tenant_id: part.tenant_id,
            acr_sku: part.acr_sku,
            acr_sku_normalized: part.acr_sku_normalized,
            part_type: part.part_type,
            position_type: part.position_type,
            abs_type: part.abs_type,
            bolt_pattern: part.bolt_pattern,
            drive_type: part.drive_type,
            specifications: part.specifications,
            has_360_viewer: part.has_360_viewer,
            has_product_images: part.has_product_images,
            viewer_360_frame_count: part.viewer_360_frame_count,
            created_at: part.created_at,
            updated_at: part.updated_at,
            updated_by: part.updated_by,
            vehicle_count: part.vehicle_applications?.length || 0,
            cross_reference_count: part.cross_references?.length || 0,
          };

          if (params.include_image_stats) {
            const sortedImages = [...(part.part_images || [])].sort(
              (a, b) => a.display_order - b.display_order
            );
            // Fallback to first 360 frame if no product images
            const sorted360Frames = [...(part.part_360_frames || [])].sort(
              (a, b) => a.frame_number - b.frame_number
            );
            const primaryImageUrl =
              sortedImages[0]?.image_url ||
              sorted360Frames[0]?.image_url ||
              null;
            return {
              ...basePart,
              image_count: part.part_images?.length || 0,
              primary_image_url: primaryImageUrl,
            } as PartWithImageStats;
          }

          return basePart;
        }) || null;

      // Adjust count for post-query filtering
      const adjustedCount =
        params.has_images !== "all" ? (filteredData?.length ?? 0) : count;

      return Response.json({ data: enrichedData, count: adjustedCount });
    }
  } catch (error) {
    return Response.json(
      {
        error: "failed to fetch parts",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const params: CreatePartRequest = createPartSchema.parse(body);
    const {
      sku_number,
      part_type,
      abs_type,
      bolt_pattern,
      drive_type,
      position_type,
      specifications,
    } = params;
    // Add ACR prefix if not already present (prevent double-prefix)
    const acr_sku = sku_number.toUpperCase().startsWith("ACR")
      ? sku_number
      : `ACR${sku_number}`;
    const {
      data,
      error: supabaseError,
    }: { data: DatabasePartRow[] | null; error: PostgrestError | null } =
      await supabase
        .from("parts")
        .insert({
          acr_sku,
          part_type,
          abs_type,
          bolt_pattern,
          drive_type,
          position_type,
          specifications,
        })
        .select();

    if (supabaseError) throw supabaseError;

    return Response.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          issues: errorMessages,
        },
        {
          status: 400,
        }
      );
    }

    const pgError = error as PostgrestError;
    if (pgError?.code === "23505") {
      return NextResponse.json(
        { error: "A part with this part number already exists" },
        { status: 409 }
      );
    } else {
      return NextResponse.json(
        { error: "Database operation failed", details: error },
        { status: 500 }
      );
    }
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  try {
    const params: UpdatePartRequest = updatePartSchema.parse(body);
    const {
      part_type,
      abs_type,
      bolt_pattern,
      drive_type,
      position_type,
      specifications,
      id,
    } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabasePartRow[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("parts")
      .update({
        part_type,
        abs_type,
        bolt_pattern,
        drive_type,
        position_type,
        specifications,
      })
      .eq("id", id)
      .select();

    if (supabaseError) throw supabaseError;

    // If a part ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          issues: errorMessages,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      { error: "Database operation failed", details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();

  try {
    const params: DeletePartRequest = deletePartSchema.parse(body);
    const { id } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabasePartRow[] | null;
      error: PostgrestError | null;
    } = await supabase.from("parts").delete().eq("id", id).select();

    if (supabaseError) throw supabaseError;

    // If a part ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return Response.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          issues: errorMessages,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      { error: "Database operation failed", details: error },
      { status: 500 }
    );
  }
}
