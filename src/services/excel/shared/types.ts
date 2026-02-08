// ============================================================================
// Shared Excel Export/Import Types
// ============================================================================

/**
 * Shared type definitions for Excel export and import operations.
 * These types ensure consistency between the exported Excel format
 * and the import parsing logic.
 *
 * Matching strategy:
 * - Parts: matched by acr_sku (immutable business key)
 * - Vehicle Applications: matched by (acr_sku, make, model) composite key
 * - Aliases: matched by (alias, canonical_name) composite key
 * - _id fields are internal-only (resolved by DiffEngine, not in Excel)
 */

// ----------------------------------------------------------------------------
// Excel Column Definition
// ----------------------------------------------------------------------------

/**
 * Column definition for ExcelJS
 * Used by export service to generate Excel columns
 */
export interface ExcelColumnDefinition {
  header: string;
  key: string;
  width: number;
  hidden?: boolean;
}

// ----------------------------------------------------------------------------
// Part Row (Sheet 1: Parts)
// ----------------------------------------------------------------------------

/**
 * Part row structure for Excel export/import
 *
 * Matched by acr_sku (immutable business key).
 * Status column controls lifecycle: Activo, Inactivo, Eliminar.
 * Eliminar = hard delete + CASCADE (removes VAs, cross-refs, images).
 */
export interface ExcelPartRow {
  _id?: string; // Internal: assigned by DiffEngine during matching, NOT in Excel
  acr_sku: string;
  status?: string; // "Activo" | "Inactivo" | "Eliminar"
  part_type: string;
  position_type?: string;
  abs_type?: string;
  bolt_pattern?: string;
  drive_type?: string;
  specifications?: string;
  workflow_status?: string; // DB format: ACTIVE, INACTIVE, DELETE
  // Cross-reference brand columns — semicolon-separated SKUs
  // Use [DELETE]SKU to mark a SKU for explicit deletion
  national_skus?: string;
  atv_skus?: string;
  syd_skus?: string;
  tmk_skus?: string;
  grob_skus?: string;
  race_skus?: string;
  oem_skus?: string;
  oem_2_skus?: string;
  gmb_skus?: string;
  gsp_skus?: string;
  fag_skus?: string;
  // Image URL columns
  image_url_front?: string;
  image_url_back?: string;
  image_url_top?: string;
  image_url_other?: string;
  viewer_360_status?: string; // "Confirmed" or empty (readonly on export)
  // Errors column (read-only, formula-driven in Excel)
  errors?: string;
}

// ----------------------------------------------------------------------------
// Vehicle Application Row (Sheet 2: Vehicle_Applications)
// ----------------------------------------------------------------------------

/**
 * Vehicle application row structure for Excel export/import
 *
 * Matched by (acr_sku, make, model) composite key.
 * Years are updatable fields. Status="Eliminar" = hard delete (scoped).
 */
export interface ExcelVehicleAppRow {
  _id?: string; // Internal: resolved from DB by DiffEngine
  _part_id?: string; // Internal: resolved from acr_sku by DiffEngine
  acr_sku: string;
  status?: string; // "Activo" | "Eliminar"
  make: string;
  model: string;
  start_year: number | string;
  end_year: number | string;
  errors?: string;
}

// ----------------------------------------------------------------------------
// Vehicle Alias Row (Sheet 3: Vehicle Aliases)
// ----------------------------------------------------------------------------

/**
 * Vehicle alias row structure for Excel export/import
 *
 * Matched by (alias, canonical_name) composite key.
 * Type (alias_type) is updatable. Status="Eliminar" = hard delete (scoped).
 */
export interface ExcelAliasRow {
  _id?: string; // Internal: resolved from DB by DiffEngine
  alias: string;
  canonical_name: string;
  alias_type: string;
  status?: string; // "Activo" | "Eliminar"
  errors?: string;
}

// ----------------------------------------------------------------------------
// Parsed Sheet Metadata
// ----------------------------------------------------------------------------

/**
 * Metadata for a parsed Excel sheet
 */
export interface ParsedSheet<T> {
  sheetName: string;
  data: T[];
  rowCount: number;
}

// ----------------------------------------------------------------------------
// Parsed Excel File (Complete)
// ----------------------------------------------------------------------------

/**
 * Complete parsed Excel file structure
 * Used by both export generation and import parsing
 */
export interface ParsedExcelFile {
  parts: ParsedSheet<ExcelPartRow>;
  vehicleApplications: ParsedSheet<ExcelVehicleAppRow>;
  aliases?: ParsedSheet<ExcelAliasRow>;
  metadata: {
    uploadedAt: Date;
    fileName: string;
    fileSize: number;
  };
}

// ----------------------------------------------------------------------------
// Export Filter Parameters
// ----------------------------------------------------------------------------

/**
 * Filter parameters for filtered catalog export
 */
export interface ExportFilters {
  search?: string;
  part_type?: string;
  position_type?: string;
  abs_type?: string;
  drive_type?: string;
  bolt_pattern?: string;
}
