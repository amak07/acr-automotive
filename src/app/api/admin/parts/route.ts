import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import {
  querySchema,
  createPartSchema,
  updatePartSchema,
  deletePartSchema,
} from "./zod-schemas";
import { PostgrestError } from "@supabase/supabase-js";
import { DatabasePartRow } from "@/lib/supabase/utils";

// Type for parts with joined relationships
type PartWithRelations = DatabasePartRow & {
  vehicle_applications: Array<{ id: string }>;
  cross_references: Array<{ id: string }>;
};

// Type for enriched response
export type EnrichedPart = DatabasePartRow & {
  vehicle_count: number;
  cross_reference_count: number;
};

type AdminPartsQueryParams = z.infer<typeof querySchema>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: AdminPartsQueryParams = querySchema.parse(rawParams);
    if (params.id) {
      // Query 1: Get the part
      const { data: partData, error: partError } = await supabase
        .from("parts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (partError) throw partError;
      if (!partData) {
        return NextResponse.json({ error: "Part not found" }, { status: 404 });
      }

      // Query 2: Get vehicle applications
      const { data: vehicleApps, error: vehicleError } = await supabase
        .from("vehicle_applications")
        .select("*")
        .eq("part_id", params.id);

      if (vehicleError) throw vehicleError;

      // Query 3: Get cross-references
      const { data: crossRefs, error: crossError } = await supabase
        .from("cross_references")
        .select("*")
        .eq("acr_part_id", params.id);

      if (crossError) throw crossError;

      // Combine the results
      const result = {
        ...partData,
        vehicle_applications: vehicleApps || [],
        cross_references: crossRefs || [],
      };

      return Response.json({ data: result });
    } else {
      let query = supabase
        .from("parts")
        .select(`
          *,
          vehicle_applications(id),
          cross_references(id)
        `, { count: "exact" })
        .range(params.offset, params.offset + params.limit - 1)
        .order(params.sort_by, { ascending: params.sort_order === "asc" });

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

      const {
        data,
        count,
        error: supabaseError,
      }: {
        data: PartWithRelations[] | null;
        count: number | null;
        error: PostgrestError | null;
      } = await query;

      if (supabaseError) throw supabaseError;

      // Transform the data to include counts
      const enrichedData: EnrichedPart[] | null = data?.map(part => ({
        // Spread the base part properties
        id: part.id,
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        position_type: part.position_type,
        abs_type: part.abs_type,
        bolt_pattern: part.bolt_pattern,
        drive_type: part.drive_type,
        specifications: part.specifications,
        image_url: part.image_url,
        created_at: part.created_at,
        updated_at: part.updated_at,
        // Add the computed counts
        vehicle_count: part.vehicle_applications?.length || 0,
        cross_reference_count: part.cross_references?.length || 0,
      })) || null;

      return Response.json({ data: enrichedData, count });
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

type AdminPartsPostParams = z.infer<typeof createPartSchema>;

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminPartsPostParams = createPartSchema.parse(body);
    const {
      sku_number,
      part_type,
      abs_type,
      bolt_pattern,
      drive_type,
      position_type,
      specifications,
    } = params;
    const acr_sku = `ACR${sku_number}`;
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

type AdminPartsPutParams = z.infer<typeof updatePartSchema>;

export async function PUT(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminPartsPutParams = updatePartSchema.parse(body);
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

type AdminPartsDeleteParams = z.infer<typeof deletePartSchema>;

export async function DELETE(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminPartsDeleteParams = deletePartSchema.parse(body);
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
