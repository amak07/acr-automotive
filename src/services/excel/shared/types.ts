// ============================================================================
// Shared Excel Export/Import Types
// ============================================================================

import type { COLUMN_HEADERS, COLUMN_WIDTHS } from './constants';

/**
 * Shared type definitions for Excel export and import operations.
 * These types ensure consistency between the exported Excel format
 * and the import parsing logic.
 *
 * Column naming convention:
 * - Headers use PascalCase with underscores (e.g., "ACR_SKU", "Part_Type")
 * - Object properties use snake_case (e.g., "acr_sku", "part_type")
 * - Hidden columns prefixed with underscore (e.g., "_id", "_part_id")
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
 * Columns:
 * - _id (hidden): UUID for tracking existing parts on re-import
 * - ACR_SKU: ACR part number (user-visible, required)
 * - Part_Type: Part classification (e.g., "Wheel Hub", "Brake Rotor")
 * - Position_Type: Position (e.g., "Front", "Rear", "Front Left")
 * - ABS_Type: ABS compatibility (e.g., "C/ABS", "S/ABS")
 * - Bolt_Pattern: Wheel bolt pattern (e.g., "4 ROSCAS", "5")
 * - Drive_Type: Drive type (e.g., "2WD", "4WD", "AWD")
 * - Specifications: Technical specifications (TEXT field)
 */
export interface ExcelPartRow {
  _id?: string; // Hidden column (UUID)
  acr_sku: string;
  part_type: string;
  position_type?: string;
  abs_type?: string;
  bolt_pattern?: string;
  drive_type?: string;
  specifications?: string;
}

// ----------------------------------------------------------------------------
// Vehicle Application Row (Sheet 2: Vehicle_Applications)
// ----------------------------------------------------------------------------

/**
 * Vehicle application row structure for Excel export/import
 *
 * Columns:
 * - _id (hidden): UUID for tracking existing VAs on re-import
 * - _part_id (hidden): Foreign key to Parts._id
 * - ACR_SKU: ACR part number (joined from parts table, user-visible reference)
 * - Make: Vehicle make (e.g., "MAZDA", "NISSAN")
 * - Model: Vehicle model (e.g., "3", "NP300 FRONTIER")
 * - Start_Year: Application start year (e.g., 2004)
 * - End_Year: Application end year (e.g., 2009)
 */
export interface ExcelVehicleAppRow {
  _id?: string; // Hidden column (UUID)
  _part_id?: string; // Hidden column (UUID foreign key)
  acr_sku: string; // User-visible reference (Humberto maps by SKU)
  make: string;
  model: string;
  start_year: number;
  end_year: number;
}

// ----------------------------------------------------------------------------
// Cross Reference Row (Sheet 3: Cross_References)
// ----------------------------------------------------------------------------

/**
 * Cross reference row structure for Excel export/import
 *
 * Columns:
 * - _id (hidden): UUID for tracking existing CRs on re-import
 * - _acr_part_id (hidden): Foreign key to Parts._id
 * - ACR_SKU: ACR part number (joined from parts table, user-visible reference)
 * - Competitor_Brand: Competitor brand name (e.g., "NATIONAL", "ATV")
 * - Competitor_SKU: Competitor part number
 */
export interface ExcelCrossRefRow {
  _id?: string; // Hidden column (UUID)
  _acr_part_id?: string; // Hidden column (UUID foreign key)
  acr_sku: string; // User-visible reference (Humberto maps by SKU)
  competitor_brand?: string;
  competitor_sku: string;
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
  hasHiddenIds: boolean;
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
  crossReferences: ParsedSheet<ExcelCrossRefRow>;
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
