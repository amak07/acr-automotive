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
import { getTestClient } from '../setup/test-client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Marker used to identify test snapshots in import_history table.
 * Exported so test cleanup functions can preserve these snapshots.
 */
export const TEST_SNAPSHOT_MARKER = '__TEST_DEV_SNAPSHOT__';

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
      file_size_bytes: 0,
      rows_imported: snapshotData.parts.length,
      snapshot_data: snapshotData,
      import_summary: {
        adds: 0,
        updates: 0,
        deletes: 0,
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
 * Directly restores snapshot data without production safety validations
 * (sequential enforcement, conflict detection) since test snapshots are
 * isolated and don't need these checks.
 *
 * @param snapshotId - Import ID from createTestSnapshot()
 */
export async function restoreTestSnapshot(snapshotId: string): Promise<void> {
  const supabase = getTestClient();

  try {
    // Fetch snapshot data
    const { data: snapshots, error: fetchError } = await supabase
      .from('import_history')
      .select('snapshot_data')
      .eq('id', snapshotId)
      .eq('file_name', TEST_SNAPSHOT_MARKER);

    if (fetchError) {
      throw new Error(`Failed to fetch snapshot: ${fetchError.message}`);
    }

    if (!snapshots || snapshots.length === 0) {
      throw new Error('Snapshot not found - may have been deleted by tests');
    }

    const snapshot = snapshots[0];

    const snapshotData = snapshot.snapshot_data;

    // Delete all current data (in reverse FK order)
    await supabase.from('cross_references').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicle_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('parts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Restore snapshot data (in FK order)
    if (snapshotData.parts && snapshotData.parts.length > 0) {
      const { error } = await supabase.from('parts').insert(snapshotData.parts);
      if (error) throw new Error(`Failed to restore parts: ${error.message}`);
    }

    if (snapshotData.vehicle_applications && snapshotData.vehicle_applications.length > 0) {
      const { error } = await supabase.from('vehicle_applications').insert(snapshotData.vehicle_applications);
      if (error) throw new Error(`Failed to restore vehicle_applications: ${error.message}`);
    }

    if (snapshotData.cross_references && snapshotData.cross_references.length > 0) {
      const { error } = await supabase.from('cross_references').insert(snapshotData.cross_references);
      if (error) throw new Error(`Failed to restore cross_references: ${error.message}`);
    }
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
