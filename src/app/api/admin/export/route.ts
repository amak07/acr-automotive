import { NextRequest, NextResponse } from 'next/server';
import { ExcelExportService } from '@/services/export/ExcelExportService';
import type { ExportFilters } from '@/services/excel/shared';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * GET /api/admin/export
 *
 * Export catalog data to Excel file (3-sheet format)
 *
 * Query Parameters (all optional):
 * - search: Text search (SKU, description, part type)
 * - part_type: Filter by part type
 * - position_type: Filter by position
 * - abs_type: Filter by ABS type
 * - drive_type: Filter by drive type
 * - bolt_pattern: Filter by bolt pattern
 *
 * If no filters provided, exports entire catalog.
 * If filters provided, exports only matching parts and their relationships.
 *
 * Returns:
 * - Excel file download (.xlsx)
 * - Filename: acr-catalog-export-{timestamp}.xlsx or acr-filtered-export-{timestamp}.xlsx
 * - 3 sheets: Parts, Vehicle Applications, Cross References
 * - Hidden ID columns for import matching
 *
 * Examples:
 * ```bash
 * # Export all
 * curl http://localhost:3000/api/admin/export > export.xlsx
 *
 * # Export filtered
 * curl "http://localhost:3000/api/admin/export?part_type=Brake%20Rotor&search=civic" > filtered.xlsx
 * ```
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract filters from query parameters
    const filters: ExportFilters = {
      search: searchParams.get('search') || undefined,
      part_type: searchParams.get('part_type') || undefined,
      position_type: searchParams.get('position_type') || undefined,
      abs_type: searchParams.get('abs_type') || undefined,
      drive_type: searchParams.get('drive_type') || undefined,
      bolt_pattern: searchParams.get('bolt_pattern') || undefined,
    };

    // Check if any filters are applied
    const hasFilters = Object.values(filters).some((v) => v !== undefined);

    // Derive base URL from request for Excel instruction hyperlinks
    const origin = request.nextUrl.origin;

    // Read locale preference from query param (matches UI language setting)
    const locale = (searchParams.get("locale") === "es" ? "es" : "en") as "en" | "es";

    const service = new ExcelExportService();

    // Generate Excel file (filtered or all)
    const buffer = hasFilters
      ? await service.exportFiltered(filters, origin, locale)
      : await service.exportAllData(origin, locale);

    // Get export statistics for headers
    const stats = await service.getExportStats();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const prefix = hasFilters ? 'acr-filtered-export' : 'acr-catalog-export';
    const filename = `${prefix}-${timestamp}.xlsx`;

    // Return file download response
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        // Include stats in custom headers for debugging
        'X-Export-Parts': stats.parts.toString(),
        'X-Export-Vehicles': stats.vehicles.toString(),
        'X-Export-CrossRefs': stats.crossRefs.toString(),
        'X-Export-Total': stats.totalRecords.toString(),
      },
    });
  } catch (error: any) {
    console.error('Excel export failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export catalog data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
