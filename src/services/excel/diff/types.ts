// ============================================================================
// Diff Engine Types - Change Detection
// ============================================================================

import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelCrossRefRow,
} from '../shared/types';

/**
 * Operation type for diff
 */
export enum DiffOperation {
  ADD = 'ADD', // New row (no _id or _id not in database)
  UPDATE = 'UPDATE', // Existing row modified
  DELETE = 'DELETE', // Row in database but not in file
  UNCHANGED = 'UNCHANGED', // Row exists in both with no changes
}

/**
 * Generic diff item
 */
export interface DiffItem<T> {
  operation: DiffOperation;
  row?: T; // The row data (for ADD/UPDATE/UNCHANGED)
  before?: T; // Previous data (for UPDATE/DELETE)
  after?: T; // New data (for UPDATE)
  changes?: string[]; // List of changed field names (for UPDATE)
}

/**
 * Sheet-level diff result
 */
export interface SheetDiff<T> {
  sheetName: string;
  adds: DiffItem<T>[];
  updates: DiffItem<T>[];
  deletes: DiffItem<T>[];
  unchanged: DiffItem<T>[];
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number; // adds + updates + deletes
  };
}

/**
 * Complete diff result for all sheets
 */
export interface DiffResult {
  parts: SheetDiff<ExcelPartRow>;
  vehicleApplications: SheetDiff<ExcelVehicleAppRow>;
  crossReferences: SheetDiff<ExcelCrossRefRow>;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number;
    changesBySheet: {
      parts: number;
      vehicleApplications: number;
      crossReferences: number;
    };
  };
}