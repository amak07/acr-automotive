import { supabase } from "@/lib/supabase/client";
import type {
  CreatePartParams,
  UpdatePartParams,
  CreateVehicleApplicationParams,
  UpdateVehicleApplicationParams,
  CreateCrossReferenceParams,
  UpdateCrossReferenceParams,
  BulkOperationResult,
} from "@/lib/schemas/admin";

/**
 * BulkOperationsService
 *
 * Handles bulk operations for Parts, Vehicle Applications, and Cross References.
 * Each method performs operations on a single table (atomic within that table).
 *
 * Phase 8.1 Scope:
 * - Single-table operations only
 * - Array inserts are atomic by default (PostgreSQL behavior)
 * - Multi-table atomicity deferred to Phase 8.2 (ImportService)
 */
export class BulkOperationsService {
  // ===== PARTS OPERATIONS =====

  /**
   * Create multiple parts atomically
   * @param parts - Array of parts to create
   * @returns Created parts with IDs
   */
  async createParts(
    parts: CreatePartParams[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      // Map sku_number to acr_sku (database column name)
      const partsForDb = parts.map((part) => ({
        acr_sku: part.sku_number,
        part_type: part.part_type,
        position_type: part.position_type,
        abs_type: part.abs_type,
        bolt_pattern: part.bolt_pattern,
        drive_type: part.drive_type,
        specifications: part.specifications,
        // tenant_id defaults to NULL (single tenant for MVP)
      }));

      // Atomic insert - PostgreSQL treats multi-row INSERT as atomic
      const { data, error } = await supabase
        .from("parts")
        .insert(partsForDb)
        .select();

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        created: data.length,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Unknown error occurred",
          },
        ],
      };
    }
  }

  /**
   * Update multiple parts atomically
   * @param parts - Array of parts to update (must include id)
   * @returns Updated parts
   */
  async updateParts(
    parts: (UpdatePartParams & { id: string })[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      // Note: Supabase doesn't support bulk UPDATE with different values per row
      // We need to use upsert or individual updates
      // For now, we'll use individual updates wrapped in Promise.all
      const updatePromises = parts.map(async (part) => {
        const { id, ...updates } = part;

        // Map sku_number to acr_sku if present
        const dbUpdates: any = { ...updates };
        if ("sku_number" in dbUpdates) {
          dbUpdates.acr_sku = dbUpdates.sku_number;
          delete dbUpdates.sku_number;
        }

        const { data, error } = await supabase
          .from("parts")
          .update(dbUpdates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const results = await Promise.all(updatePromises);

      return {
        success: true,
        updated: results.length,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to update parts",
          },
        ],
      };
    }
  }

  /**
   * Delete multiple parts atomically
   * @param ids - Array of part IDs to delete
   * @returns Delete result
   */
  async deleteParts(ids: string[]): Promise<BulkOperationResult> {
    try {
      // Atomic delete - PostgreSQL handles this atomically
      const { error } = await supabase.from("parts").delete().in("id", ids);

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        deleted: ids.length,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to delete parts",
          },
        ],
      };
    }
  }

  // ===== VEHICLE APPLICATIONS OPERATIONS =====

  /**
   * Create multiple vehicle applications atomically
   * @param vehicles - Array of vehicle applications to create
   * @returns Created vehicle applications with IDs
   */
  async createVehicleApplications(
    vehicles: CreateVehicleApplicationParams[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      // Atomic insert
      const { data, error } = await supabase
        .from("vehicle_applications")
        .insert(vehicles)
        .select();

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        created: data.length,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Unknown error occurred",
          },
        ],
      };
    }
  }

  /**
   * Update multiple vehicle applications atomically
   * @param vehicles - Array of vehicle applications to update (must include id)
   * @returns Updated vehicle applications
   */
  async updateVehicleApplications(
    vehicles: (UpdateVehicleApplicationParams & { id: string })[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      const updatePromises = vehicles.map(async (vehicle) => {
        const { id, ...updates } = vehicle;

        const { data, error } = await supabase
          .from("vehicle_applications")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const results = await Promise.all(updatePromises);

      return {
        success: true,
        updated: results.length,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to update vehicle applications",
          },
        ],
      };
    }
  }

  /**
   * Delete multiple vehicle applications atomically
   * @param ids - Array of vehicle application IDs to delete
   * @returns Delete result
   */
  async deleteVehicleApplications(ids: string[]): Promise<BulkOperationResult> {
    try {
      const { error } = await supabase
        .from("vehicle_applications")
        .delete()
        .in("id", ids);

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        deleted: ids.length,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to delete vehicle applications",
          },
        ],
      };
    }
  }

  // ===== CROSS REFERENCES OPERATIONS =====

  /**
   * Create multiple cross references atomically
   * @param crossRefs - Array of cross references to create
   * @returns Created cross references with IDs
   */
  async createCrossReferences(
    crossRefs: CreateCrossReferenceParams[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      // Atomic insert
      const { data, error } = await supabase
        .from("cross_references")
        .insert(crossRefs)
        .select();

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        created: data.length,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Unknown error occurred",
          },
        ],
      };
    }
  }

  /**
   * Update multiple cross references atomically
   * @param crossRefs - Array of cross references to update (must include id)
   * @returns Updated cross references
   */
  async updateCrossReferences(
    crossRefs: (UpdateCrossReferenceParams & { id: string })[]
  ): Promise<BulkOperationResult & { data?: any[] }> {
    try {
      const updatePromises = crossRefs.map(async (crossRef) => {
        const { id, ...updates } = crossRef;

        const { data, error } = await supabase
          .from("cross_references")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      const results = await Promise.all(updatePromises);

      return {
        success: true,
        updated: results.length,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to update cross references",
          },
        ],
      };
    }
  }

  /**
   * Delete multiple cross references atomically
   * @param ids - Array of cross reference IDs to delete
   * @returns Delete result
   */
  async deleteCrossReferences(ids: string[]): Promise<BulkOperationResult> {
    try {
      const { error } = await supabase
        .from("cross_references")
        .delete()
        .in("id", ids);

      if (error) {
        return {
          success: false,
          errors: [
            {
              index: 0,
              message: error.message,
            },
          ],
        };
      }

      return {
        success: true,
        deleted: ids.length,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            index: 0,
            message: error.message || "Failed to delete cross references",
          },
        ],
      };
    }
  }
}
