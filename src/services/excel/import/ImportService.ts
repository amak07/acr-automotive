// ============================================================================
// Import Service - Execute validated import with snapshot creation
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import type { DiffResult } from '../diff/types';
import type { ParsedExcelFile } from '../shared/types';
import type {
  ImportResult,
  ImportMetadata,
  SnapshotData,
} from './types';

/**
 * ImportService
 *
 * Executes validated imports with snapshot creation for rollback capability.
 *
 * Flow:
 * 1. Create pre-import snapshot (full database dump to JSONB)
 * 2. Execute atomic import transaction (PostgreSQL function)
 * 3. Save import history record
 * 4. Cleanup old snapshots (keep last 3, automatic via trigger)
 *
 * Atomicity:
 * - Snapshot creation is separate transaction (must succeed first)
 * - All import operations execute in single PostgreSQL transaction
 * - If ANY operation fails, ALL changes automatically rollback
 * - Import history save is separate transaction (after successful import)
 * - TRUE multi-table atomicity via execute_atomic_import() function
 */
export class ImportService {

  /**
   * Execute import with snapshot creation and atomic transactions
   *
   * @param parsed - Parsed Excel file data
   * @param diff - Diff result with changes to apply
   * @param metadata - Import metadata (filename, size, user)
   * @returns Import result with importId and summary
   */
  async executeImport(
    parsed: ParsedExcelFile,
    diff: DiffResult,
    metadata: ImportMetadata
  ): Promise<ImportResult> {
    const startTime = Date.now();

    try {
      console.log('[ImportService] Starting import execution...');
      console.log('[ImportService] Changes:', diff.summary);

      // Step 1: Create snapshot (before making changes)
      const snapshot = await this.createSnapshot(metadata.tenantId);
      console.log('[ImportService] Pre-import snapshot created');

      // Step 2: Execute bulk operations
      await this.executeBulkOperations(diff, metadata.tenantId);
      const executionTime = Date.now() - startTime;
      console.log(`[ImportService] Bulk operations completed in ${executionTime}ms`);

      // Step 3: Save import history
      // Note: Using REST API directly to bypass schema cache issues
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const historyPayload = {
        tenant_id: metadata.tenantId || null,
        imported_by: metadata.importedBy || null,
        file_name: metadata.fileName,
        file_size_bytes: metadata.fileSize,
        rows_imported: diff.summary.totalChanges,
        snapshot_data: snapshot,
        import_summary: {
          adds: diff.summary.totalAdds,
          updates: diff.summary.totalUpdates,
          deletes: diff.summary.totalDeletes,
        },
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/import_history`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(historyPayload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save import history: ${error}`);
      }

      const historyRecords = await response.json();
      const historyRecord = historyRecords[0];

      if (!historyRecord) {
        throw new Error('Failed to save import history: No record returned');
      }

      console.log('[ImportService] Import history saved:', historyRecord.id);
      console.log('[ImportService] Auto-cleanup will keep last 3 snapshots');

      return {
        success: true,
        importId: historyRecord.id,
        summary: diff.summary,
        executionTimeMs: executionTime,
      };
    } catch (error) {
      console.error('[ImportService] Import failed:', error);

      // Rethrow with context
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // --------------------------------------------------------------------------
  // Snapshot Creation
  // --------------------------------------------------------------------------

  /**
   * Create full database snapshot as JSONB
   * Captures current state before import for rollback
   *
   * @param tenantId - Optional tenant ID for multi-tenant filtering
   * @returns Complete snapshot of all data
   */
  private async createSnapshot(tenantId?: string): Promise<SnapshotData> {
    try {
      // Build tenant filter
      const tenantFilter = tenantId ? { tenant_id: tenantId } : {};

      // Fetch all data in parallel
      const [partsResult, vehicleAppsResult, crossRefsResult] = await Promise.all([
        supabase.from('parts').select('*').match(tenantFilter),
        supabase.from('vehicle_applications').select('*').match(tenantFilter),
        supabase.from('cross_references').select('*').match(tenantFilter),
      ]);

      // Check for errors
      if (partsResult.error) {
        throw new Error(`Failed to fetch parts: ${partsResult.error.message}`);
      }
      if (vehicleAppsResult.error) {
        throw new Error(
          `Failed to fetch vehicle applications: ${vehicleAppsResult.error.message}`
        );
      }
      if (crossRefsResult.error) {
        throw new Error(
          `Failed to fetch cross references: ${crossRefsResult.error.message}`
        );
      }

      const snapshot: SnapshotData = {
        parts: partsResult.data || [],
        vehicle_applications: vehicleAppsResult.data || [],
        cross_references: crossRefsResult.data || [],
        timestamp: new Date().toISOString(),
      };

      console.log('[ImportService] Snapshot stats:', {
        parts: snapshot.parts.length,
        vehicle_applications: snapshot.vehicle_applications.length,
        cross_references: snapshot.cross_references.length,
      });

      return snapshot;
    } catch (error) {
      console.error('[ImportService] Snapshot creation failed:', error);
      throw new Error(
        `Snapshot creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // --------------------------------------------------------------------------
  // Bulk Operations Execution (Atomic Transaction)
  // --------------------------------------------------------------------------

  /**
   * Execute all bulk operations atomically using PostgreSQL transaction function
   *
   * IMPORTANT: All operations execute within a single database transaction.
   * If ANY operation fails, ALL changes are automatically rolled back.
   * This prevents partial imports that would leave the database inconsistent.
   *
   * The PostgreSQL function handles:
   * - Correct operation ordering (deletes → adds → updates)
   * - Foreign key constraint management
   * - Automatic rollback on ANY error
   * - Cross-table atomicity
   *
   * @param diff - Diff result with changes to apply
   * @param tenantId - Optional tenant ID for multi-tenant filtering
   */
  private async executeBulkOperations(
    diff: DiffResult,
    tenantId?: string
  ): Promise<void> {
    console.log('[ImportService] Executing atomic import transaction...');

    // Format parts data for PostgreSQL function
    const partsToAdd = diff.parts.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id,
        tenant_id: tenantId || null,
        acr_sku: row.acr_sku,
        part_type: row.part_type,
        position_type: row.position_type,
        abs_type: row.abs_type,
        bolt_pattern: row.bolt_pattern,
        drive_type: row.drive_type,
        specifications: row.specifications,
        has_360_viewer: false, // 360 viewer managed separately via admin UI
        viewer_360_frame_count: null,
        updated_by: 'import',
      };
    });

    const partsToUpdate = diff.parts.updates.map((d) => {
      const row = d.after!;
      return {
        id: row._id,
        acr_sku: row.acr_sku,
        part_type: row.part_type,
        position_type: row.position_type,
        abs_type: row.abs_type,
        bolt_pattern: row.bolt_pattern,
        drive_type: row.drive_type,
        specifications: row.specifications,
        has_360_viewer: false, // 360 viewer managed separately via admin UI
        viewer_360_frame_count: null,
        updated_by: 'import',
      };
    });

    // Format vehicle applications data
    const vehiclesToAdd = diff.vehicleApplications.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id,
        tenant_id: tenantId || null,
        part_id: row._part_id,
        make: row.make,
        model: row.model,
        start_year: row.start_year,
        end_year: row.end_year,
        updated_by: 'import',
      };
    });

    const vehiclesToUpdate = diff.vehicleApplications.updates.map((d) => {
      const row = d.after!;
      return {
        id: row._id,
        part_id: row._part_id,
        make: row.make,
        model: row.model,
        start_year: row.start_year,
        end_year: row.end_year,
        updated_by: 'import',
      };
    });

    // Format cross references data
    const crossRefsToAdd = diff.crossReferences.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id,
        tenant_id: tenantId || null,
        acr_part_id: row._acr_part_id,
        competitor_brand: row.competitor_brand,
        competitor_sku: row.competitor_sku,
        updated_by: 'import',
      };
    });

    const crossRefsToUpdate = diff.crossReferences.updates.map((d) => {
      const row = d.after!;
      return {
        id: row._id,
        acr_part_id: row._acr_part_id,
        competitor_brand: row.competitor_brand,
        competitor_sku: row.competitor_sku,
        updated_by: 'import',
      };
    });

    console.log('[ImportService] Transaction payload:', {
      partsToAdd: partsToAdd.length,
      partsToUpdate: partsToUpdate.length,
      vehiclesToAdd: vehiclesToAdd.length,
      vehiclesToUpdate: vehiclesToUpdate.length,
      crossRefsToAdd: crossRefsToAdd.length,
      crossRefsToUpdate: crossRefsToUpdate.length,
    });

    // Execute atomic transaction with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ImportService] Attempt ${attempt}/${maxRetries}...`);

        const { data, error } = await supabase.rpc('execute_atomic_import', {
          parts_to_add: partsToAdd,
          parts_to_update: partsToUpdate,
          vehicles_to_add: vehiclesToAdd,
          vehicles_to_update: vehiclesToUpdate,
          cross_refs_to_add: crossRefsToAdd,
          cross_refs_to_update: crossRefsToUpdate,
          tenant_id_filter: tenantId || null,
        });

        if (error) {
          throw new Error(error.message);
        }

        // Success! Log results
        const result = data?.[0] || {};
        console.log('[ImportService] Transaction completed successfully:', {
          parts_added: result.parts_added,
          parts_updated: result.parts_updated,
          vehicles_added: result.vehicles_added,
          vehicles_updated: result.vehicles_updated,
          cross_refs_added: result.cross_refs_added,
          cross_refs_updated: result.cross_refs_updated,
        });

        return; // Success - exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[ImportService] Attempt ${attempt} failed:`, lastError.message);

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError);
        if (!isRetryable || attempt === maxRetries) {
          throw new Error(
            `Transaction failed after ${attempt} attempt(s): ${lastError.message}`
          );
        }

        // Wait before retry (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[ImportService] Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error('Transaction failed: Unknown error');
  }

  /**
   * Check if database error is retryable
   * Retryable errors: network timeouts, deadlocks, temporary unavailability
   * Non-retryable errors: constraint violations, permission errors
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Retryable conditions
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'deadlock',
      'temporary',
      'unavailable',
      'econnrefused',
      'enotfound',
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }
}
