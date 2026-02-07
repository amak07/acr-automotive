// ============================================================================
// Import Preview API - Generate diff without executing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExcelImportService } from '@/services/excel/import/ExcelImportService';
import { ValidationEngine } from '@/services/excel/validation/ValidationEngine';
import { DiffEngine } from '@/services/excel/diff/DiffEngine';
import { fetchExistingData } from '../_helpers';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * POST /api/admin/import/preview
 *
 * Generates a preview of changes (diff) that would be applied if import is executed.
 * Does NOT modify the database.
 *
 * Request: multipart/form-data with 'file' field
 * Response: {
 *   valid: boolean,
 *   errors: ValidationIssue[],
 *   warnings: ValidationIssue[],
 *   diff: {
 *     summary: { totalAdds, totalUpdates, totalDeletes, totalUnchanged, totalChanges, changesBySheet },
 *     parts: SheetDiff<ExcelPartRow>,
 *     vehicleApplications: SheetDiff<ExcelVehicleAppRow>,
 *     crossReferences: { adds: CrossRefDiffItem[], deletes: CrossRefDiffItem[], summary },
 *     aliases?: SheetDiff<ExcelAliasRow>
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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

    console.log('[Import Preview] Processing file:', file.name);

    // Step 1: Parse Excel file
    const importService = new ExcelImportService();
    const parsed = await importService.parseFile(file);

    // Step 2: Fetch existing database data
    const existingData = await fetchExistingData();

    // Step 3: Validate
    const validationEngine = new ValidationEngine();
    const validationResult = await validationEngine.validate(parsed, existingData);

    if (!validationResult.valid) {
      console.log('[Import Preview] Validation failed, returning errors');
      return NextResponse.json({
        valid: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        diff: null,
      }, { status: 400 });
    }

    // Step 4: Generate diff
    const diffEngine = new DiffEngine();
    const diffResult = diffEngine.generateDiff(parsed, existingData);

    console.log('[Import Preview] Diff generated:', diffResult.summary);

    // Return preview with validation and diff
    return NextResponse.json({
      valid: true,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      diff: diffResult,
    });

  } catch (error: any) {
    console.error('[Import Preview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
