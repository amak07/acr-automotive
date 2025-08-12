// TypeScript interfaces for Excel processing - ACR Automotive
// Column mapping for Spanish Excel headers (both CATALOGACION and LISTA DE PRECIOS formats)

export interface ColumnMapping {
  id?: number;           // Column A: "#" (optional)
  acrSku: number;        // Column B: "ACR" (required)
  syd?: number;          // Column C: "SYD" (ignore for processing)
  competitorSku?: number; // Column D: "TMK " (optional)
  partType: number;      // Column E: "Clase" (required)
  position?: number;     // Column F: "Posicion" (optional)
  absType?: number;      // Column G: "Sistema" (optional)
  boltPattern?: number;  // Column H: "Birlos" (optional)
  driveType?: number;    // Column I: "Traccion" (optional)
  specifications?: number; // Column J: "Observaciones" (optional)
  make: number;          // Column K: "MARCA" (required)
  model: number;         // Column L: "APLICACIÓN " (required)
  yearRange: number;     // Column M: "AÑO " (required)
  imageUrl?: number;     // Column N: "URL IMAGEN " (optional)
}

// Raw Excel row data as read from spreadsheet
export interface ExcelRow {
  acrSku: string;        // ACR512342
  competitorSku?: string; // TM512342
  partType: string;      // MAZA
  position?: string;     // TRASERA, DELANTERA
  absType?: string;      // C/ABS, S/ABS
  boltPattern?: string;  // 5 ROSCAS, 4
  driveType?: string;    // 4X2, 4X4
  specifications?: string; // 28 ESTRIAS
  make: string;          // ACURA, HONDA
  model: string;         // MDX, PILOT
  yearRange: string;     // 2007-2013
  imageUrl?: string;     // URL or empty
  rowNumber: number;     // Excel row for error reporting
}

// Unique part data (753 expected from analysis)
export interface PartData {
  acrSku: string;
  competitorSku?: string;
  partType: string;
  position?: string;
  absType?: string;
  boltPattern?: string;
  driveType?: string;
  specifications?: string;
  imageUrl?: string;
  firstSeenAtRow: number; // For error reporting and conflict detection
}

// Vehicle application (2,335 expected from analysis)
export interface VehicleApplication {
  acrSku: string;        // Links to PartData
  make: string;
  model: string;
  yearRange: string;
  rowNumber: number;     // For error reporting
}

// Two-pass processing results
export interface ProcessingResult {
  uniqueParts: PartData[];           // 753 unique parts expected
  vehicleApplications: VehicleApplication[]; // 2,335 applications expected
  partDataConflicts: DataConflict[];
  applicationDuplicates: ApplicationDuplicate[];
  summary: {
    totalExcelRows: number;
    uniquePartsDiscovered: number;
    totalVehicleApplications: number;
    conflictingPartData: number;
    duplicateApplications: number;
    processingTimeMs: number;
  };
}

// Error and conflict reporting types
export interface DataConflict {
  acrSku: string;
  field: string;         // Which part attribute conflicts
  existingValue: string;
  newValue: string;
  existingRow: number;
  conflictRow: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface ApplicationDuplicate {
  acrSku: string;
  vehicle: string;       // "ACURA MDX 2007-2013"
  rowNumbers: number[];  // All rows with this duplicate
  reason: 'duplicate_vehicle_application';
}

export interface ParseError {
  row: number;
  column?: string;       // A, B, C...
  field?: string;        // acrSku, partType, etc.
  errorType: 'required' | 'duplicate' | 'invalid_format' | 'data_conflict';
  message: string;
  cellValue?: any;
  suggestion?: string;
}

// Excel file validation types
export interface ExcelFileInfo {
  fileName: string;
  fileSize: number;
  sheetCount: number;
  activeSheetName: string;
  headerRow: number;
  dataStartRow: number;
  totalRows: number;
  detectedFormat: 'CATALOGACION' | 'LISTA_DE_PRECIOS' | 'UNKNOWN';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
  fileInfo: ExcelFileInfo;
  columnMapping?: ColumnMapping;
}

// Database import types
export interface ImportResult {
  success: boolean;
  partsInserted: number;
  applicationsInserted: number;
  crossReferencesInserted: number;
  errors: string[];
  importTimeMs: number;
}

// Spanish column header mappings
export const SPANISH_HEADERS = {
  // Primary mappings for CATALOGACION format
  id: ['#', 'No.', 'Num', 'ID'],
  acrSku: ['ACR', 'SKU ACR', 'CODIGO ACR'],
  syd: ['SYD', 'CODIGO SYD'],
  competitorSku: ['TMK', 'TMK ', 'COMPETIDOR', 'SKU COMP'],
  partType: ['Clase', 'CLASE', 'TIPO', 'CATEGORIA'],
  position: ['Posicion', 'POSICION', 'UBICACION'],
  absType: ['Sistema', 'SISTEMA', 'ABS', 'TIPO ABS'],
  boltPattern: ['Birlos', 'BIRLOS', 'TORNILLOS', 'PERNOS'],
  driveType: ['Traccion', 'TRACCION', 'TIPO TRACCION'],
  specifications: ['Observaciones', 'OBSERVACIONES', 'ESPECIFICACIONES', 'NOTAS'],
  make: ['MARCA', 'Marca', 'FABRICANTE'],
  model: ['APLICACIÓN', 'APLICACION', 'MODELO', 'VEHICULO'],
  yearRange: ['AÑO', 'ANO', 'AÑOS', 'PERIODO'],
  imageUrl: ['URL IMAGEN', 'IMAGEN', 'FOTO', 'URL']
} as const;

export type ColumnMappingKey = keyof typeof SPANISH_HEADERS;