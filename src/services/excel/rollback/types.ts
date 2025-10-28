// ============================================================================
// RollbackService Types - Restore snapshots with conflict detection
// ============================================================================

/**
 * Result of rollback execution
 */
export interface RollbackResult {
  success: boolean;
  importId: string;
  restoredCounts: {
    parts: number;
    vehicleApplications: number;
    crossReferences: number;
  };
  executionTimeMs?: number;
}

/**
 * Import snapshot summary (for rollback UI)
 */
export interface ImportSnapshot {
  id: string;
  created_at: string;
  file_name: string;
  rows_imported: number;
  import_summary: {
    adds: number;
    updates: number;
    deletes: number;
  };
  imported_by: string | null;
}

/**
 * Rollback conflict details
 */
export interface RollbackConflict {
  partId: string;
  acrSku: string;
  modifiedAt: Date;
  modifiedBy: string;
  fields: string[]; // List of fields that changed
}

/**
 * Rollback conflict error (thrown when manual edits detected)
 */
export class RollbackConflictError extends Error {
  public conflictCount: number;
  public conflictingParts: string[];
  public conflicts?: RollbackConflict[];

  constructor(params: {
    conflictCount: number;
    conflictingParts: string[];
    conflicts?: RollbackConflict[];
    message?: string;
  }) {
    super(
      params.message ||
        `Cannot rollback: ${params.conflictCount} part(s) were manually edited after this import. Rollback would cause data loss.`
    );
    this.name = 'RollbackConflictError';
    this.conflictCount = params.conflictCount;
    this.conflictingParts = params.conflictingParts;
    this.conflicts = params.conflicts;
  }
}

/**
 * Sequential rollback enforcement error
 */
export class SequentialRollbackError extends Error {
  public newestImportId: string;
  public requestedImportId: string;

  constructor(newestImportId: string, requestedImportId: string) {
    super(
      'Sequential rollback enforced. Must rollback newest import first.'
    );
    this.name = 'SequentialRollbackError';
    this.newestImportId = newestImportId;
    this.requestedImportId = requestedImportId;
  }
}

/**
 * Rollback execution error
 */
export class RollbackExecutionError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RollbackExecutionError';
  }
}
