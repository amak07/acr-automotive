// ============================================================================
// Import Execute API - Run validated import with snapshot creation
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ExcelImportService } from '@/services/excel/import/ExcelImportService';
import { ValidationEngine } from '@/services/excel/validation/ValidationEngine';
import { DiffEngine } from '@/services/excel/diff/DiffEngine';
import { ImportService } from '@/services/excel/import';
import { fetchExistingData } from '../_helpers';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * POST /api/admin/import/execute
 *
 * Executes the import with snapshot creation for rollback capability.
 * Only proceeds if validation passes.
 *
 * Request: multipart/form-data with 'file' field
 * Response: {
 *   success: boolean,
 *   importId: string,
 *   summary: {
 *     totalAdds: number,
 *     totalUpdates: number,
 *     totalDeletes: number,
 *     totalChanges: number
 *   },
 *   executionTime: number
 * }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const startTime = Date.now();

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

    console.log('[Import Execute] Starting import:', file.name);

    // Step 1: Parse Excel file
    const excelService = new ExcelImportService();
    const parsed = await excelService.parseFile(file);

    // Step 2: Fetch existing database data
    const existingData = await fetchExistingData();

    // Step 3: Validate
    const validationEngine = new ValidationEngine();
    const validationResult = await validationEngine.validate(parsed, existingData);

    if (!validationResult.valid) {
      console.log('[Import Execute] Validation failed, aborting');
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      }, { status: 400 });
    }

    // Step 4: Generate diff
    const diffEngine = new DiffEngine();
    const diffResult = diffEngine.generateDiff(parsed, existingData);

    console.log('[Import Execute] Diff:', diffResult.summary);

    // Step 5: Execute import with snapshot
    const importService = new ImportService();
    const importResult = await importService.executeImport(
      parsed,
      diffResult,
      {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        // MVP: Single tenant, no user tracking
      }
    );

    const executionTime = Date.now() - startTime;

    console.log('[Import Execute] Success:', {
      importId: importResult.importId,
      changes: importResult.summary.totalChanges,
      time: executionTime,
    });

    return NextResponse.json({
      success: true,
      importId: importResult.importId,
      summary: importResult.summary,
      executionTime,
    });

  } catch (error: any) {
    console.error('[Import Execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute import'
      },
      { status: 500 }
    );
  }
}
