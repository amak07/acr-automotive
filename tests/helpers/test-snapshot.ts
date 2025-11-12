/**
 * Test Database Snapshot Utilities
 *
 * Thin wrapper around existing ImportService and RollbackService
 * to provide test-specific snapshot/restore functionality.
 *
 * This leverages production-grade snapshot capabilities without
 * duplicating code.
 */

import { ImportService } from '../../src/services/excel/import/ImportService';
import { RollbackService } from '../../src/services/excel/rollback/RollbackService';
import { getTestClient } from '../setup/test-client';
import type { SupabaseClient } from '@supabase/supabase-js';

const TEST_SNAPSHOT_MARKER = '__TEST_DEV_SNAPSHOT__';

/**
 * Create a snapshot of current database state for test isolation
 *
 * Uses ImportService.createSnapshot() to capture current state,
 * then saves to import_history with a special marker.
 *
 * @returns Import ID that can be used to restore later
 */
export async function createTestSnapshot(): Promise<string> {
  const supabase = getTestClient();
  const importService = new ImportService(supabase);

  // Create snapshot of current database state
  const snapshotData = await (importService as any).createSnapshot();

  // Save to import_history with test marker
  const { data, error } = await supabase
    .from('import_history')
    .insert({
      file_name: TEST_SNAPSHOT_MARKER,
      file_size: 0,
      uploaded_at: new Date().toISOString(),
      snapshot_data: snapshotData,
      summary: {
        totalAdds: 0,
        totalUpdates: 0,
        totalDeletes: 0,
        totalUnchanged: snapshotData.parts.length,
        totalChanges: 0,
        changesBySheet: {
          parts: 0,
          vehicleApplications: 0,
          crossReferences: 0,
        },
      },
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test snapshot: ${error.message}`);
  }

  return data!.id;
}

/**
 * Restore database to a previous snapshot state
 *
 * Uses RollbackService.rollbackToImport() to restore state.
 * Handles atomic transactions and FK constraints.
 *
 * @param snapshotId - Import ID from createTestSnapshot()
 */
export async function restoreTestSnapshot(snapshotId: string): Promise<void> {
  const supabase = getTestClient();
  const rollbackService = new RollbackService(supabase);

  try {
    await rollbackService.rollbackToImport(snapshotId);
  } catch (error: any) {
    throw new Error(`Failed to restore test snapshot: ${error.message}`);
  }
}

/**
 * Clean up test snapshot from import_history
 *
 * @param snapshotId - Import ID to delete
 */
export async function deleteTestSnapshot(snapshotId: string): Promise<void> {
  const supabase = getTestClient();

  const { error } = await supabase
    .from('import_history')
    .delete()
    .eq('id', snapshotId)
    .eq('file_name', TEST_SNAPSHOT_MARKER); // Safety: only delete test snapshots

  if (error) {
    console.warn(`Warning: Failed to delete test snapshot ${snapshotId}:`, error.message);
    // Non-fatal - cleanup failure shouldn't break tests
  }
}

/**
 * Wrapper for running a test function with automatic snapshot/restore
 *
 * Example:
 * ```typescript
 * await withDatabaseSnapshot(async () => {
 *   // Your test code that modifies the database
 *   await supabase.from('parts').insert(...);
 *   // Database will be restored after this function completes
 * });
 * ```
 */
export async function withDatabaseSnapshot<T>(
  testFn: () => Promise<T>
): Promise<T> {
  const snapshotId = await createTestSnapshot();

  try {
    return await testFn();
  } finally {
    await restoreTestSnapshot(snapshotId);
    await deleteTestSnapshot(snapshotId);
  }
}
