// ============================================================================
// Import Preview API - Generate diff without executing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExcelImportService } from '@/services/excel/import/ExcelImportService';
import { ValidationEngine } from '@/services/excel/validation/ValidationEngine';
import { DiffEngine } from '@/services/excel/diff/DiffEngine';
import { fetchExistingData } from '../_helpers';

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
 *     summary: {
 *       totalAdds: number,
 *       totalUpdates: number,
 *       totalDeletes: number,
 *       totalUnchanged: number,
 *       totalChanges: number,
 *       changesBySheet: { parts: number, vehicleApplications: number, crossReferences: number }
 *     },
 *     parts: { adds: PartRow[], updates: PartRow[], deletes: string[] },
 *     vehicleApplications: { adds: VARow[], updates: VARow[], deletes: string[] },
 *     crossReferences: { adds: CRRow[], updates: CRRow[], deletes: string[] }
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
      diff: {
        summary: diffResult.summary,
        parts: {
          sheetName: diffResult.parts.sheetName,
          adds: diffResult.parts.adds,
          updates: diffResult.parts.updates,
          deletes: diffResult.parts.deletes,
          unchanged: diffResult.parts.unchanged,
          summary: diffResult.parts.summary,
        },
        vehicleApplications: {
          sheetName: diffResult.vehicleApplications.sheetName,
          adds: diffResult.vehicleApplications.adds,
          updates: diffResult.vehicleApplications.updates,
          deletes: diffResult.vehicleApplications.deletes,
          unchanged: diffResult.vehicleApplications.unchanged,
          summary: diffResult.vehicleApplications.summary,
        },
        crossReferences: {
          sheetName: diffResult.crossReferences.sheetName,
          adds: diffResult.crossReferences.adds,
          updates: diffResult.crossReferences.updates,
          deletes: diffResult.crossReferences.deletes,
          unchanged: diffResult.crossReferences.unchanged,
          summary: diffResult.crossReferences.summary,
        },
      },
    });

  } catch (error: any) {
    console.error('[Import Preview] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
