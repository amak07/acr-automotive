import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";
import {
  queryVehicleSchema,
  createVehicleSchema,
  deleteVehicleSchema,
  updateVehicleSchema,
} from "@/lib/schemas/admin";
import { PostgrestError } from "@supabase/supabase-js";
import { DatabaseVehicleAppRow } from "@/types/database";
import { requireAuth } from "@/lib/api/auth-helpers";

type AdminVehicleQueryParams = z.infer<typeof queryVehicleSchema>;

export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  try {
    const params: AdminVehicleQueryParams = queryVehicleSchema.parse(rawParams);
    // GET a single VA.
    if (params.id) {
      const { data: vehicle, error: partError } = await supabase
        .from("vehicle_applications")
        .select("*")
        .eq("id", params.id)
        .single();

      if (partError) throw partError;

      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 }
        );
      }

      return Response.json({ data: vehicle });
    } else {
      if (!params.part_id) {
        return NextResponse.json(
          { error: "part_id is required for listing vehicles" },
          { status: 400 }
        );
      }

      // GET a list of VAs given a part_id.
      let query = supabase
        .from("vehicle_applications")
        .select("*")
        .eq("part_id", params.part_id)
        .range(params.offset, params.offset + params.limit - 1)
        .order(params.sort_by, { ascending: params.sort_order === "asc" });

      const {
        data,
        error: supabaseError,
      }: {
        data: DatabaseVehicleAppRow[] | null;
        error: PostgrestError | null;
      } = await query;
      if (supabaseError) throw supabaseError;

      return Response.json({ data });
    }
  } catch (error) {
    return Response.json(
      {
        error: "failed to fetch vehicles.",
      },
      { status: 500 }
    );
  }
}

type AdminVehiclePostParams = z.infer<typeof createVehicleSchema>;

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();

  try {
    const params: AdminVehiclePostParams = createVehicleSchema.parse(body);
    const { part_id, make, model, start_year, end_year } = params;
    const {
      data,
      error: supabaseError,
    }: { data: DatabaseVehicleAppRow[] | null; error: PostgrestError | null } =
      await supabase
        .from("vehicle_applications")
        .insert({
          part_id,
          make,
          model,
          start_year,
          end_year,
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

type AdminVehiclePutParams = z.infer<typeof updateVehicleSchema>;

export async function PUT(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();

  try {
    const params: AdminVehiclePutParams = updateVehicleSchema.parse(body);
    const { make, model, start_year, end_year, id } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabaseVehicleAppRow[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("vehicle_applications")
      .update({
        make,
        model,
        start_year,
        end_year,
      })
      .eq("id", id)
      .select();

    if (supabaseError) throw supabaseError;

    // If a vehicle ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
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

type AdminVehicleDeleteParams = z.infer<typeof deleteVehicleSchema>;

export async function DELETE(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();

  try {
    const params: AdminVehicleDeleteParams = deleteVehicleSchema.parse(body);
    const { id } = params;
    const {
      data,
      error: supabaseError,
    }: {
      data: DatabaseVehicleAppRow[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("vehicle_applications")
      .delete()
      .eq("id", id)
      .select();

    if (supabaseError) throw supabaseError;

    // If a Vehicle ID is not found, supabase returns an empty array.
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
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
