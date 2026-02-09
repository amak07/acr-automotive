// ============================================================================
// Diff Engine Types - Change Detection
// ============================================================================

import type {
  ExcelPartRow,
  ExcelVehicleAppRow,
  ExcelAliasRow,
} from '../shared/types';

/**
 * Operation type for diff
 */
export enum DiffOperation {
  ADD = 'ADD', // New record (not in database)
  UPDATE = 'UPDATE', // Existing record modified
  DELETE = 'DELETE', // Explicit delete via Status="Eliminar"
  UNCHANGED = 'UNCHANGED', // Record exists in both with no changes
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
 * Cross-reference diff result (extracted from brand columns in Parts sheet)
 */
export interface CrossRefDiffItem {
  partId: string;
  acrSku: string; // Human-readable ACR part SKU (for display)
  brand: string;
  sku: string;
  operation: DiffOperation;
  _id?: string; // DB UUID (for deletes — resolved from existing data)
}

/**
 * Complete diff result for all sheets
 */
export interface DiffResult {
  parts: SheetDiff<ExcelPartRow>;
  vehicleApplications: SheetDiff<ExcelVehicleAppRow>;
  aliases?: SheetDiff<ExcelAliasRow>;
  crossReferences: {
    adds: CrossRefDiffItem[];
    deletes: CrossRefDiffItem[];
    summary: {
      totalAdds: number;
      totalDeletes: number;
      totalChanges: number;
    };
  };
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
      aliases: number;
    };
  };
}