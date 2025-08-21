// Conflict Detection Utilities - ACR Automotive
import { randomUUID } from "crypto";
import {
  ConflictReport,
  ConflictSummary,
  ConflictSeverity,
  ConflictSource,
  ProcessingResult,
  CONFLICT_TYPES,
} from "./conflict-types";

/**
 * Factory to create standardized conflict reports
 */
export class ConflictFactory {
  private static generateId(): string {
    return randomUUID();
  }

  /**
   * Create orphaned application conflict (our main use case)
   */
  static createOrphanedApplicationConflict(
    orphanedSkus: string[]
  ): ConflictReport {
    return {
      id: this.generateId(),
      severity: "warning",
      source: "cross-validation",
      conflictType: CONFLICT_TYPES.ORPHANED_APPLICATION,
      description: `${orphanedSkus.length} orphaned applications found. An orphaned application is an application with a ACR_SKU that does not exist in the PRECIOS excel file.`,
      affectedSkus: orphanedSkus,
      suggestion:
        "Consider updating the PRECIOS excel sheet with the missing SKUs.",
      impact: "non-blocking",
      affectedRows: [],
    };
  }
}

/**
 * Aggregate conflicts for admin UI
 */
export class ConflictAggregator {
  static summarizeConflicts(conflicts: ConflictReport[]): ConflictSummary {
    const totalBySeverity = { error: 0, warning: 0, info: 0 };

    conflicts.forEach((item) => {
      switch (item.severity) {
        case "error":
          totalBySeverity.error += 1;
          break;
        case "warning":
          totalBySeverity.warning += 1;
          break;
        default:
          totalBySeverity.info += 1;
          break;
      }
    });

    // Group by type and source
    const byType: Record<string, ConflictReport[]> = {};
    const bySource: Record<ConflictSource, ConflictReport[]> = {
      precios: [],
      catalogacion: [],
      "cross-validation": [],
    };

    conflicts.forEach((item) => {
      if (!byType[item.conflictType]) {
        byType[item.conflictType] = [];
      }
      byType[item.conflictType].push(item);
      bySource[item.source].push(item);
    });

    const hasBlockingConflicts =
      conflicts.filter((item) => item.impact === "blocking").length > 0;

    // Sort conflicts by priority

    // JavaScript Sort Comparator Rules
    //   The comparator function (a, b) => number returns:
    //   - Negative number → a comes before b (a has higher priority)
    //   - Zero → a and b are equal (order unchanged)
    //   - Positive number → a comes after b (b has higher priority)
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const prioritized: ConflictReport[] = conflicts.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    return {
      totalBySeverity,
      byType,
      bySource,
      prioritized,
      hasBlockingConflicts,
    };
  }
}
