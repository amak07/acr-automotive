// ============================================================================
// Import Rollback API Route
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { RollbackService } from '@/services/excel/rollback/RollbackService';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * POST /api/admin/import/rollback
 *
 * Rollback to a previous import snapshot
 *
 * Request Body:
 * {
 *   "importId": "uuid-of-import-to-rollback"
 * }
 *
 * Response (Success):
 * {
 *   "success": true,
 *   "importId": "uuid",
 *   "restoredCounts": {
 *     "parts": 877,
 *     "vehicleApplications": 1000,
 *     "crossReferences": 1000
 *   },
 *   "executionTimeMs": 1234
 * }
 *
 * Response (Error - Sequential):
 * {
 *   "success": false,
 *   "error": "SequentialRollbackError",
 *   "message": "Must rollback newest import first",
 *   "newestImportId": "uuid"
 * }
 *
 * Response (Error - Conflicts):
 * {
 *   "success": false,
 *   "error": "RollbackConflictError",
 *   "message": "Cannot rollback: 5 part(s) were manually edited",
 *   "conflictCount": 5,
 *   "conflictingParts": ["ACR123", "ACR456", ...]
 * }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const startTime = Date.now();

  try {
    console.log('[Import Rollback] Starting rollback request...');

    // Parse request body
    const body = await request.json();
    const { importId } = body;

    if (!importId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing importId in request body'
        },
        { status: 400 }
      );
    }

    console.log('[Import Rollback] Import ID:', importId);

    // Execute rollback
    const rollbackService = new RollbackService();
    const result = await rollbackService.rollbackToImport(importId);

    const totalTime = Date.now() - startTime;
    console.log('[Import Rollback] Success:', {
      importId: result.importId,
      partsRestored: result.restoredCounts.parts,
      totalTime,
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Import Rollback] Error:', error);

    // Handle specific error types
    if (error.name === 'SequentialRollbackError') {
      return NextResponse.json(
        {
          success: false,
          error: 'SequentialRollbackError',
          message: error.message,
          newestImportId: error.newestImportId,
        },
        { status: 409 } // Conflict
      );
    }

    if (error.name === 'RollbackConflictError') {
      return NextResponse.json(
        {
          success: false,
          error: 'RollbackConflictError',
          message: error.message,
          conflictCount: error.conflictCount,
          conflictingParts: error.conflictingParts,
        },
        { status: 409 } // Conflict
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to rollback import'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/import/rollback
 *
 * List available snapshots for rollback
 *
 * Response:
 * {
 *   "snapshots": [
 *     {
 *       "id": "uuid",
 *       "created_at": "2025-10-29T...",
 *       "file_name": "test-quarterly.xlsx",
 *       "rows_imported": 53,
 *       "import_summary": { "adds": 50, "updates": 3, "deletes": 0 }
 *     },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    console.log('[Import Rollback] Fetching available snapshots...');

    const rollbackService = new RollbackService();
    const snapshots = await rollbackService.listAvailableSnapshots();

    console.log('[Import Rollback] Found snapshots:', snapshots.length);

    return NextResponse.json({ snapshots });

  } catch (error: any) {
    console.error('[Import Rollback] Error fetching snapshots:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch snapshots'
      },
      { status: 500 }
    );
  }
}
