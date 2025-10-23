import { NextRequest, NextResponse } from 'next/server';
import { ExcelExportService } from '@/lib/services/ExcelExportService';

/**
 * GET /api/admin/export
 *
 * Export all catalog data to Excel file (3-sheet format)
 *
 * Returns:
 * - Excel file download (.xlsx)
 * - Filename: acr-catalog-export-{timestamp}.xlsx
 * - 3 sheets: Parts, Vehicle Applications, Cross References
 * - Hidden ID columns for import matching
 *
 * Example:
 * ```bash
 * curl http://localhost:3000/api/admin/export > export.xlsx
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const service = new ExcelExportService();

    // Get export statistics for logging
    const stats = await service.getExportStats();

    // Generate Excel file
    const buffer = await service.exportAllData();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `acr-catalog-export-${timestamp}.xlsx`;

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
