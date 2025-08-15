// TypeScript interfaces for Excel processing - ACR Automotive
//  Business Understanding:
//   - CATALOGACION = Vehicle applications (one-to-many: one part fits many vehicles)
//   - PRECIOS = Cross-reference mappings (competitor SKUs → ACR SKUs)
//   - Two separate workflows, not one combined process

export const PRECIOS_COLUMNS = {
  ID: 1, // column A (IGNORE THIS COLUMN)
  ACR_SKU: 2, // column B
  NATIONAL: 3, // column C
  ATV: 4, // column D
  SYD: 5, // column E
  TMK: 6, // col F
  GROB: 7, // col G
  RACE: 8, // col H
  OEM: 9, // col I
  OEM2: 10, // col J
  GMB: 11, // col K
  GSP: 12, // col L
  FAG: 13, // col M
  // future competitor columns go here...
};

export const CATALOGACION_COLUMNS = {
  ID: 1, // column A (IGNORE THIS COLUMN)
  ACR_SKU: 2, // col B
  SYD: 3, // col C  (IGNORE THIS COLUMN)
  TMK: 4, // col D (IGNORE THIS COLUMN)
  PART_TYPE: 5, // col E "CLASE"
  POSICION: 6, // col F
  SISTEMA: 7, // col G
  BIRLOS: 8, // col H
  TRACCION: 9, // col I
  OBSERVACIONES: 10, // col J
  MAKE: 11, // col K "MARCA",
  MODEL: 12, // col L "APLICACION"
  YEAR: 13, // col M "ANO",
  IMAGE_URL: 14, // col N (IGNORE THIS COLUMN)
};

export const EXCEL_STRUCTURE = {
  PRECIOS: {
    HEADER_ROW: 8,
    DATA_START_ROW: 9,
  },
  CATALOGACION: {
    HEADER_ROW: 1,
    DATA_START_ROW: 2,
  },
} as const;

export const competitorBrands = [
  {
    brand: "N° NATIONAL",
    column: PRECIOS_COLUMNS.NATIONAL,
  },
  {
    brand: "ATV",
    column: PRECIOS_COLUMNS.ATV,
  },
  {
    brand: "SYD",
    column: PRECIOS_COLUMNS.SYD,
  },
  {
    brand: "TMK",
    column: PRECIOS_COLUMNS.TMK,
  },
  {
    brand: "GROB",
    column: PRECIOS_COLUMNS.GROB,
  },
  {
    brand: "RACE",
    column: PRECIOS_COLUMNS.RACE,
  },
  {
    brand: "OEM",
    column: PRECIOS_COLUMNS.OEM,
  },
  {
    brand: "OEM 2",
    column: PRECIOS_COLUMNS.OEM2,
  },
  {
    brand: "GMB",
    column: PRECIOS_COLUMNS.GMB,
  },
  {
    brand: "GSP",
    column: PRECIOS_COLUMNS.GSP,
  },
  {
    brand: "FAG",
    column: PRECIOS_COLUMNS.FAG,
  },
];

// Raw row from PRECIOS Excel (before transformation)
export interface PreciosRow {
  acrSku: string;
  competitors: Array<{
    brand: string;
    sku: string | null; // null for empty cells
  }>;
  rowNumber: number;
}

// Raw row from CATALOGACION Excel (before transformation)
export interface CatalogacionRow {
  acrSku: string;
  partType: string;
  position?: string;
  absType?: string;
  boltPattern?: string;
  driveType?: string;
  specifications?: string;
  make: string;
  model: string;
  yearRange: string;
  rowNumber: number;
}

// processed vehicle application data from CATALOGACION + PRECIOS
export interface PartData {
  acrSku: string;
  partType: string;
  position?: string;
  absType?: string;
  boltPattern?: string;
  driveType?: string;
  specifications?: string;
  imageUrl?: string;
  firstSeenAtRow: number; // For error reporting and conflict detection
}

// processed vehicle application data from CATALOGACION
export interface VehicleApplication {
  acrSku: string; // Links to PartData
  make: string;
  model: string;
  yearRange: string;
  rowNumber: number; // For error reporting
}

export interface ParseError {
  row: number;
  field?: string; // acrSku, partType, etc.
  errorType: "required" | "duplicate" | "invalid_format" | "data_conflict";
  message: string;
  cellValue?: any;
  suggestion?: string;
}

export interface CrossReference {
  acrSku: string;
  competitorBrand: string; // "NATIONAL", "TMK", etc
  competitorSku: string;
}

export interface PreciosResult {
  acrSkus: Set<string>;
  crossReferences: CrossReference[];
  summary: {
    totalParts: number;
    totalCrossReferences: number;
    processingTimeMs: number;
  };
}

export interface CatalogacionResult {
  parts: PartData[];
  applications: VehicleApplication[];
  orphanedApplications: string[]; // ACR SKUs not in PRECIOS
  summary: {
    totalParts: number;
    totalApplications: number;
    orphanedCount: number;
    processingTimeMs: number;
  };
}
