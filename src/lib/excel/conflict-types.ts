// Conflict Detection System Types - ACR Automotive
// Comprehensive data integrity validation for Excel processing

/**
 * Severity levels for conflicts detected during Excel processing
 */
export type ConflictSeverity = "error" | "warning" | "info";

/**
 * Source of the conflict detection
 */
export type ConflictSource = "precios" | "catalogacion" | "cross-validation";

/**
 * Impact level - determines if import can proceed
 */
export type ConflictImpact = "blocking" | "non-blocking";

/**
 * Individual conflict report
 */
export interface ConflictReport {
  /** Unique identifier for this conflict */
  id: string;

  /** Severity level determines UI presentation and admin action required */
  severity: ConflictSeverity;

  /** Which parser or validation step detected this conflict */
  source: ConflictSource;

  /** Specific type of conflict for categorization */
  conflictType: ConflictType;

  /** Human-readable description for admin review */
  description: string;

  /** Excel row numbers where this conflict occurs */
  affectedRows: number[];

  /** ACR SKUs involved in this conflict */
  affectedSkus: string[];

  /** Suggested resolution or explanation */
  suggestion?: string;

  /** Whether this conflict blocks database import */
  impact: ConflictImpact;

  /** Additional context data for detailed view */
  metadata?: Record<string, any>;
}

/**
 * Processing result wrapper that includes conflict detection
 * Replaces direct parser results with conflict-aware results
 */
export interface ProcessingResult<TData = any> {
  /** Whether processing completed successfully */
  success: boolean;

  /** Parsed data (only present if no blocking conflicts) */
  data?: TData;

  /** All conflicts found during processing */
  conflicts: ConflictReport[];

  /** Processing performance and statistics */
  summary: ProcessingSummary;

  /** Whether import can proceed (no blocking conflicts) */
  canProceed: boolean;
}

/**
 * Processing statistics and performance metrics
 */
export interface ProcessingSummary {
  /** Processing time in milliseconds */
  processingTimeMs: number;

  /** Number of rows processed */
  totalRows: number;

  /** Number of valid data records created */
  validRecords: number;

  /** Number of rows skipped due to validation issues */
  skippedRows: number;

  /** Conflict count by severity */
  conflictCounts: {
    errors: number;
    warnings: number;
    info: number;
  };

  /** Additional metrics specific to the parser */
  customMetrics?: Record<string, number>;
}

/**
 * Conflict aggregation for admin UI presentation
 */
export interface ConflictSummary {
  /** Total conflicts by severity */
  totalBySeverity: Record<ConflictSeverity, number>;

  /** Conflicts grouped by type for categorization */
  byType: Record<string, ConflictReport[]>;

  /** Conflicts grouped by source parser */
  bySource: Record<ConflictSource, ConflictReport[]>;

  /** Most critical conflicts (errors first, then warnings) */
  prioritized: ConflictReport[];

  /** Whether any blocking conflicts exist */
  hasBlockingConflicts: boolean;
}

// Conflict types - simplified to only what we actually use
export const CONFLICT_TYPES = {
  // PRECIOS parser conflicts
  // DUPLICATE_ACR_SKU: "duplicate_acr_sku", // ❌ REMOVED - Multiple rows per ACR SKU now supported (Jan 2025)

  // CATALOGACION parser conflicts  
  ORPHANED_APPLICATION: "orphaned_application", // ✅ Implemented - warning

  // Future conflict types (add as needed):
  // INVALID_ACR_SKU_FORMAT: "invalid_acr_sku_format",
  // MALFORMED_COMPETITOR_SKU: "malformed_competitor_sku", 
  // DUPLICATE_VEHICLE_APPLICATION: "duplicate_vehicle_application",
  // MISSING_REQUIRED_DATA: "missing_required_data",
  // DATA_CONSISTENCY_VIOLATION: "data_consistency_violation",
  // FILE_FORMAT_ERROR: "file_format_error",
} as const;

export type ConflictType = (typeof CONFLICT_TYPES)[keyof typeof CONFLICT_TYPES];
