import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import {
  createCrossRefSchema,
  deleteCrossRefSchema,
  queryCrossRefSchema,
  updateCrossRefSchema,
} from "@/lib/schemas/admin";
import { PostgrestError } from "@supabase/supabase-js";
import { DatabaseCrossRefRow } from "@/types/database";

type AdminCrossRefQueryParams = z.infer<typeof queryCrossRefSchema>;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: AdminCrossRefQueryParams =
      queryCrossRefSchema.parse(rawParams);
    // GET a single CR.
    if (params.id) {
      const { data: crossRef, error: partError } = await supabase
        .from("cross_references")
        .select("*")
        .eq("id", params.id)
        .single();

      if (partError) throw partError;

      if (!crossRef) {
        return NextResponse.json(
          { error: "Cross reference not found" },
          { status: 404 }
        );
      }

      return Response.json({ data: crossRef });
    } else {
      if (!params.acr_part_id) {
        return NextResponse.json(
          { error: "acr_part_id is required for listing cross-references" },
          { status: 400 }
        );
      }

      // GET a list of CRs given a acr_part_id.
      let query = supabase
        .from("cross_references")
        .select("*")
        .eq("acr_part_id", params.acr_part_id)
        .range(params.offset, params.offset + params.limit - 1)
        .order(params.sort_by, { ascending: params.sort_order === "asc" });

      const {
        data,
        error: supabaseError,
      }: {
        data: DatabaseCrossRefRow[] | null;
        error: PostgrestError | null;
      } = await query;
      if (supabaseError) throw supabaseError;

      return Response.json({ data });
    }
  } catch (error) {
    return Response.json(
      {
        error: "failed to fetch cross references.",
      },
      { status: 500 }
    );
  }
}

type AdminCrossRefPostParams = z.infer<typeof createCrossRefSchema>;

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminCrossRefPostParams = createCrossRefSchema.parse(body);
    const { acr_part_id, competitor_sku, competitor_brand } = params;
    const {
      data,
      error: supabaseError,
    }: { data: DatabaseCrossRefRow[] | null; error: PostgrestError | null } =
      await supabase
        .from("cross_references")
        .insert({
          acr_part_id,
          competitor_sku,
          competitor_brand,
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

    return NextResponse.json(
      { error: "Database operation failed", details: error },
      { status: 500 }
    );
  }
}

type AdminCrossRefPutParams = z.infer<typeof updateCrossRefSchema>;

export async function PUT(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminCrossRefPutParams = updateCrossRefSchema.parse(body);
    const { id, competitor_sku, competitor_brand } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabaseCrossRefRow[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("cross_references")
      .update({
        competitor_sku,
        competitor_brand,
      })
      .eq("id", id)
      .select();

    if (supabaseError) throw supabaseError;

    // If a cross ref ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Cross reference not found" },
        { status: 404 }
      );
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

type AdminCrossRefDeleteParams = z.infer<typeof deleteCrossRefSchema>;

export async function DELETE(request: NextRequest) {
  const body = await request.json();

  try {
    const params: AdminCrossRefDeleteParams = deleteCrossRefSchema.parse(body);
    const { id } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabaseCrossRefRow[] | null;
      error: PostgrestError | null;
    } = await supabase.from("cross_references").delete().eq("id", id).select();

    if (supabaseError) throw supabaseError;

    // If a Cross Ref ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Cross reference not found" },
        { status: 404 }
      );
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
