// ============================================================================
// Import History API - List import history
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { requireAuth } from '@/lib/api/auth-helpers';

/**
 * GET /api/admin/import/history
 *
 * Returns list of import history records, sorted by most recent first.
 * Optionally filter by limit (default 10, max 100).
 *
 * Query params:
 * - limit: number (default 10, max 100)
 *
 * Response: {
 *   data: ImportHistoryRecord[],
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10'),
      100
    );

    console.log('[Import History] Fetching last', limit, 'imports');

    const { data, error, count } = await supabase
      .from('import_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Format response
    const formattedData = data?.map((record) => ({
      id: record.id,
      fileName: record.file_name,
      fileSize: record.file_size_bytes,
      rowsImported: record.rows_imported,
      importSummary: record.import_summary,
      createdAt: record.created_at,
      importedBy: record.imported_by,
      hasSnapshot: !!record.snapshot_data,
      snapshotSize: record.snapshot_data ?
        JSON.stringify(record.snapshot_data).length : 0,
    })) || [];

    console.log('[Import History] Found', formattedData.length, 'records');

    return NextResponse.json({
      data: formattedData,
      count: count || 0,
    });

  } catch (error: any) {
    console.error('[Import History] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch import history' },
      { status: 500 }
    );
  }
}
