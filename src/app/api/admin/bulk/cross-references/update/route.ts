import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/services/bulk-operations/BulkOperationsService";
import { bulkUpdateCrossRefsSchema } from "@/lib/schemas/admin";
import { ZodError } from "zod";

/**
 * POST /api/admin/bulk/cross-references/update
 *
 * Update multiple cross references atomically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkUpdateCrossRefsSchema.parse(body);

    const service = new BulkOperationsService();
    const result = await service.updateCrossReferences(validated.cross_references);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 }
    );
  }
}
