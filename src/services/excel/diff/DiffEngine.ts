// ============================================================================
// Diff Engine - ID-Based Change Detection
// ============================================================================

import { DiffOperation, DiffItem, SheetDiff, DiffResult } from "./types";
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from "../shared/types";
import type { ExistingDatabaseData } from "../validation/ValidationEngine";
import {
  SHEET_NAMES,
  BRAND_COLUMN_MAP,
  DELETE_MARKER,
  splitCrossRefSkus,
} from "../shared/constants";

// Type for parsed brand column (adds and explicit deletes)
interface ParsedBrandColumn {
  adds: string[];
  deletes: string[];
}

// Type for cross-ref indexed by part_id and composite key (brand+sku)
interface ExistingCrossRefByPart {
  [partId: string]: {
    [compositeKey: string]: ExcelCrossRefRow;
  };
}

// ----------------------------------------------------------------------------
// Diff Engine
// ----------------------------------------------------------------------------

export class DiffEngine {
  /**
   * Normalize optional field values for comparison
   * Treats null, undefined, and empty string as equivalent
   */
  private normalizeOptional(value: any): string | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return String(value);
  }

  /**
   * Parse a brand column value into adds and explicit deletes
   * Format: "SKU1;SKU2;[DELETE]SKU3;SKU4" => { adds: ["SKU1", "SKU2", "SKU4"], deletes: ["SKU3"] }
   * Also supports legacy space-delimited format for backwards compatibility
   */
  private parseBrandColumn(
    value: string | undefined | null
  ): ParsedBrandColumn {
    const result: ParsedBrandColumn = { adds: [], deletes: [] };

    // Use shared helper to split on semicolon or space (legacy)
    const { skus } = splitCrossRefSkus(value);

    for (const sku of skus) {
      if (sku.startsWith(DELETE_MARKER)) {
        // Explicit delete marker
        const deleteSku = sku.substring(DELETE_MARKER.length).trim();
        if (deleteSku) {
          result.deletes.push(deleteSku);
        }
      } else {
        // Regular SKU to add/keep
        result.adds.push(sku);
      }
    }

    return result;
  }

  /**
   * Build a map of existing cross-refs indexed by part_id and composite key (brand+sku)
   */
  private buildExistingCrossRefMap(
    existingCrossRefs: Map<string, ExcelCrossRefRow>
  ): ExistingCrossRefByPart {
    const result: ExistingCrossRefByPart = {};

    existingCrossRefs.forEach((cr) => {
      const partId = cr._acr_part_id || "";
      const brand = (cr.competitor_brand || "").toUpperCase();
      const sku = cr.competitor_sku || "";
      const compositeKey = `${brand}::${sku}`;

      if (!result[partId]) {
        result[partId] = {};
      }
      result[partId][compositeKey] = cr;
    });

    return result;
  }

  /**
   * Generate diff between uploaded file and existing database
   *
   * Phase 3: Cross-references are now in Parts sheet brand columns.
   *
   * For Parts and Vehicle Applications:
   * - ADD: Row has no _id or _id is empty
   * - UPDATE: Row has _id that exists in database and data changed
   * - DELETE: Database has _id that's not in uploaded file
   * - UNCHANGED: Row has _id that exists and data is identical
   *
   * For Cross-References (from brand columns - ML-style safe delete):
   * - ADD: SKU in brand column but not in database for that part+brand
   * - DELETE: SKU prefixed with [DELETE] marker in brand column
   * - UNCHANGED: SKU in database but not mentioned in brand column (SAFE - no auto-delete)
   *
   * @param parsed - Parsed Excel file
   * @param existingData - Current database data
   * @returns Complete diff result
   */
  generateDiff(
    parsed: ParsedExcelFile,
    existingData: ExistingDatabaseData
  ): DiffResult {
    const partsDiff = this.diffParts(parsed.parts.data, existingData.parts);
    const vehicleAppsDiff = this.diffVehicleApplications(
      parsed.vehicleApplications.data,
      existingData.vehicleApplications
    );

    // Phase 3: Extract cross-refs from Parts sheet brand columns
    const crossRefsDiff = this.diffCrossRefsFromBrandColumns(
      parsed.parts.data,
      existingData.crossReferences,
      existingData.parts
    );

    // Calculate overall summary
    const summary = {
      totalAdds:
        partsDiff.summary.totalAdds +
        vehicleAppsDiff.summary.totalAdds +
        crossRefsDiff.summary.totalAdds,
      totalUpdates:
        partsDiff.summary.totalUpdates +
        vehicleAppsDiff.summary.totalUpdates +
        crossRefsDiff.summary.totalUpdates,
      totalDeletes:
        partsDiff.summary.totalDeletes +
        vehicleAppsDiff.summary.totalDeletes +
        crossRefsDiff.summary.totalDeletes,
      totalUnchanged:
        partsDiff.summary.totalUnchanged +
        vehicleAppsDiff.summary.totalUnchanged +
        crossRefsDiff.summary.totalUnchanged,
      totalChanges:
        partsDiff.summary.totalChanges +
        vehicleAppsDiff.summary.totalChanges +
        crossRefsDiff.summary.totalChanges,
      changesBySheet: {
        parts: partsDiff.summary.totalChanges,
        vehicleApplications: vehicleAppsDiff.summary.totalChanges,
        crossReferences: crossRefsDiff.summary.totalChanges,
      },
    };

    return {
      parts: partsDiff,
      vehicleApplications: vehicleAppsDiff,
      crossReferences: crossRefsDiff,
      summary,
    };
  }

  // --------------------------------------------------------------------------
  // Parts Sheet Diff
  // --------------------------------------------------------------------------

  /**
   * Diff parts with ML-style safe delete behavior.
   *
   * - ADD: Row has no _id or _id is empty
   * - UPDATE: Row has _id that exists in database and data changed
   * - DELETE: Row has _action === 'DELETE' (explicit delete only)
   * - UNCHANGED: Row has _id that exists and data is identical,
   *              OR existing part not in uploaded file (SAFE - no auto-delete)
   */
  private diffParts(
    uploadedParts: ExcelPartRow[],
    existingParts: Map<string, ExcelPartRow>
  ): SheetDiff<ExcelPartRow> {
    const adds: DiffItem<ExcelPartRow>[] = [];
    const updates: DiffItem<ExcelPartRow>[] = [];
    const deletes: DiffItem<ExcelPartRow>[] = [];
    const unchanged: DiffItem<ExcelPartRow>[] = [];
    const processedIds = new Set<string>();

    // Process uploaded rows
    uploadedParts.forEach((part) => {
      // Check for explicit DELETE action (ML-style)
      const isExplicitDelete = part._action?.toUpperCase() === "DELETE";

      if (isExplicitDelete && part._id) {
        // EXPLICIT DELETE: Row marked with _action = "DELETE"
        const existing = existingParts.get(part._id);
        if (existing) {
          processedIds.add(part._id);
          deletes.push({
            operation: DiffOperation.DELETE,
            before: existing,
          });
        }
        // If no existing record, ignore (can't delete what doesn't exist)
        return;
      }

      if (!part._id || part._id.trim() === "") {
        // ADD: No ID = new row
        adds.push({
          operation: DiffOperation.ADD,
          row: part,
          after: part,
        });
      } else {
        processedIds.add(part._id);
        const existing = existingParts.get(part._id);

        if (!existing) {
          // ADD: ID not in database = new row (shouldn't happen after validation)
          adds.push({
            operation: DiffOperation.ADD,
            row: part,
            after: part,
          });
        } else {
          // Check if data changed
          const changes = this.detectPartChanges(existing, part);

          if (changes.length > 0) {
            // UPDATE: Data changed
            updates.push({
              operation: DiffOperation.UPDATE,
              row: part,
              before: existing,
              after: part,
              changes,
            });
          } else {
            // UNCHANGED: Data identical
            unchanged.push({
              operation: DiffOperation.UNCHANGED,
              row: part,
            });
          }
        }
      }
    });

    // ML-style safe: Parts in database but not in file are UNCHANGED (no auto-delete)
    existingParts.forEach((existing, id) => {
      if (!processedIds.has(id)) {
        unchanged.push({
          operation: DiffOperation.UNCHANGED,
          row: existing,
        });
      }
    });

    return {
      sheetName: SHEET_NAMES.PARTS,
      adds,
      updates,
      deletes,
      unchanged,
      summary: {
        totalAdds: adds.length,
        totalUpdates: updates.length,
        totalDeletes: deletes.length,
        totalUnchanged: unchanged.length,
        totalChanges: adds.length + updates.length + deletes.length,
      },
    };
  }

  private detectPartChanges(
    before: ExcelPartRow,
    after: ExcelPartRow
  ): string[] {
    const changes: string[] = [];

    // Required fields: direct comparison
    if (before.acr_sku !== after.acr_sku) changes.push("acr_sku");
    if (before.part_type !== after.part_type) changes.push("part_type");

    // Status field: normalize for comparison (treat empty as default)
    if (
      this.normalizeOptional(before.status) !==
      this.normalizeOptional(after.status)
    ) {
      changes.push("status");
    }

    // Optional fields: normalize null/undefined/empty before comparison
    if (
      this.normalizeOptional(before.position_type) !==
      this.normalizeOptional(after.position_type)
    ) {
      changes.push("position_type");
    }
    if (
      this.normalizeOptional(before.abs_type) !==
      this.normalizeOptional(after.abs_type)
    ) {
      changes.push("abs_type");
    }
    if (
      this.normalizeOptional(before.bolt_pattern) !==
      this.normalizeOptional(after.bolt_pattern)
    ) {
      changes.push("bolt_pattern");
    }
    if (
      this.normalizeOptional(before.drive_type) !==
      this.normalizeOptional(after.drive_type)
    ) {
      changes.push("drive_type");
    }
    if (
      this.normalizeOptional(before.specifications) !==
      this.normalizeOptional(after.specifications)
    ) {
      changes.push("specifications");
    }

    // workflow_status field: normalize for comparison (ACTIVE/INACTIVE/DELETE)
    if (
      this.normalizeOptional(before.workflow_status) !==
      this.normalizeOptional(after.workflow_status)
    ) {
      changes.push("workflow_status");
    }

    return changes;
  }

  // --------------------------------------------------------------------------
  // Vehicle Applications Sheet Diff
  // --------------------------------------------------------------------------

  /**
   * Diff vehicle applications with ML-style safe delete behavior.
   *
   * - ADD: Row has no _id or _id is empty
   * - UPDATE: Row has _id that exists in database and data changed
   * - DELETE: No auto-delete - vehicle apps in DB but not in file are UNCHANGED
   * - UNCHANGED: Row has _id that exists and data is identical,
   *              OR existing vehicle app not in uploaded file (SAFE - no auto-delete)
   *
   * Note: Vehicle applications don't have an _action column. To delete a vehicle
   * application, remove the row from the Excel file AND the associated part.
   * Orphaned vehicle applications will be handled by database cascades.
   */
  private diffVehicleApplications(
    uploadedVehicles: ExcelVehicleAppRow[],
    existingVehicles: Map<string, ExcelVehicleAppRow>
  ): SheetDiff<ExcelVehicleAppRow> {
    const adds: DiffItem<ExcelVehicleAppRow>[] = [];
    const updates: DiffItem<ExcelVehicleAppRow>[] = [];
    const deletes: DiffItem<ExcelVehicleAppRow>[] = [];
    const unchanged: DiffItem<ExcelVehicleAppRow>[] = [];
    const processedIds = new Set<string>();

    uploadedVehicles.forEach((vehicle) => {
      if (!vehicle._id || vehicle._id.trim() === "") {
        // ADD: No ID = new row
        adds.push({
          operation: DiffOperation.ADD,
          row: vehicle,
          after: vehicle,
        });
      } else {
        processedIds.add(vehicle._id);
        const existing = existingVehicles.get(vehicle._id);

        if (!existing) {
          // ADD: ID not in database
          adds.push({
            operation: DiffOperation.ADD,
            row: vehicle,
            after: vehicle,
          });
        } else {
          const changes = this.detectVehicleAppChanges(existing, vehicle);

          if (changes.length > 0) {
            updates.push({
              operation: DiffOperation.UPDATE,
              row: vehicle,
              before: existing,
              after: vehicle,
              changes,
            });
          } else {
            unchanged.push({
              operation: DiffOperation.UNCHANGED,
              row: vehicle,
            });
          }
        }
      }
    });

    // ML-style safe: Vehicle apps in database but not in file are UNCHANGED (no auto-delete)
    existingVehicles.forEach((existing, id) => {
      if (!processedIds.has(id)) {
        unchanged.push({
          operation: DiffOperation.UNCHANGED,
          row: existing,
        });
      }
    });

    return {
      sheetName: SHEET_NAMES.VEHICLE_APPLICATIONS,
      adds,
      updates,
      deletes,
      unchanged,
      summary: {
        totalAdds: adds.length,
        totalUpdates: updates.length,
        totalDeletes: deletes.length,
        totalUnchanged: unchanged.length,
        totalChanges: adds.length + updates.length + deletes.length,
      },
    };
  }

  private detectVehicleAppChanges(
    before: ExcelVehicleAppRow,
    after: ExcelVehicleAppRow
  ): string[] {
    const changes: string[] = [];

    if (before._part_id !== after._part_id) changes.push("_part_id");
    // SKIP acr_sku - it's a computed display field (not stored in DB, always empty in 'before')
    if (before.make !== after.make) changes.push("make");
    if (before.model !== after.model) changes.push("model");
    if (before.start_year !== after.start_year) changes.push("start_year");
    if (before.end_year !== after.end_year) changes.push("end_year");

    return changes;
  }

  // --------------------------------------------------------------------------
  // Cross References from Brand Columns (Phase 3)
  // --------------------------------------------------------------------------

  /**
   * Diff cross-references extracted from Parts sheet brand columns
   *
   * ML-style safe delete behavior:
   * - ADD: New SKU in brand column not in database
   * - DELETE: Only SKUs explicitly marked with [DELETE] prefix
   * - UNCHANGED: Existing SKUs in DB not mentioned in Excel (SAFE - no auto-delete)
   *
   * @param uploadedParts - Parsed parts with brand columns
   * @param existingCrossRefs - Existing cross-refs from database
   * @param existingParts - Existing parts for ID lookup
   */
  private diffCrossRefsFromBrandColumns(
    uploadedParts: ExcelPartRow[],
    existingCrossRefs: Map<string, ExcelCrossRefRow>,
    existingParts: Map<string, ExcelPartRow>
  ): SheetDiff<ExcelCrossRefRow> {
    const adds: DiffItem<ExcelCrossRefRow>[] = [];
    const deletes: DiffItem<ExcelCrossRefRow>[] = [];
    const unchanged: DiffItem<ExcelCrossRefRow>[] = [];
    // Note: updates not used - cross-refs are add/delete only (immutable SKUs)

    // Build index of existing cross-refs by part_id and brand+sku
    const existingByPart = this.buildExistingCrossRefMap(existingCrossRefs);

    // Process each part row
    for (const part of uploadedParts) {
      const partId = part._id;
      if (!partId) continue; // Skip new parts (no ID yet)

      const existingForPart = existingByPart[partId] || {};

      // Process each brand column
      for (const [propName, brandName] of Object.entries(BRAND_COLUMN_MAP)) {
        const columnValue = part[propName as keyof ExcelPartRow] as
          | string
          | undefined;
        const parsed = this.parseBrandColumn(columnValue);

        // Process adds: SKUs in Excel that don't exist in DB for this part+brand
        for (const sku of parsed.adds) {
          const compositeKey = `${brandName}::${sku}`;
          const existing = existingForPart[compositeKey];

          if (!existing) {
            // New cross-ref to add
            const newCrossRef: ExcelCrossRefRow = {
              _acr_part_id: partId,
              acr_sku: part.acr_sku,
              competitor_brand: brandName,
              competitor_sku: sku,
            };
            adds.push({
              operation: DiffOperation.ADD,
              row: newCrossRef,
              after: newCrossRef,
            });
          }
          // If exists, it's unchanged (no update needed for cross-refs)
        }

        // Process explicit deletes: SKUs marked with [DELETE]
        for (const sku of parsed.deletes) {
          const compositeKey = `${brandName}::${sku}`;
          const existing = existingForPart[compositeKey];

          if (existing) {
            // Explicit delete
            deletes.push({
              operation: DiffOperation.DELETE,
              before: existing,
            });
          }
          // If not exists, ignore (can't delete what doesn't exist)
        }
      }
    }

    // Count unchanged (existing cross-refs not in any delete list)
    // This is informational only - ML-style means we DON'T delete these
    const allDeletedIds = new Set(
      deletes.map((d) => d.before?._id).filter(Boolean)
    );
    existingCrossRefs.forEach((cr, id) => {
      if (!allDeletedIds.has(id)) {
        // Check if this cross-ref's part is in the uploaded file
        const partId = cr._acr_part_id || "";
        const partInFile = uploadedParts.some((p) => p._id === partId);
        if (partInFile) {
          unchanged.push({
            operation: DiffOperation.UNCHANGED,
            row: cr,
          });
        }
      }
    });

    return {
      sheetName: "Cross References (from brand columns)",
      adds,
      updates: [], // Cross-refs don't have updates (immutable)
      deletes,
      unchanged,
      summary: {
        totalAdds: adds.length,
        totalUpdates: 0,
        totalDeletes: deletes.length,
        totalUnchanged: unchanged.length,
        totalChanges: adds.length + deletes.length,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Cross References Sheet Diff (DEPRECATED)
  // --------------------------------------------------------------------------

  /**
   * @deprecated Phase 3 uses brand columns in Parts sheet instead.
   * Kept for reference only.
   */
  private diffCrossReferences(
    uploadedCrossRefs: ExcelCrossRefRow[],
    existingCrossRefs: Map<string, ExcelCrossRefRow>
  ): SheetDiff<ExcelCrossRefRow> {
    const adds: DiffItem<ExcelCrossRefRow>[] = [];
    const updates: DiffItem<ExcelCrossRefRow>[] = [];
    const unchanged: DiffItem<ExcelCrossRefRow>[] = [];
    const processedIds = new Set<string>();

    uploadedCrossRefs.forEach((crossRef) => {
      if (!crossRef._id || crossRef._id.trim() === "") {
        // ADD: No ID = new row
        adds.push({
          operation: DiffOperation.ADD,
          row: crossRef,
          after: crossRef,
        });
      } else {
        processedIds.add(crossRef._id);
        const existing = existingCrossRefs.get(crossRef._id);

        if (!existing) {
          // ADD: ID not in database
          adds.push({
            operation: DiffOperation.ADD,
            row: crossRef,
            after: crossRef,
          });
        } else {
          const changes = this.detectCrossRefChanges(existing, crossRef);

          if (changes.length > 0) {
            updates.push({
              operation: DiffOperation.UPDATE,
              row: crossRef,
              before: existing,
              after: crossRef,
              changes,
            });
          } else {
            unchanged.push({
              operation: DiffOperation.UNCHANGED,
              row: crossRef,
            });
          }
        }
      }
    });

    // Find deletes
    const deletes: DiffItem<ExcelCrossRefRow>[] = [];
    existingCrossRefs.forEach((existing, id) => {
      if (!processedIds.has(id)) {
        deletes.push({
          operation: DiffOperation.DELETE,
          before: existing,
        });
      }
    });

    return {
      sheetName: SHEET_NAMES.CROSS_REFERENCES,
      adds,
      updates,
      deletes,
      unchanged,
      summary: {
        totalAdds: adds.length,
        totalUpdates: updates.length,
        totalDeletes: deletes.length,
        totalUnchanged: unchanged.length,
        totalChanges: adds.length + updates.length + deletes.length,
      },
    };
  }

  private detectCrossRefChanges(
    before: ExcelCrossRefRow,
    after: ExcelCrossRefRow
  ): string[] {
    const changes: string[] = [];

    if (before._acr_part_id !== after._acr_part_id)
      changes.push("_acr_part_id");
    // SKIP acr_sku - it's a computed display field (not stored in DB, always empty in 'before')
    if (before.competitor_brand !== after.competitor_brand)
      changes.push("competitor_brand");
    if (before.competitor_sku !== after.competitor_sku)
      changes.push("competitor_sku");

    return changes;
  }
}
