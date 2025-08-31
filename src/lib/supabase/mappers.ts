import {
  PreciosResult,
  CatalogacionResult,
  CrossReference,
} from "@/lib/excel/types";
import { DatabasePart, DatabaseVehicleApp } from "./utils";

// These are the exact types Supabase expects

/**
 * Maps PRECIOS Excel results to database-ready objects
 * Creates parts with minimal data (just ACR SKU), returns cross references from preciosResult for future processing.
 *
 * @param preciosResult - Output from PreciosParser.parseFile()
 * @returns Database-ready parts and cross-references arrays
 */
export function mapPrecios_ACRSkus_ToDatabase(preciosResult: PreciosResult): {
  parts: DatabasePart[];
  crossRefs: CrossReference[];
} {
  const parts: DatabasePart[] = [];
  const acrSkus = Array.from(preciosResult.acrSkus);
  acrSkus.forEach((item) => {
    const part: DatabasePart = {
      acr_sku: item,
      part_type: "PENDING",
    };
    parts.push(part);
  });

  return {
    parts,
    crossRefs: preciosResult.crossReferences,
  };
}

/**
 * Maps CATALOGACION Excel results to database-ready vehicle applications
 * Also updates existing parts with detailed information from CATALOGACION
 *
 * @param catalogacionResult - Output from CatalogacionParser.parseFile()
 * @param existingParts - Parts already in database (from PRECIOS import)
 * @returns Database-ready vehicle applications array + updated parts
 */
export function mapCatalogacionToDatabase(
  catalogacionResult: CatalogacionResult,
  existingParts: DatabasePart[] // Parts we created from PRECIOS
): {
  vehicleApps: DatabaseVehicleApp[];
  updatedParts: DatabasePart[]; // Parts with enhanced details from CATALOGACION
} {
  // This function will be implemented after mapPreciosToDatabase is complete
  // It's more complex because it needs to:
  // 1. Match CATALOGACION parts to existing PRECIOS parts by ACR SKU
  // 2. Update parts with detailed info (part_type, position_type, etc.)
  // 3. Create vehicle applications linked to the correct part IDs

  return {
    vehicleApps: [],
    updatedParts: [],
  };
}
