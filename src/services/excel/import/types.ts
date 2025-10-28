// ============================================================================
// ImportService Types - Execute imports with snapshot creation
// ============================================================================

/**
 * Complete database snapshot (pre-import state)
 * Stored in import_history.snapshot_data for rollback
 */
export interface SnapshotData {
  parts: any[];
  vehicle_applications: any[];
  cross_references: any[];
  timestamp: string;
}

/**
 * Result of import execution
 */
export interface ImportResult {
  success: boolean;
  importId: string;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalChanges: number;
  };
  executionTimeMs: number;
}

/**
 * Import metadata for history record
 */
export interface ImportMetadata {
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  importedBy?: string;
  tenantId?: string;
}

/**
 * Import history record (from database)
 */
export interface ImportHistoryRecord {
  id: string;
  tenant_id: string | null;
  imported_by: string | null;
  file_name: string;
  file_size_bytes: number;
  rows_imported: number;
  snapshot_data: SnapshotData;
  import_summary: {
    adds: number;
    updates: number;
    deletes: number;
  };
  created_at: string;
}

