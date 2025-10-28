// ============================================================================
// Import Service - Execute validated import with snapshot creation
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import { BulkOperationsService } from '@/services/bulk-operations/BulkOperationsService';
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
 * 2. Execute bulk operations using BulkOperationsService
 * 3. Save import history record
 * 4. Cleanup old snapshots (keep last 3, automatic via trigger)
 *
 * Note on Atomicity:
 * - Snapshot creation is separate transaction (must succeed first)
 * - Bulk operations use BulkOperationsService (per-table atomic, not cross-table)
 * - Import history save is separate transaction
 * - True multi-table atomicity deferred to future enhancement
 */
export class ImportService {
  private bulkService: BulkOperationsService;

  constructor() {
    this.bulkService = new BulkOperationsService();
  }

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
  // Bulk Operations Execution
  // --------------------------------------------------------------------------

  /**
   * Execute all bulk operations in correct order
   *
   * Order matters for foreign key constraints:
   * 1. Delete child tables first (cross_refs, vehicle_apps)
   * 2. Delete parent table last (parts)
   * 3. Add parent table first (parts)
   * 4. Add child tables last (vehicle_apps, cross_refs)
   * 5. Update in any order (foreign keys already exist)
   *
   * Note: Each BulkOperationsService method is atomic within its table,
   * but cross-table atomicity is not guaranteed in MVP.
   *
   * @param diff - Diff result with changes to apply
   * @param tenantId - Optional tenant ID
   */
  private async executeBulkOperations(
    diff: DiffResult,
    tenantId?: string
  ): Promise<void> {
    console.log('[ImportService] Executing bulk operations...');

    // === PHASE 1: DELETES (child → parent order) ===

    // Delete cross references first (child table)
    if (diff.crossReferences.deletes.length > 0) {
      console.log(`[ImportService] Deleting ${diff.crossReferences.deletes.length} cross references...`);
      const ids = diff.crossReferences.deletes
        .map((d) => d.before?._id)
        .filter((id): id is string => Boolean(id));

      if (ids.length > 0) {
        const result = await this.bulkService.deleteCrossReferences(ids);
        if (!result.success) {
          throw new Error(
            `Failed to delete cross references: ${result.errors?.[0]?.message}`
          );
        }
      }
    }

    // Delete vehicle applications (child table)
    if (diff.vehicleApplications.deletes.length > 0) {
      console.log(`[ImportService] Deleting ${diff.vehicleApplications.deletes.length} vehicle applications...`);
      const ids = diff.vehicleApplications.deletes
        .map((d) => d.before?._id)
        .filter((id): id is string => Boolean(id));

      if (ids.length > 0) {
        const result = await this.bulkService.deleteVehicleApplications(ids);
        if (!result.success) {
          throw new Error(
            `Failed to delete vehicle applications: ${result.errors?.[0]?.message}`
          );
        }
      }
    }

    // Delete parts last (parent table)
    if (diff.parts.deletes.length > 0) {
      console.log(`[ImportService] Deleting ${diff.parts.deletes.length} parts...`);
      const ids = diff.parts.deletes
        .map((d) => d.before?._id)
        .filter((id): id is string => Boolean(id));

      if (ids.length > 0) {
        const result = await this.bulkService.deleteParts(ids);
        if (!result.success) {
          throw new Error(`Failed to delete parts: ${result.errors?.[0]?.message}`);
        }
      }
    }

    // === PHASE 2: ADDS (parent → child order) ===

    // Add parts first (parent table)
    if (diff.parts.adds.length > 0) {
      console.log(`[ImportService] Adding ${diff.parts.adds.length} parts...`);
      const data = diff.parts.adds.map((d) => d.row!);

      // Map Excel format to database format
      const partsForDb = data.map((part) => ({
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        position_type: part.position_type,
        abs_type: part.abs_type,
        bolt_pattern: part.bolt_pattern,
        drive_type: part.drive_type,
        specifications: part.specifications,
        // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
      }));

      const result = await this.bulkService.createParts(partsForDb as any);
      if (!result.success) {
        throw new Error(`Failed to create parts: ${result.errors?.[0]?.message}`);
      }
    }

    // Add vehicle applications (child table)
    if (diff.vehicleApplications.adds.length > 0) {
      console.log(`[ImportService] Adding ${diff.vehicleApplications.adds.length} vehicle applications...`);
      const data = diff.vehicleApplications.adds.map((d) => d.row!);

      const vasForDb = data.map((va) => ({
        part_id: va._part_id!,
        make: va.make,
        model: va.model,
        start_year: va.start_year,
        end_year: va.end_year,
        // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
      }));

      const result = await this.bulkService.createVehicleApplications(vasForDb as any);
      if (!result.success) {
        throw new Error(
          `Failed to create vehicle applications: ${result.errors?.[0]?.message}`
        );
      }
    }

    // Add cross references (child table)
    if (diff.crossReferences.adds.length > 0) {
      console.log(`[ImportService] Adding ${diff.crossReferences.adds.length} cross references...`);
      const data = diff.crossReferences.adds.map((d) => d.row!);

      const crsForDb = data.map((cr) => ({
        acr_part_id: cr._acr_part_id!,
        competitor_brand: cr.competitor_brand,
        competitor_sku: cr.competitor_sku,
        // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
      }));

      const result = await this.bulkService.createCrossReferences(crsForDb as any);
      if (!result.success) {
        throw new Error(
          `Failed to create cross references: ${result.errors?.[0]?.message}`
        );
      }
    }

    // === PHASE 3: UPDATES (any order, foreign keys exist) ===

    // Update parts
    if (diff.parts.updates.length > 0) {
      console.log(`[ImportService] Updating ${diff.parts.updates.length} parts...`);
      const data = diff.parts.updates.map((d) => {
        const row = d.after!;
        return {
          id: row._id!,
          acr_sku: row.acr_sku,
          part_type: row.part_type,
          position_type: row.position_type,
          abs_type: row.abs_type,
          bolt_pattern: row.bolt_pattern,
          drive_type: row.drive_type,
          specifications: row.specifications,
          // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
        };
      });

      const result = await this.bulkService.updateParts(data as any);
      if (!result.success) {
        throw new Error(`Failed to update parts: ${result.errors?.[0]?.message}`);
      }
    }

    // Update vehicle applications
    if (diff.vehicleApplications.updates.length > 0) {
      console.log(`[ImportService] Updating ${diff.vehicleApplications.updates.length} vehicle applications...`);
      const data = diff.vehicleApplications.updates.map((d) => {
        const row = d.after!;
        return {
          id: row._id!,
          part_id: row._part_id!,
          make: row.make,
          model: row.model,
          start_year: row.start_year,
          end_year: row.end_year,
          // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
        };
      });

      const result = await this.bulkService.updateVehicleApplications(data as any);
      if (!result.success) {
        throw new Error(
          `Failed to update vehicle applications: ${result.errors?.[0]?.message}`
        );
      }
    }

    // Update cross references
    if (diff.crossReferences.updates.length > 0) {
      console.log(`[ImportService] Updating ${diff.crossReferences.updates.length} cross references...`);
      const data = diff.crossReferences.updates.map((d) => {
        const row = d.after!;
        return {
          id: row._id!,
          acr_part_id: row._acr_part_id!,
          competitor_brand: row.competitor_brand,
          competitor_sku: row.competitor_sku,
          // Note: updated_by defaults to 'manual' in DB, updated_at auto-set by trigger
        };
      });

      const result = await this.bulkService.updateCrossReferences(data as any);
      if (!result.success) {
        throw new Error(
          `Failed to update cross references: ${result.errors?.[0]?.message}`
        );
      }
    }

    console.log('[ImportService] All bulk operations completed successfully');
  }
}
