// ============================================================================
// Diff Engine - SKU-Based Change Detection
// ============================================================================

import {
  DiffOperation,
  DiffItem,
  SheetDiff,
  CrossRefDiffItem,
  DiffResult,
} from "./types";
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelAliasRow,
} from "../shared/types";
import type { ExistingDatabaseData } from "../validation/ValidationEngine";
import {
  SHEET_NAMES,
  BRAND_COLUMN_MAP,
  DELETE_MARKER,
  splitCrossRefSkus,
  WORKFLOW_STATUS_MAP,
} from "../shared/constants";

// Type for parsed brand column (adds and explicit deletes)
interface ParsedBrandColumn {
  adds: string[];
  deletes: string[];
}

// Type for cross-ref indexed by part_id and composite key (brand+sku)
interface ExistingCrossRefByPart {
  [partId: string]: {
    [compositeKey: string]: { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string };
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
   * Normalize workflow status from Excel display value or DB enum value.
   * Excel uses "Activo"/"Inactivo"/"Eliminar", DB uses "ACTIVE"/"INACTIVE"/"DELETE".
   * Returns normalized DB format or null.
   */
  private normalizeWorkflowStatus(
    statusDisplay?: string,
    workflowStatus?: string
  ): string | null {
    // Prefer explicit workflow_status if set
    if (workflowStatus) {
      return workflowStatus.toUpperCase();
    }
    // Convert display value to DB format
    if (statusDisplay) {
      const mapped =
        WORKFLOW_STATUS_MAP[statusDisplay.toLowerCase()] ?? null;
      return mapped;
    }
    return null;
  }

  /**
   * Parse a brand column value into adds and explicit deletes
   * Format: "SKU1;SKU2;[DELETE]SKU3;SKU4" => { adds: ["SKU1", "SKU2", "SKU4"], deletes: ["SKU3"] }
   */
  private parseBrandColumn(
    value: string | undefined | null
  ): ParsedBrandColumn {
    const result: ParsedBrandColumn = { adds: [], deletes: [] };

    const { skus } = splitCrossRefSkus(value);

    for (const sku of skus) {
      if (sku.startsWith(DELETE_MARKER)) {
        const deleteSku = sku.substring(DELETE_MARKER.length).trim();
        if (deleteSku) {
          result.deletes.push(deleteSku);
        }
      } else {
        result.adds.push(sku);
      }
    }

    return result;
  }

  /**
   * Build a map of existing cross-refs indexed by part_id and composite key (brand+sku)
   */
  private buildExistingCrossRefMap(
    existingCrossRefs: Map<string, { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string }>
  ): ExistingCrossRefByPart {
    const result: ExistingCrossRefByPart = {};

    existingCrossRefs.forEach((cr) => {
      const partId = cr.acr_part_id || "";
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
   * Matching strategy:
   * - Parts: by acr_sku (immutable business key)
   * - Vehicle Applications: by (acr_sku, make, model) composite key
   * - Aliases: by (alias, canonical_name) composite key
   * - Cross-References: from brand columns in Parts sheet (add/delete by SKU)
   *
   * Delete mechanism: Status="Eliminar" on all sheets (explicit, no auto-delete)
   * Missing rows: UNCHANGED (safe — no auto-delete from missing rows)
   */
  generateDiff(
    parsed: ParsedExcelFile,
    existingData: ExistingDatabaseData
  ): DiffResult {
    // Step 1: Diff parts by acr_sku
    const partsDiff = this.diffParts(parsed.parts.data, existingData.parts);

    // Step 2: Build partIdBySku map (needed by VA diff and cross-ref diff)
    const partIdBySku = new Map<string, string>();
    // From existing parts
    for (const [sku, part] of existingData.parts) {
      if (part._id) partIdBySku.set(sku, part._id);
    }
    // From new parts (UUIDs assigned in diffParts)
    for (const add of partsDiff.adds) {
      if (add.row?.acr_sku && add.row?._id) {
        partIdBySku.set(add.row.acr_sku, add.row._id);
      }
    }

    // Step 3: Diff vehicle applications by composite key
    const vehicleAppsDiff = this.diffVehicleApplications(
      parsed.vehicleApplications.data,
      existingData.vehicleApplications,
      partIdBySku
    );

    // Step 4: Diff aliases by composite key (if sheet present)
    const aliasesDiff = parsed.aliases && parsed.aliases.data.length > 0
      ? this.diffAliases(parsed.aliases.data, existingData.aliases || new Map())
      : undefined;

    // Step 5: Extract cross-refs from Parts sheet brand columns
    const crossRefsDiff = this.diffCrossRefsFromBrandColumns(
      parsed.parts.data,
      existingData.crossReferences
    );

    // Calculate overall summary
    const aliasChanges = aliasesDiff?.summary.totalChanges || 0;
    const summary = {
      totalAdds:
        partsDiff.summary.totalAdds +
        vehicleAppsDiff.summary.totalAdds +
        crossRefsDiff.summary.totalAdds +
        (aliasesDiff?.summary.totalAdds || 0),
      totalUpdates:
        partsDiff.summary.totalUpdates +
        vehicleAppsDiff.summary.totalUpdates +
        (aliasesDiff?.summary.totalUpdates || 0),
      totalDeletes:
        partsDiff.summary.totalDeletes +
        vehicleAppsDiff.summary.totalDeletes +
        crossRefsDiff.summary.totalDeletes +
        (aliasesDiff?.summary.totalDeletes || 0),
      totalUnchanged:
        partsDiff.summary.totalUnchanged +
        vehicleAppsDiff.summary.totalUnchanged +
        (aliasesDiff?.summary.totalUnchanged || 0),
      totalChanges:
        partsDiff.summary.totalChanges +
        vehicleAppsDiff.summary.totalChanges +
        crossRefsDiff.summary.totalChanges +
        aliasChanges,
      changesBySheet: {
        parts: partsDiff.summary.totalChanges,
        vehicleApplications: vehicleAppsDiff.summary.totalChanges,
        crossReferences: crossRefsDiff.summary.totalChanges,
        aliases: aliasChanges,
      },
    };

    return {
      parts: partsDiff,
      vehicleApplications: vehicleAppsDiff,
      aliases: aliasesDiff,
      crossReferences: crossRefsDiff,
      summary,
    };
  }

  // --------------------------------------------------------------------------
  // Parts Sheet Diff (SKU-based matching)
  // --------------------------------------------------------------------------

  /**
   * Diff parts with SKU-based matching and ML-style safe delete behavior.
   *
   * - ADD: ACR SKU not in database = new part
   * - UPDATE: ACR SKU in database and data changed
   * - DELETE: Status="Eliminar" (explicit delete, hard delete + CASCADE)
   * - UNCHANGED: ACR SKU in database and data identical,
   *              OR existing part not in uploaded file (safe — no auto-delete)
   */
  private diffParts(
    uploadedParts: ExcelPartRow[],
    existingParts: Map<string, ExcelPartRow>
  ): SheetDiff<ExcelPartRow> {
    const adds: DiffItem<ExcelPartRow>[] = [];
    const updates: DiffItem<ExcelPartRow>[] = [];
    const deletes: DiffItem<ExcelPartRow>[] = [];
    const unchanged: DiffItem<ExcelPartRow>[] = [];
    const processedSkus = new Set<string>();

    uploadedParts.forEach((part) => {
      if (!part.acr_sku) return; // Skip rows without SKU

      processedSkus.add(part.acr_sku);

      // Resolve status
      const statusValue =
        WORKFLOW_STATUS_MAP[part.status?.toLowerCase() || ""] || "ACTIVE";

      // Look up by ACR SKU
      const existing = existingParts.get(part.acr_sku);

      if (statusValue === "DELETE") {
        // EXPLICIT DELETE via Status="Eliminar"
        if (existing) {
          part._id = existing._id; // Attach DB UUID for deletion
          deletes.push({
            operation: DiffOperation.DELETE,
            before: existing,
          });
        }
        // If not in DB, ignore (can't delete what doesn't exist)
        return;
      }

      if (!existing) {
        // ADD: SKU not in database = new part
        part._id = crypto.randomUUID();
        adds.push({
          operation: DiffOperation.ADD,
          row: part,
          after: part,
        });
      } else {
        // Attach DB UUID for pipeline
        part._id = existing._id;
        const changes = this.detectPartChanges(existing, part);

        if (changes.length > 0) {
          updates.push({
            operation: DiffOperation.UPDATE,
            row: part,
            before: existing,
            after: part,
            changes,
          });
        } else {
          unchanged.push({
            operation: DiffOperation.UNCHANGED,
            row: part,
          });
        }
      }
    });

    // Existing parts NOT in uploaded file = UNCHANGED (safe, no auto-delete)
    existingParts.forEach((existing, sku) => {
      if (!processedSkus.has(sku)) {
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
    if (before.part_type !== after.part_type) changes.push("part_type");

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

    // Workflow status: Excel uses display values ("Activo"), DB uses enum ("ACTIVE").
    // Normalize both sides to DB format before comparing.
    const beforeWfStatus = this.normalizeOptional(before.workflow_status);
    const afterWfStatus = this.normalizeWorkflowStatus(
      after.status,
      after.workflow_status
    );
    if (beforeWfStatus !== afterWfStatus) {
      changes.push("workflow_status");
    }

    return changes;
  }

  // --------------------------------------------------------------------------
  // Vehicle Applications Diff (composite key matching)
  // --------------------------------------------------------------------------

  /**
   * Diff vehicle applications by composite key (acr_sku, make, model).
   *
   * - ADD: Composite key not in database = new VA
   * - UPDATE: Composite key in database and years changed
   * - DELETE: Status="Eliminar" (explicit delete, scoped to this VA only)
   * - UNCHANGED: Composite key in database and data identical,
   *              OR existing VA not in uploaded file (safe — no auto-delete)
   */
  private diffVehicleApplications(
    uploadedVehicles: ExcelVehicleAppRow[],
    existingVehicles: Map<string, ExcelVehicleAppRow>,
    partIdBySku: Map<string, string>
  ): SheetDiff<ExcelVehicleAppRow> {
    const adds: DiffItem<ExcelVehicleAppRow>[] = [];
    const updates: DiffItem<ExcelVehicleAppRow>[] = [];
    const deletes: DiffItem<ExcelVehicleAppRow>[] = [];
    const unchanged: DiffItem<ExcelVehicleAppRow>[] = [];
    const processedKeys = new Set<string>();

    uploadedVehicles.forEach((vehicle) => {
      if (!vehicle.acr_sku || !vehicle.make || !vehicle.model) return;

      const compositeKey = `${vehicle.acr_sku}::${vehicle.make}::${vehicle.model}::${vehicle.start_year}`;
      processedKeys.add(compositeKey);

      // Resolve _part_id from acr_sku
      vehicle._part_id = partIdBySku.get(vehicle.acr_sku);

      // Resolve status
      const statusValue = vehicle.status?.toLowerCase() === "eliminar" ? "DELETE" : "ACTIVE";

      const existing = existingVehicles.get(compositeKey);

      if (statusValue === "DELETE") {
        if (existing) {
          vehicle._id = existing._id;
          vehicle._part_id = existing._part_id;
          deletes.push({
            operation: DiffOperation.DELETE,
            before: existing,
          });
        }
        return;
      }

      if (!existing) {
        // ADD: New vehicle application
        vehicle._id = crypto.randomUUID();
        adds.push({
          operation: DiffOperation.ADD,
          row: vehicle,
          after: vehicle,
        });
      } else {
        // Attach DB identifiers
        vehicle._id = existing._id;
        vehicle._part_id = existing._part_id;

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
    });

    // Existing VAs NOT in uploaded file = UNCHANGED (safe, no auto-delete)
    existingVehicles.forEach((existing, key) => {
      if (!processedKeys.has(key)) {
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

    // end_year is the only updatable field (acr_sku/make/model/start_year are the composite key)
    const beforeEnd = typeof before.end_year === 'string' ? parseInt(before.end_year) : before.end_year;
    const afterEnd = typeof after.end_year === 'string' ? parseInt(after.end_year) : after.end_year;

    if (beforeEnd !== afterEnd) changes.push("end_year");

    return changes;
  }

  // --------------------------------------------------------------------------
  // Vehicle Aliases Diff (composite key matching)
  // --------------------------------------------------------------------------

  /**
   * Diff aliases by composite key (alias, canonical_name).
   *
   * - ADD: Composite key not in database = new alias
   * - UPDATE: Composite key in database and type changed
   * - DELETE: Status="Eliminar" (explicit delete, scoped)
   * - UNCHANGED: Same or not in uploaded file
   */
  private diffAliases(
    uploadedAliases: ExcelAliasRow[],
    existingAliases: Map<string, ExcelAliasRow>
  ): SheetDiff<ExcelAliasRow> {
    const adds: DiffItem<ExcelAliasRow>[] = [];
    const updates: DiffItem<ExcelAliasRow>[] = [];
    const deletes: DiffItem<ExcelAliasRow>[] = [];
    const unchanged: DiffItem<ExcelAliasRow>[] = [];
    const processedKeys = new Set<string>();

    uploadedAliases.forEach((alias) => {
      if (!alias.alias || !alias.canonical_name) return;

      const compositeKey = `${alias.alias.toLowerCase()}::${alias.canonical_name.toUpperCase()}`;
      processedKeys.add(compositeKey);

      const statusValue = alias.status?.toLowerCase() === "eliminar" ? "DELETE" : "ACTIVE";
      const existing = existingAliases.get(compositeKey);

      if (statusValue === "DELETE") {
        if (existing) {
          alias._id = existing._id;
          deletes.push({
            operation: DiffOperation.DELETE,
            before: existing,
          });
        }
        return;
      }

      if (!existing) {
        // ADD: New alias
        adds.push({
          operation: DiffOperation.ADD,
          row: alias,
          after: alias,
        });
      } else {
        alias._id = existing._id;

        // Check if alias_type changed
        const changes: string[] = [];
        if (this.normalizeOptional(existing.alias_type) !== this.normalizeOptional(alias.alias_type)) {
          changes.push("alias_type");
        }

        if (changes.length > 0) {
          updates.push({
            operation: DiffOperation.UPDATE,
            row: alias,
            before: existing,
            after: alias,
            changes,
          });
        } else {
          unchanged.push({
            operation: DiffOperation.UNCHANGED,
            row: alias,
          });
        }
      }
    });

    // Existing aliases NOT in uploaded file = UNCHANGED
    existingAliases.forEach((existing, key) => {
      if (!processedKeys.has(key)) {
        unchanged.push({
          operation: DiffOperation.UNCHANGED,
          row: existing,
        });
      }
    });

    return {
      sheetName: SHEET_NAMES.ALIASES,
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

  // --------------------------------------------------------------------------
  // Cross References from Brand Columns
  // --------------------------------------------------------------------------

  /**
   * Diff cross-references extracted from Parts sheet brand columns
   *
   * ML-style safe delete behavior:
   * - ADD: New SKU in brand column not in database
   * - DELETE: Only SKUs explicitly marked with [DELETE] prefix
   * - UNCHANGED: Existing SKUs in DB not mentioned in Excel (safe — no auto-delete)
   */
  private diffCrossRefsFromBrandColumns(
    uploadedParts: ExcelPartRow[],
    existingCrossRefs: Map<string, { _id: string; acr_part_id: string; competitor_brand: string; competitor_sku: string }>
  ): {
    adds: CrossRefDiffItem[];
    deletes: CrossRefDiffItem[];
    summary: {
      totalAdds: number;
      totalDeletes: number;
      totalChanges: number;
    };
  } {
    const adds: CrossRefDiffItem[] = [];
    const deletes: CrossRefDiffItem[] = [];

    // Build index of existing cross-refs by part_id and brand+sku
    const existingByPart = this.buildExistingCrossRefMap(existingCrossRefs);

    // Process each part row
    for (const part of uploadedParts) {
      const partId = part._id;
      if (!partId) continue;

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
            adds.push({
              partId,
              brand: brandName,
              sku,
              operation: DiffOperation.ADD,
            });
          }
        }

        // Process explicit deletes: SKUs marked with [DELETE]
        for (const sku of parsed.deletes) {
          const compositeKey = `${brandName}::${sku}`;
          const existing = existingForPart[compositeKey];

          if (existing) {
            deletes.push({
              partId,
              brand: brandName,
              sku,
              operation: DiffOperation.DELETE,
              _id: existing._id, // Carry DB UUID for deletion
            });
          }
        }
      }
    }

    return {
      adds,
      deletes,
      summary: {
        totalAdds: adds.length,
        totalDeletes: deletes.length,
        totalChanges: adds.length + deletes.length,
      },
    };
  }
}
