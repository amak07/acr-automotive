// ============================================================================
// Rollback Available API - List rollback-able imports (last 3 with snapshots)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/admin/rollback/available
 *
 * Returns the last 3 imports that have snapshots and can be rolled back.
 * Must be rolled back in sequential order (newest first).
 *
 * Response: {
 *   data: RollbackableImport[],
 *   count: number
 * }
 *
 * RollbackableImport {
 *   id: string,
 *   fileName: string,
 *   fileSize: number,
 *   rowsImported: number,
 *   createdAt: string,
 *   importedBy: string | null,
 *   snapshotStats: {
 *     parts: number,
 *     vehicleApplications: number,
 *     crossReferences: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Rollback Available] Fetching rollback-able imports');

    // Fetch last 3 imports with snapshots
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .not('snapshot_data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    // Format response
    const rollbackableImports = data?.map((record) => {
      const snapshot = record.snapshot_data as any;
      return {
        id: record.id,
        fileName: record.file_name,
        fileSize: record.file_size_bytes,
        rowsImported: record.rows_imported,
        createdAt: record.created_at,
        importedBy: record.imported_by,
        snapshotStats: {
          parts: snapshot?.parts?.length || 0,
          vehicleApplications: snapshot?.vehicleApplications?.length || 0,
          crossReferences: snapshot?.crossReferences?.length || 0,
        },
      };
    }) || [];

    console.log('[Rollback Available] Found', rollbackableImports.length, 'rollback-able imports');

    return NextResponse.json({
      data: rollbackableImports,
      count: rollbackableImports.length,
    });

  } catch (error: any) {
    console.error('[Rollback Available] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rollback-able imports' },
      { status: 500 }
    );
  }
}
