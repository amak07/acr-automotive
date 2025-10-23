import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/lib/services/BulkOperationsService";
import { bulkCreatePartsSchema } from "@/lib/schemas/admin";
import { ZodError } from "zod";

/**
 * POST /api/admin/bulk/parts/create
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

    // Validate request body
    const validated = bulkCreatePartsSchema.parse(body);

    // Execute bulk operation
    const service = new BulkOperationsService();
    const result = await service.createParts(validated.parts);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
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
