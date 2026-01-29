// ============================================================================
// Rollback Execute API - Rollback specific import
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { RollbackService } from '@/services/excel/rollback';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * POST /api/admin/rollback/execute
 *
 * Rolls back a specific import to its snapshot state.
 * Enforces sequential rollback (must rollback newest first).
 *
 * Request: {
 *   importId: string
 * }
 *
 * Response: {
 *   success: boolean,
 *   importId: string,
 *   restoredCounts: {
 *     parts: number,
 *     vehicleApplications: number,
 *     crossReferences: number
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
    const body = await request.json();
    const { importId } = body;

    if (!importId) {
      return NextResponse.json(
        { error: 'importId is required' },
        { status: 400 }
      );
    }

    console.log('[Rollback Execute] Starting rollback for import:', importId);

    // Execute rollback
    const rollbackService = new RollbackService();
    const rollbackResult = await rollbackService.rollbackToImport(importId);

    const executionTime = Date.now() - startTime;

    console.log('[Rollback Execute] Success:', {
      importId,
      restoredCounts: rollbackResult.restoredCounts,
      time: executionTime,
    });

    return NextResponse.json({
      success: true,
      importId: rollbackResult.importId,
      restoredCounts: rollbackResult.restoredCounts,
      executionTime,
    });

  } catch (error: any) {
    console.error('[Rollback Execute] Error:', error);

    // Check for specific error types
    if (error.message.includes('Sequential rollback enforcement')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sequential rollback violation',
          message: error.message,
        },
        { status: 409 } // Conflict
      );
    }

    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Import not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute rollback'
      },
      { status: 500 }
    );
  }
}
