import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/lib/services/BulkOperationsService";
import { bulkUpdatePartsSchema } from "@/lib/schemas/admin";
import { ZodError } from "zod";

/**
 * POST /api/admin/bulk/parts/update
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
export async function POST(request: NextRequest) {
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
