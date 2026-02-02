// ============================================================================
// Import Service - Execute validated import with snapshot creation
// ============================================================================

import { supabase as defaultSupabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiffResult } from "../diff/types";
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelAliasRow,
} from "../shared/types";
import type { ImportResult, ImportMetadata, SnapshotData } from "./types";
import { IMAGE_VIEW_TYPE_MAP } from "../shared/constants";

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
  private supabase: SupabaseClient;

  /**
   * Create a new ImportService
   * @param supabaseClient - Optional Supabase client (defaults to anon key client for production)
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || defaultSupabase;
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
      console.log("[ImportService] Starting import execution...");
      console.log("[ImportService] Changes:", diff.summary);

      // Step 1: Create snapshot (before making changes)
      const snapshot = await this.createSnapshot(metadata.tenantId);
      console.log("[ImportService] Pre-import snapshot created");

      // Step 2: Execute bulk operations
      await this.executeBulkOperations(diff, metadata.tenantId);
      console.log("[ImportService] Bulk operations completed");

      // Step 3: Process image URLs from parts (Phase 3B)
      const imageStats = await this.processImageUrls(
        parsed.parts.data,
        metadata.tenantId
      );
      console.log("[ImportService] Image URLs processed:", imageStats);

      // Step 4: Process vehicle aliases if sheet is present (Phase 4A)
      if (parsed.aliases && parsed.aliases.data.length > 0) {
        const aliasStats = await this.processAliases(parsed.aliases.data);
        console.log("[ImportService] Vehicle aliases processed:", aliasStats);
      }

      const executionTime = Date.now() - startTime;
      console.log(`[ImportService] Total execution time: ${executionTime}ms`);

      // Step 4: Save import history
      const { data: historyRecords, error: historyError } = await this.supabase
        .from("import_history")
        .insert({
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
        })
        .select();

      if (historyError || !historyRecords || historyRecords.length === 0) {
        throw new Error(
          `Failed to save import history: ${historyError?.message || "No record returned"}`
        );
      }

      const historyRecord = historyRecords[0];

      console.log("[ImportService] Import history saved:", historyRecord.id);
      console.log("[ImportService] Auto-cleanup will keep last 3 snapshots");

      return {
        success: true,
        importId: historyRecord.id,
        summary: diff.summary,
        executionTimeMs: executionTime,
      };
    } catch (error) {
      console.error("[ImportService] Import failed:", error);

      // Rethrow with context
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
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
      // Build queries with optional tenant filter
      let partsQuery = this.supabase.from("parts").select("*");
      let vehicleAppsQuery = this.supabase
        .from("vehicle_applications")
        .select("*");
      let crossRefsQuery = this.supabase.from("cross_references").select("*");

      // Apply tenant filter only if tenantId provided
      if (tenantId) {
        partsQuery = partsQuery.eq("tenant_id", tenantId);
        vehicleAppsQuery = vehicleAppsQuery.eq("tenant_id", tenantId);
        crossRefsQuery = crossRefsQuery.eq("tenant_id", tenantId);
      }

      // Fetch all data in parallel
      const [partsResult, vehicleAppsResult, crossRefsResult] =
        await Promise.all([partsQuery, vehicleAppsQuery, crossRefsQuery]);

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

      console.log("[ImportService] Snapshot stats:", {
        parts: snapshot.parts.length,
        vehicle_applications: snapshot.vehicle_applications.length,
        cross_references: snapshot.cross_references.length,
      });

      return snapshot;
    } catch (error) {
      console.error("[ImportService] Snapshot creation failed:", error);
      throw new Error(
        `Snapshot creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
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
    console.log("[ImportService] Executing atomic import transaction...");

    // Format parts data for PostgreSQL function
    const partsToAdd = diff.parts.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id || crypto.randomUUID(), // Generate UUID for new parts without IDs
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
        updated_by: "import",
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
        updated_by: "import",
      };
    });

    // Format vehicle applications data
    const vehiclesToAdd = diff.vehicleApplications.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id || crypto.randomUUID(), // Generate UUID for new vehicle apps without IDs
        tenant_id: tenantId || null,
        part_id: row._part_id,
        make: row.make,
        model: row.model,
        start_year: row.start_year,
        end_year: row.end_year,
        updated_by: "import",
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
        updated_by: "import",
      };
    });

    // Format cross references data
    const crossRefsToAdd = diff.crossReferences.adds.map((d) => {
      const row = d.row!;
      return {
        id: row._id || crypto.randomUUID(), // Generate UUID for new cross-refs without IDs
        tenant_id: tenantId || null,
        acr_part_id: row._acr_part_id,
        competitor_brand: row.competitor_brand,
        competitor_sku: row.competitor_sku,
        updated_by: "import",
      };
    });

    const crossRefsToUpdate = diff.crossReferences.updates.map((d) => {
      const row = d.after!;
      return {
        id: row._id,
        acr_part_id: row._acr_part_id,
        competitor_brand: row.competitor_brand,
        competitor_sku: row.competitor_sku,
        updated_by: "import",
      };
    });

    // Format delete payloads (extract IDs from 'before' records)
    const partsToDelete = diff.parts.deletes.map((d) => ({
      id: d.before!._id,
    }));

    const vehiclesToDelete = diff.vehicleApplications.deletes.map((d) => ({
      id: d.before!._id,
    }));

    const crossRefsToDelete = diff.crossReferences.deletes.map((d) => ({
      id: d.before!._id,
    }));

    console.log("[ImportService] Transaction payload:", {
      partsToAdd: partsToAdd.length,
      partsToUpdate: partsToUpdate.length,
      partsToDelete: partsToDelete.length,
      vehiclesToAdd: vehiclesToAdd.length,
      vehiclesToUpdate: vehiclesToUpdate.length,
      vehiclesToDelete: vehiclesToDelete.length,
      crossRefsToAdd: crossRefsToAdd.length,
      crossRefsToUpdate: crossRefsToUpdate.length,
      crossRefsToDelete: crossRefsToDelete.length,
    });

    // Execute atomic transaction with retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[ImportService] Attempt ${attempt}/${maxRetries}...`);

        const { data, error } = await this.supabase.rpc(
          "execute_atomic_import",
          {
            parts_to_add: partsToAdd,
            parts_to_update: partsToUpdate,
            parts_to_delete: partsToDelete,
            vehicles_to_add: vehiclesToAdd,
            vehicles_to_update: vehiclesToUpdate,
            vehicles_to_delete: vehiclesToDelete,
            cross_refs_to_add: crossRefsToAdd,
            cross_refs_to_update: crossRefsToUpdate,
            cross_refs_to_delete: crossRefsToDelete,
            tenant_id_filter: tenantId || null,
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        // Success! Log results
        const result = data?.[0] || {};
        console.log("[ImportService] Transaction completed successfully:", {
          parts_added: result.parts_added,
          parts_updated: result.parts_updated,
          parts_deleted: result.parts_deleted,
          vehicles_added: result.vehicles_added,
          vehicles_updated: result.vehicles_updated,
          vehicles_deleted: result.vehicles_deleted,
          cross_refs_added: result.cross_refs_added,
          cross_refs_updated: result.cross_refs_updated,
          cross_refs_deleted: result.cross_refs_deleted,
        });

        return; // Success - exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `[ImportService] Attempt ${attempt} failed:`,
          lastError.message
        );

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
    throw lastError || new Error("Transaction failed: Unknown error");
  }

  // --------------------------------------------------------------------------
  // Image URL Processing (Phase 3B)
  // --------------------------------------------------------------------------

  /**
   * Process image URLs from Parts sheet and upsert to part_images table
   *
   * ML-style behavior:
   * - Non-empty URL: Upsert (update if exists, create if new)
   * - Empty URL: Skip (don't delete existing images)
   *
   * @param parts - Parsed parts with image URL columns
   * @param tenantId - Optional tenant ID for multi-tenant filtering
   * @returns Statistics of image operations
   */
  private async processImageUrls(
    parts: ExcelPartRow[],
    tenantId?: string
  ): Promise<{ added: number; updated: number; skipped: number }> {
    const stats = { added: 0, updated: 0, skipped: 0 };

    // Collect all image upserts
    const imagesToUpsert: Array<{
      part_id: string;
      view_type: string;
      image_url: string;
      tenant_id: string | null;
    }> = [];

    for (const part of parts) {
      // Skip parts without IDs (new parts - handle image separately after part creation)
      if (!part._id) continue;

      // Process each image URL column
      for (const [propName, viewType] of Object.entries(IMAGE_VIEW_TYPE_MAP)) {
        const url = part[propName as keyof ExcelPartRow] as string | undefined;

        if (url && url.trim() !== "") {
          imagesToUpsert.push({
            part_id: part._id,
            view_type: viewType,
            image_url: url.trim(),
            tenant_id: tenantId || null,
          });
        } else {
          // Empty URL - skip, don't delete existing
          stats.skipped++;
        }
      }
    }

    if (imagesToUpsert.length === 0) {
      console.log("[ImportService] No image URLs to process");
      return stats;
    }

    console.log(
      `[ImportService] Processing ${imagesToUpsert.length} image URLs...`
    );

    // Upsert images in batches
    const batchSize = 100;
    for (let i = 0; i < imagesToUpsert.length; i += batchSize) {
      const batch = imagesToUpsert.slice(i, i + batchSize);

      const { data, error } = await this.supabase
        .from("part_images")
        .upsert(
          batch.map((img) => ({
            part_id: img.part_id,
            view_type: img.view_type,
            image_url: img.image_url,
            tenant_id: img.tenant_id,
            is_primary: img.view_type === "front", // Front image is primary
            updated_by: "import",
          })),
          {
            onConflict: "part_id,view_type",
            ignoreDuplicates: false,
          }
        )
        .select("id");

      if (error) {
        console.error("[ImportService] Image upsert error:", error);
        throw new Error(`Failed to process image URLs: ${error.message}`);
      }

      // Count results (upsert doesn't tell us add vs update, so count as "processed")
      stats.added += data?.length || 0;
    }

    return stats;
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
      "timeout",
      "network",
      "connection",
      "deadlock",
      "temporary",
      "unavailable",
      "econnrefused",
      "enotfound",
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  // --------------------------------------------------------------------------
  // Vehicle Aliases Processing (Phase 4A)
  // --------------------------------------------------------------------------

  /**
   * Process vehicle aliases from Excel sheet
   *
   * Strategy: Full replace when sheet is present
   * - Delete all existing aliases without _id
   * - Upsert all aliases from Excel
   *
   * This allows Humberto to manage aliases via Excel export/import.
   *
   * @param aliases - Parsed alias rows from Excel
   * @returns Statistics of alias operations
   */
  private async processAliases(
    aliases: ExcelAliasRow[]
  ): Promise<{ added: number; updated: number; deleted: number }> {
    const stats = { added: 0, updated: 0, deleted: 0 };

    if (aliases.length === 0) {
      console.log("[ImportService] No aliases to process");
      return stats;
    }

    console.log(
      `[ImportService] Processing ${aliases.length} vehicle aliases...`
    );

    // Separate aliases with IDs (updates) from those without (adds)
    const aliasesWithIds = aliases.filter((a) => a._id);
    const aliasesWithoutIds = aliases.filter((a) => !a._id);

    // Get existing aliases to identify deletes
    const { data: existingAliases, error: fetchError } = await this.supabase
      .from("vehicle_aliases")
      .select("id");

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing aliases: ${fetchError.message}`
      );
    }

    // Find aliases to delete (in DB but not in Excel)
    const excelIds = new Set(aliasesWithIds.map((a) => a._id));
    const aliasesToDelete = (existingAliases || []).filter(
      (a) => !excelIds.has(a.id)
    );

    // Delete aliases not in Excel (only if we have Excel IDs to compare)
    if (aliasesToDelete.length > 0 && aliasesWithIds.length > 0) {
      const deleteIds = aliasesToDelete.map((a) => a.id);
      const { error: deleteError } = await this.supabase
        .from("vehicle_aliases")
        .delete()
        .in("id", deleteIds);

      if (deleteError) {
        throw new Error(`Failed to delete aliases: ${deleteError.message}`);
      }
      stats.deleted = deleteIds.length;
      console.log(`[ImportService] Deleted ${stats.deleted} aliases`);
    }

    // Upsert aliases with IDs
    if (aliasesWithIds.length > 0) {
      const { error: upsertError } = await this.supabase
        .from("vehicle_aliases")
        .upsert(
          aliasesWithIds.map((a) => ({
            id: a._id,
            alias: a.alias.toLowerCase(),
            canonical_name: a.canonical_name.toUpperCase(),
            alias_type: a.alias_type,
          })),
          { onConflict: "id" }
        );

      if (upsertError) {
        throw new Error(`Failed to upsert aliases: ${upsertError.message}`);
      }
      stats.updated = aliasesWithIds.length;
    }

    // Insert new aliases without IDs
    if (aliasesWithoutIds.length > 0) {
      const { error: insertError } = await this.supabase
        .from("vehicle_aliases")
        .insert(
          aliasesWithoutIds.map((a) => ({
            alias: a.alias.toLowerCase(),
            canonical_name: a.canonical_name.toUpperCase(),
            alias_type: a.alias_type,
          }))
        );

      if (insertError) {
        throw new Error(`Failed to insert new aliases: ${insertError.message}`);
      }
      stats.added = aliasesWithoutIds.length;
    }

    return stats;
  }
}
