// TypeScript interfaces for Excel processing - ACR Automotive

export const PRECIOS_COLUMNS = {
  ID: 1,
  ACR_SKU: 2,
  NATIONAL: 3,
  ATV: 4,
  SYD: 5,
  TMK: 6,
  GROB: 7,
  RACE: 8,
  OEM: 9,
  OEM2: 10,
  GMB: 11,
  GSP: 12,
  FAG: 13,
};

export const CATALOGACION_COLUMNS = {
  ID: 1,
  ACR_SKU: 2,
  SYD: 3,
  TMK: 4,
  PART_TYPE: 5,
  POSICION: 6,
  SISTEMA: 7,
  BIRLOS: 8,
  TRACCION: 9,
  OBSERVACIONES: 10,
  MAKE: 11,
  MODEL: 12,
  YEAR: 13,
  IMAGE_URL: 14,
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
  startYear: string;
  endYear: string;
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
  startYear: number;
  endYear: number;
  rowNumber: number; // For error reporting
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
