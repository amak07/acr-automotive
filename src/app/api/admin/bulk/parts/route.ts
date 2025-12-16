import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/services/bulk-operations/BulkOperationsService";
import {
  bulkCreatePartsSchema,
  bulkUpdatePartsSchema,
  bulkDeletePartsSchema,
} from "@/lib/schemas/admin";
import { handleApiError } from "@/lib/api";

/**
 * POST /api/admin/bulk/parts
 *
 * Create multiple parts atomically
 *
 * Request body:
 * {
 *   parts: [
 *     {
 *       sku_number: "ACR-001",
 *       part_type: "Brake Rotor",
 *       position_type: "Front",
 *       ...
 *     },
 *     ...
 *   ]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   created: 100,
 *   data: [...]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkCreatePartsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.createParts(validated.parts);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/bulk/parts
 *
 * Update multiple parts atomically
 *
 * Request body:
 * {
 *   parts: [
 *     {
 *       id: "uuid",
 *       part_type: "Brake Rotor",
 *       ...
 *     },
 *     ...
 *   ]
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkUpdatePartsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.updateParts(validated.parts);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/bulk/parts
 *
 * Delete multiple parts atomically
 *
 * Request body:
 * {
 *   ids: ["uuid1", "uuid2", ...]
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkDeletePartsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.deleteParts(validated.ids);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
