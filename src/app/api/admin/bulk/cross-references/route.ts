import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/services/bulk-operations/BulkOperationsService";
import {
  bulkCreateCrossRefsSchema,
  bulkUpdateCrossRefsSchema,
  bulkDeleteCrossRefsSchema,
} from "@/lib/schemas/admin";
import { handleApiError } from "@/lib/api";

/**
 * POST /api/admin/bulk/cross-references
 *
 * Create multiple cross references atomically
 *
 * Request body:
 * {
 *   cross_references: [
 *     {
 *       acr_part_id: "uuid",
 *       competitor_sku: "BREMBO-123",
 *       competitor_brand: "Brembo"
 *     },
 *     ...
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkCreateCrossRefsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.createCrossReferences(
      validated.cross_references
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/bulk/cross-references
 *
 * Update multiple cross references atomically
 *
 * Request body:
 * {
 *   cross_references: [
 *     {
 *       id: "uuid",
 *       competitor_sku: "BREMBO-123",
 *       competitor_brand: "Brembo"
 *     },
 *     ...
 *   ]
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkUpdateCrossRefsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.updateCrossReferences(
      validated.cross_references
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/bulk/cross-references
 *
 * Delete multiple cross references atomically
 *
 * Request body:
 * {
 *   ids: ["uuid1", "uuid2", ...]
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkDeleteCrossRefsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.deleteCrossReferences(validated.ids);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
