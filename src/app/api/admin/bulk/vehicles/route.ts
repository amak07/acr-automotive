import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/services/bulk-operations/BulkOperationsService";
import {
  bulkCreateVehiclesSchema,
  bulkUpdateVehiclesSchema,
  bulkDeleteVehiclesSchema,
} from "@/lib/schemas/admin";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/api/auth-helpers";

/**
 * POST /api/admin/bulk/vehicles
 *
 * Create multiple vehicle applications atomically
 *
 * Request body:
 * {
 *   vehicles: [
 *     {
 *       part_id: "uuid",
 *       make: "Honda",
 *       model: "Civic",
 *       start_year: 2018,
 *       end_year: 2020
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validated = bulkCreateVehiclesSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.createVehicleApplications(validated.vehicles);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/bulk/vehicles
 *
 * Update multiple vehicle applications atomically
 *
 * Request body:
 * {
 *   vehicles: [
 *     {
 *       id: "uuid",
 *       make: "Honda",
 *       model: "Civic",
 *       start_year: 2018,
 *       end_year: 2020
 *     },
 *     ...
 *   ]
 * }
 */
export async function PUT(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validated = bulkUpdateVehiclesSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.updateVehicleApplications(validated.vehicles);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/bulk/vehicles
 *
 * Delete multiple vehicle applications atomically
 *
 * Request body:
 * {
 *   ids: ["uuid1", "uuid2", ...]
 * }
 */
export async function DELETE(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const validated = bulkDeleteVehiclesSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.deleteVehicleApplications(validated.ids);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
