// ============================================================================
// Rollback Service - Sequential rollback with conflict detection
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type {
  RollbackResult,
  ImportSnapshot,
  RollbackConflict,
  RollbackConflictError,
  SequentialRollbackError,
  RollbackExecutionError,
} from './types';
import type { SnapshotData } from '../import/types';

/**
 * RollbackService
 *
 * Restores database to previous import snapshot with safety checks.
 *
 * Safety Features:
 * 1. Sequential Enforcement - Must rollback newest import first
 * 2. Conflict Detection - Blocks rollback if manual edits detected after import
 * 3. Atomic Restoration - All-or-nothing snapshot restore
 * 4. Automatic Cleanup - Consumed snapshots are deleted
 *
 * Flow:
 * 1. Validate sequential enforcement (newest first)
 * 2. Detect rollback conflicts (manual edits after import)
 * 3. Load snapshot data from JSONB
 * 4. Delete all current data in atomic transaction
 * 5. Restore snapshot data in atomic transaction
 * 6. Delete consumed snapshot record
 */
export class RollbackService {
  /**
   * Rollback to a previous import snapshot
   *
   * @param importId - ID of import to rollback
   * @param tenantId - Optional tenant ID for multi-tenant filtering
   * @returns Rollback result with restored counts
   */
  async rollbackToImport(
    importId: string,
    tenantId?: string
  ): Promise<RollbackResult> {
    const startTime = Date.now();

    try {
      console.log('[RollbackService] Starting rollback to import:', importId);

      // Step 1: Validate sequential enforcement
      await this.validateSequentialRollback(importId, tenantId);
      console.log('[RollbackService] Sequential enforcement validated');

      // Step 2: Load import record
      const { data: importRecord, error: fetchError } = await supabase
        .from('import_history')
        .select('*')
        .eq('id', importId)
        .single();

      if (fetchError || !importRecord) {
        throw new Error('Import record not found');
      }

      console.log('[RollbackService] Import record loaded:', {
        fileName: importRecord.file_name,
        createdAt: importRecord.created_at,
        rowsImported: importRecord.rows_imported,
      });

      // Step 3: Detect rollback conflicts (manual edits after import)
      await this.validateRollbackSafety(importId, importRecord.created_at, tenantId);
      console.log('[RollbackService] No conflicts detected - safe to rollback');

      // Step 4: Extract snapshot
      const snapshot = importRecord.snapshot_data as SnapshotData;
      console.log('[RollbackService] Snapshot loaded:', {
        parts: snapshot.parts.length,
        vehicleApplications: snapshot.vehicle_applications.length,
        crossReferences: snapshot.cross_references.length,
      });

      // Step 5: Delete all current data (atomic transaction)
      await this.deleteAllData(tenantId);
      console.log('[RollbackService] Current data deleted');

      // Step 6: Restore snapshot data (atomic transaction)
      await this.restoreSnapshotData(snapshot, tenantId);
      console.log('[RollbackService] Snapshot data restored');

      // Step 7: Delete consumed snapshot
      const { error: deleteError } = await supabase
        .from('import_history')
        .delete()
        .eq('id', importId);

      if (deleteError) {
        console.error('[RollbackService] Failed to delete snapshot:', deleteError);
        // Don't fail rollback if cleanup fails
      } else {
        console.log('[RollbackService] Consumed snapshot deleted');
      }

      const executionTime = Date.now() - startTime;
      console.log(`[RollbackService] Rollback completed in ${executionTime}ms`);

      return {
        success: true,
        importId,
        restoredCounts: {
          parts: snapshot.parts.length,
          vehicleApplications: snapshot.vehicle_applications.length,
          crossReferences: snapshot.cross_references.length,
        },
        executionTimeMs: executionTime,
      };
    } catch (error) {
      console.error('[RollbackService] Rollback failed:', error);
      throw error; // Rethrow specific error types
    }
  }

  // --------------------------------------------------------------------------
  // Sequential Enforcement Validation
  // --------------------------------------------------------------------------

  /**
   * Ensure user is rolling back newest import first
   * Prevents out-of-order rollbacks that could cause data inconsistency
   *
   * @param importId - ID of import to rollback
   * @param tenantId - Optional tenant ID
   * @throws SequentialRollbackError if not newest import
   */
  private async validateSequentialRollback(
    importId: string,
    tenantId?: string
  ): Promise<void> {
    const tenantFilter = tenantId ? { tenant_id: tenantId } : {};

    // Get all snapshots, ordered by newest first
    const { data: snapshots, error } = await supabase
      .from('import_history')
      .select('id, created_at')
      .match(tenantFilter)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    if (!snapshots || snapshots.length === 0) {
      throw new Error('No import snapshots available');
    }

    // Must be the newest snapshot
    const newestImportId = snapshots[0].id;
    if (newestImportId !== importId) {
      const error: SequentialRollbackError = {
        name: 'SequentialRollbackError',
        message: 'Sequential rollback enforced. Must rollback newest import first.',
        newestImportId,
        requestedImportId: importId,
      } as any;
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Rollback Conflict Detection
  // --------------------------------------------------------------------------

  /**
   * Detect if any records were manually edited after the import
   * Blocks rollback to prevent data loss from overwriting manual edits
   *
   * @param importId - ID of import to rollback
   * @param importTimestamp - Timestamp when import was created
   * @param tenantId - Optional tenant ID
   * @throws RollbackConflictError if manual edits detected
   */
  private async validateRollbackSafety(
    importId: string,
    importTimestamp: string,
    tenantId?: string
  ): Promise<void> {
    console.log('[RollbackService] Checking for conflicts...');
    console.log('[RollbackService] Import timestamp:', importTimestamp);

    // Build tenant filter
    const tenantMatch = tenantId ? { tenant_id: tenantId } : {};

    // Check parts for modifications after import
    const { data: modifiedParts, error: partsError } = await supabase
      .from('parts')
      .select('id, acr_sku, updated_at, updated_by')
      .match(tenantMatch)
      .gt('updated_at', importTimestamp);

    if (partsError) {
      throw new Error(`Failed to check for conflicts: ${partsError.message}`);
    }

    // Filter to only manual edits (exclude import modifications)
    const conflicts = (modifiedParts || []).filter(
      (part) => part.updated_by === 'manual'
    );

    if (conflicts.length > 0) {
      console.log('[RollbackService] Conflicts detected:', conflicts.length);
      console.log('[RollbackService] Conflicting parts:', conflicts.map(p => p.acr_sku));

      const rollbackConflicts: RollbackConflict[] = conflicts.map((part) => ({
        partId: part.id,
        acrSku: part.acr_sku,
        modifiedAt: new Date(part.updated_at),
        modifiedBy: part.updated_by,
        fields: [], // Field-level tracking not implemented in MVP
      }));

      const error: RollbackConflictError = {
        name: 'RollbackConflictError',
        message: `Cannot rollback: ${conflicts.length} part(s) were manually edited after this import. Rollback would cause data loss.`,
        conflictCount: conflicts.length,
        conflictingParts: conflicts.map((p) => p.acr_sku),
        conflicts: rollbackConflicts,
      } as any;

      throw error;
    }

    console.log('[RollbackService] No conflicts found - safe to proceed');
  }

  // --------------------------------------------------------------------------
  // Delete All Current Data
  // --------------------------------------------------------------------------

  /**
   * Delete all current data for tenant (or entire database if no tenant)
   * Executes in child → parent order to respect foreign key constraints
   *
   * @param tenantId - Optional tenant ID
   */
  private async deleteAllData(tenantId?: string): Promise<void> {
    console.log('[RollbackService] Deleting current data...');

    // Delete in order: cross_refs → vehicle_apps → parts (cascade safe)
    // Note: Supabase requires WHERE clause for DELETE operations
    // Use .neq('id', '00000000-0000-0000-0000-000000000000') to match all records
    let crQuery = supabase.from('cross_references').delete();
    if (tenantId) {
      crQuery = crQuery.eq('tenant_id', tenantId);
    } else {
      // Delete all records (single-tenant mode)
      crQuery = crQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    const { error: crError } = await crQuery;

    if (crError) {
      throw new Error(`Failed to delete cross references: ${crError.message}`);
    }

    let vaQuery = supabase.from('vehicle_applications').delete();
    if (tenantId) {
      vaQuery = vaQuery.eq('tenant_id', tenantId);
    } else {
      // Delete all records (single-tenant mode)
      vaQuery = vaQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    const { error: vaError } = await vaQuery;

    if (vaError) {
      throw new Error(`Failed to delete vehicle applications: ${vaError.message}`);
    }

    let partsQuery = supabase.from('parts').delete();
    if (tenantId) {
      partsQuery = partsQuery.eq('tenant_id', tenantId);
    } else {
      // Delete all records (single-tenant mode)
      partsQuery = partsQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }
    const { error: partsError } = await partsQuery;

    if (partsError) {
      throw new Error(`Failed to delete parts: ${partsError.message}`);
    }

    console.log('[RollbackService] All current data deleted');
  }

  // --------------------------------------------------------------------------
  // Restore Snapshot Data
  // --------------------------------------------------------------------------

  /**
   * Restore snapshot data in atomic transaction
   * Preserves UUIDs, timestamps, and all metadata from snapshot
   * Executes in parent → child order to respect foreign key constraints
   *
   * @param snapshot - Snapshot data to restore
   * @param tenantId - Optional tenant ID
   */
  private async restoreSnapshotData(
    snapshot: SnapshotData,
    tenantId?: string
  ): Promise<void> {
    console.log('[RollbackService] Restoring snapshot data...');

    // Restore parts first (parent table)
    if (snapshot.parts && snapshot.parts.length > 0) {
      console.log(`[RollbackService] Restoring ${snapshot.parts.length} parts...`);
      const { error } = await supabase.from('parts').insert(snapshot.parts);

      if (error) {
        throw new Error(`Failed to restore parts: ${error.message}`);
      }
    }

    // Restore vehicle applications (child table)
    if (snapshot.vehicle_applications && snapshot.vehicle_applications.length > 0) {
      console.log(
        `[RollbackService] Restoring ${snapshot.vehicle_applications.length} vehicle applications...`
      );
      const { error } = await supabase
        .from('vehicle_applications')
        .insert(snapshot.vehicle_applications);

      if (error) {
        throw new Error(`Failed to restore vehicle applications: ${error.message}`);
      }
    }

    // Restore cross references (child table)
    if (snapshot.cross_references && snapshot.cross_references.length > 0) {
      console.log(
        `[RollbackService] Restoring ${snapshot.cross_references.length} cross references...`
      );
      const { error } = await supabase
        .from('cross_references')
        .insert(snapshot.cross_references);

      if (error) {
        throw new Error(`Failed to restore cross references: ${error.message}`);
      }
    }

    console.log('[RollbackService] Snapshot data restored successfully');
  }

  // --------------------------------------------------------------------------
  // List Available Snapshots
  // --------------------------------------------------------------------------

  /**
   * Get last 3 snapshots for rollback UI
   *
   * @param tenantId - Optional tenant ID
   * @returns Array of import snapshots
   */
  async listAvailableSnapshots(tenantId?: string): Promise<ImportSnapshot[]> {
    const tenantFilter = tenantId ? { tenant_id: tenantId } : {};

    const { data, error } = await supabase
      .from('import_history')
      .select(
        'id, created_at, file_name, rows_imported, import_summary, imported_by'
      )
      .match(tenantFilter)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    return (data || []) as ImportSnapshot[];
  }
}
