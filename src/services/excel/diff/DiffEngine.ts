// ============================================================================
// Diff Engine - ID-Based Change Detection
// ============================================================================

import {
  DiffOperation,
  DiffItem,
  SheetDiff,
  DiffResult,
} from './types';
import type {
  ParsedExcelFile,
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from '../shared/types';
import type { ExistingDatabaseData } from '../validation/ValidationEngine';
import { SHEET_NAMES } from '../shared/constants';

// ----------------------------------------------------------------------------
// Diff Engine
// ----------------------------------------------------------------------------

export class DiffEngine {
  /**
   * Normalize optional field values for comparison
   * Treats null, undefined, and empty string as equivalent
   */
  private normalizeOptional(value: any): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return String(value);
  }

  /**
   * Generate diff between uploaded file and existing database
   *
   * Uses ID-based matching:
   * - ADD: Row has no _id or _id is empty
   * - UPDATE: Row has _id that exists in database and data changed
   * - DELETE: Database has _id that's not in uploaded file
   * - UNCHANGED: Row has _id that exists and data is identical
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
    const crossRefsDiff = this.diffCrossReferences(
      parsed.crossReferences.data,
      existingData.crossReferences
    );

    // Calculate overall summary
    const summary = {
      totalAdds: partsDiff.summary.totalAdds + vehicleAppsDiff.summary.totalAdds + crossRefsDiff.summary.totalAdds,
      totalUpdates: partsDiff.summary.totalUpdates + vehicleAppsDiff.summary.totalUpdates + crossRefsDiff.summary.totalUpdates,
      totalDeletes: partsDiff.summary.totalDeletes + vehicleAppsDiff.summary.totalDeletes + crossRefsDiff.summary.totalDeletes,
      totalUnchanged: partsDiff.summary.totalUnchanged + vehicleAppsDiff.summary.totalUnchanged + crossRefsDiff.summary.totalUnchanged,
      totalChanges: partsDiff.summary.totalChanges + vehicleAppsDiff.summary.totalChanges + crossRefsDiff.summary.totalChanges,
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

  private diffParts(
    uploadedParts: ExcelPartRow[],
    existingParts: Map<string, ExcelPartRow>
  ): SheetDiff<ExcelPartRow> {
    const adds: DiffItem<ExcelPartRow>[] = [];
    const updates: DiffItem<ExcelPartRow>[] = [];
    const unchanged: DiffItem<ExcelPartRow>[] = [];
    const processedIds = new Set<string>();

    // Process uploaded rows
    uploadedParts.forEach((part) => {
      if (!part._id || part._id.trim() === '') {
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

    // Find deletes (in database but not in file)
    const deletes: DiffItem<ExcelPartRow>[] = [];
    existingParts.forEach((existing, id) => {
      if (!processedIds.has(id)) {
        deletes.push({
          operation: DiffOperation.DELETE,
          before: existing,
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
    if (before.acr_sku !== after.acr_sku) changes.push('acr_sku');
    if (before.part_type !== after.part_type) changes.push('part_type');

    // Optional fields: normalize null/undefined/empty before comparison
    if (this.normalizeOptional(before.position_type) !== this.normalizeOptional(after.position_type)) {
      changes.push('position_type');
    }
    if (this.normalizeOptional(before.abs_type) !== this.normalizeOptional(after.abs_type)) {
      changes.push('abs_type');
    }
    if (this.normalizeOptional(before.bolt_pattern) !== this.normalizeOptional(after.bolt_pattern)) {
      changes.push('bolt_pattern');
    }
    if (this.normalizeOptional(before.drive_type) !== this.normalizeOptional(after.drive_type)) {
      changes.push('drive_type');
    }
    if (this.normalizeOptional(before.specifications) !== this.normalizeOptional(after.specifications)) {
      changes.push('specifications');
    }

    return changes;
  }

  // --------------------------------------------------------------------------
  // Vehicle Applications Sheet Diff
  // --------------------------------------------------------------------------

  private diffVehicleApplications(
    uploadedVehicles: ExcelVehicleAppRow[],
    existingVehicles: Map<string, ExcelVehicleAppRow>
  ): SheetDiff<ExcelVehicleAppRow> {
    const adds: DiffItem<ExcelVehicleAppRow>[] = [];
    const updates: DiffItem<ExcelVehicleAppRow>[] = [];
    const unchanged: DiffItem<ExcelVehicleAppRow>[] = [];
    const processedIds = new Set<string>();

    uploadedVehicles.forEach((vehicle) => {
      if (!vehicle._id || vehicle._id.trim() === '') {
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

    // Find deletes
    const deletes: DiffItem<ExcelVehicleAppRow>[] = [];
    existingVehicles.forEach((existing, id) => {
      if (!processedIds.has(id)) {
        deletes.push({
          operation: DiffOperation.DELETE,
          before: existing,
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

    if (before._part_id !== after._part_id) changes.push('_part_id');
    // SKIP acr_sku - it's a computed display field (not stored in DB, always empty in 'before')
    if (before.make !== after.make) changes.push('make');
    if (before.model !== after.model) changes.push('model');
    if (before.start_year !== after.start_year) changes.push('start_year');
    if (before.end_year !== after.end_year) changes.push('end_year');

    return changes;
  }

  // --------------------------------------------------------------------------
  // Cross References Sheet Diff
  // --------------------------------------------------------------------------

  private diffCrossReferences(
    uploadedCrossRefs: ExcelCrossRefRow[],
    existingCrossRefs: Map<string, ExcelCrossRefRow>
  ): SheetDiff<ExcelCrossRefRow> {
    const adds: DiffItem<ExcelCrossRefRow>[] = [];
    const updates: DiffItem<ExcelCrossRefRow>[] = [];
    const unchanged: DiffItem<ExcelCrossRefRow>[] = [];
    const processedIds = new Set<string>();

    uploadedCrossRefs.forEach((crossRef) => {
      if (!crossRef._id || crossRef._id.trim() === '') {
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

    if (before._acr_part_id !== after._acr_part_id) changes.push('_acr_part_id');
    // SKIP acr_sku - it's a computed display field (not stored in DB, always empty in 'before')
    if (before.competitor_brand !== after.competitor_brand) changes.push('competitor_brand');
    if (before.competitor_sku !== after.competitor_sku) changes.push('competitor_sku');

    return changes;
  }
}