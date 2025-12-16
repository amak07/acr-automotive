import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard error response format for bulk operations
 */
export interface BulkOperationErrorResponse {
  success: false;
  errors: Array<{
    field?: string;
    message: string;
  }>;
}

/**
 * Format Zod validation errors into a standard response
 */
export function formatZodError(error: ZodError): BulkOperationErrorResponse {
  return {
    success: false,
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}

/**
 * Format unknown errors into a standard response
 */
export function formatUnknownError(error: unknown): BulkOperationErrorResponse {
  return {
    success: false,
    errors: [
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    ],
  };
}

/**
 * Handle API route errors with consistent formatting
 *
 * @param error - The caught error
 * @returns NextResponse with appropriate status and error format
 *
 * @example
 * ```ts
 * try {
 *   // ... operation
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(formatZodError(error), { status: 400 });
  }

  return NextResponse.json(formatUnknownError(error), { status: 500 });
}
