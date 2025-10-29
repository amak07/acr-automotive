// ============================================================================
// Import Validation API - Upload and validate Excel file
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExcelImportService } from '@/services/excel/import/ExcelImportService';
import { ValidationEngine } from '@/services/excel/validation/ValidationEngine';
import { fetchExistingData } from '../_helpers';

/**
 * POST /api/admin/import/validate
 *
 * Validates an uploaded Excel file without executing the import.
 *
 * Request: multipart/form-data with 'file' field
 * Response: {
 *   valid: boolean,
 *   errors: ValidationIssue[],
 *   warnings: ValidationIssue[],
 *   summary: {
 *     totalErrors: number,
 *     totalWarnings: number,
 *     errorsBySheet: { parts: number, vehicleApplications: number, crossReferences: number }
 *   },
 *   parsed: {
 *     parts: number,
 *     vehicleApplications: number,
 *     crossReferences: number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .xlsx files are supported.' },
        { status: 400 }
      );
    }

    console.log('[Import Validate] Processing file:', file.name, `(${Math.round(file.size / 1024)}KB)`);

    // Step 1: Parse Excel file
    const importService = new ExcelImportService();
    const parsed = await importService.parseFile(file);

    console.log('[Import Validate] Parsed:', {
      parts: parsed.parts.rowCount,
      vehicleApplications: parsed.vehicleApplications.rowCount,
      crossReferences: parsed.crossReferences.rowCount,
    });

    // Step 2: Fetch existing database data
    const existingData = await fetchExistingData();

    console.log('[Import Validate] Existing data:', {
      parts: existingData.parts.size,
      vehicleApplications: existingData.vehicleApplications.size,
      crossReferences: existingData.crossReferences.size,
      partSkus: existingData.partSkus.size,
    });

    // Step 3: Validate
    const validationEngine = new ValidationEngine();
    const validationResult = await validationEngine.validate(parsed, existingData);

    console.log('[Import Validate] Validation:', {
      valid: validationResult.valid,
      errors: validationResult.summary.totalErrors,
      warnings: validationResult.summary.totalWarnings,
    });

    // Return validation result
    return NextResponse.json({
      valid: validationResult.valid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      summary: validationResult.summary,
      parsed: {
        parts: parsed.parts.rowCount,
        vehicleApplications: parsed.vehicleApplications.rowCount,
        crossReferences: parsed.crossReferences.rowCount,
      },
    });

  } catch (error: any) {
    console.error('[Import Validate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate file' },
      { status: 500 }
    );
  }
}
