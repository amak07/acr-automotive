import * as XLSX from "xlsx";
import {
  CATALOGACION_COLUMNS,
  CatalogacionResult,
  CatalogacionRow,
  EXCEL_STRUCTURE,
  PartData,
  VehicleApplication,
} from "./types";

export class CatalogacionParser {
  /**
   * Main entry point - similar to PreciosParser.parseFile()
   * @param fileBuffer - Raw Excel file buffer
   * @param validAcrSkus - Set of valid ACR SKUs from PRECIOS parser
   */
  static parseFile(
    fileBuffer: ArrayBuffer | Buffer,
    validAcrSkus: Set<string>
  ): CatalogacionResult {
    const startTime = Date.now();

    try {
      // Step 1: Read Excel workbook (same as PRECIOS)
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Step 2: Extract raw data rows
      const rawRows = this.extractDataRows(worksheet);

      // Step 3: Parse into CatalogacionRow objects
      const catalogacionRows = this.parseRows(rawRows);

      // Step 4: Validate ACR SKUs (NEW - not in PRECIOS)
      const { valid, orphaned } = this.validateAcrSkus(
        catalogacionRows,
        validAcrSkus
      );

      // Step 5: Transform to parts and applications (NEW - different from PRECIOS)
      const { parts, applications } =
        this.transformToPartsAndApplications(valid);

      // Step 6: Return result with summary
      return {
        parts,
        applications,
        orphanedApplications: orphaned,
        summary: {
          totalParts: parts.length,
          totalApplications: applications.length,
          orphanedCount: orphaned.length,
          processingTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse CATALOGACION file: ${error}`);
    }
  }

  /**
   * Extract data rows from worksheet, skipping header rows
   *
   * @param worksheet - XLSX worksheet object
   * @returns Array of raw Excel rows (arrays of cell values)
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    // Get worksheet range to understand the data boundaries
    // Also checks for undefined, or corrupted, worksheet.
    const range = worksheet["!ref"];
    if (!range) {
      return []; // Empty worksheet
    }

    // Start from DATA_START_ROW (row 2)
    // Get array of arrays starting from row 2
    // Need to specify end row - use the worksheet range
    const worksheetRange = XLSX.utils.decode_range(range);
    const endRow = worksheetRange.e.r + 1; // Convert 0-based to 1-based

    const data = XLSX.utils.sheet_to_json(worksheet, {
      range: `A${EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW}:N${endRow}`,
      header: 1,
    });

    return data as any[][];
  }

  /**
   * Parse raw Excel rows into typed CatalogacionRow objects
   *
   * @param rawRows - Array of raw Excel rows
   * @returns Array of typed CatalogacionRow objects
   */
  private static parseRows(rawRows: any[][]): CatalogacionRow[] {
    const catalogacionRows: CatalogacionRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW + i;

      try {
        // Parse single row
        const catalogacionRow = this.parseRow(row, rowNumber);
        if (catalogacionRow) {
          catalogacionRows.push(catalogacionRow);
        }
      } catch (error) {
        // Skip invalid rows silently in production
        continue;
      }
    }

    return catalogacionRows;
  }

  /**
   * Parse a single Excel row into CatalogacionRow
   *
   * @param row - Raw Excel row (array of cell values)
   * @param rowNumber - Excel row number for error reporting
   * @returns CatalogacionRow object or null if row should be skipped
   */
  private static parseRow(
    row: any[],
    rowNumber: number
  ): CatalogacionRow | null {
    // Extract ACR SKU from column B
    const acrSku = row[CATALOGACION_COLUMNS.ACR_SKU - 1]; // Convert 1-based to 0-based

    // Skip empty rows or rows without ACR SKU
    if (!acrSku || typeof acrSku !== "string") {
      return null;
    }

    // Skip rows with invalid ACR SKU format
    if (!this.isValidAcrSku(acrSku.trim())) {
      return null;
    }

    // Extract vehicle data (make, model, year, part type)
    const partType = row[CATALOGACION_COLUMNS.PART_TYPE - 1];
    const make = row[CATALOGACION_COLUMNS.MAKE - 1];
    const model = row[CATALOGACION_COLUMNS.MODEL - 1];
    const yearRange = row[CATALOGACION_COLUMNS.YEAR - 1];
    const absType = row[CATALOGACION_COLUMNS.SISTEMA - 1];
    const boltPattern = row[CATALOGACION_COLUMNS.BIRLOS - 1];
    const driveType = row[CATALOGACION_COLUMNS.TRACCION - 1];
    const position = row[CATALOGACION_COLUMNS.POSICION - 1];
    const specifications = row[CATALOGACION_COLUMNS.OBSERVACIONES - 1];

    // Validate required fields
    if (!partType || !make || !model || !yearRange) {
      return null; // Skip rows missing required fields
    }

    // Clean and validate required string fields
    const cleanPartType = partType.toString().trim();
    const cleanMake = make.toString().trim();
    const cleanModel = model.toString().trim();
    const cleanYearRange = yearRange.toString().trim();

    if (!cleanPartType || !cleanMake || !cleanModel || !cleanYearRange) {
      return null; // Skip rows with empty required fields
    }

    // Clean optional fields (convert empty strings to undefined)
    const cleanPosition = (position && position.toString().trim()) || undefined;
    const cleanAbsType = (absType && absType.toString().trim()) || undefined;
    const cleanBoltPattern =
      (boltPattern && boltPattern.toString().trim()) || undefined;
    const cleanDriveType =
      (driveType && driveType.toString().trim()) || undefined;
    const cleanSpecifications =
      (specifications && specifications.toString().trim()) || undefined;

    return {
      acrSku: acrSku.trim(),
      partType: cleanPartType,
      make: cleanMake,
      model: cleanModel,
      yearRange: cleanYearRange,
      position: cleanPosition,
      absType: cleanAbsType,
      boltPattern: cleanBoltPattern,
      driveType: cleanDriveType,
      specifications: cleanSpecifications,
      rowNumber,
    };
  }

  /**
   * Validate ACR SKU format (should start with "ACR")
   *
   * @param sku - SKU to validate
   * @returns true if valid format
   */
  private static isValidAcrSku(sku: string): boolean {
    // Check if SKU starts with "ACR"
    return sku.startsWith("ACR");
  }

  /**
   * Validate ACR SKUs against PRECIOS master list
   * @param catalogacionRows - Parsed CATALOGACION rows
   * @param validAcrSkus - Set of valid ACR SKUs from PRECIOS
   * @returns Object with valid rows and orphaned SKU list
   */
  private static validateAcrSkus(
    catalogacionRows: CatalogacionRow[],
    validAcrSkus: Set<string>
  ): { valid: CatalogacionRow[]; orphaned: string[] } {
    // TODO: Filter rows and track orphaned SKUs
    const valid: CatalogacionRow[] = [];
    const orphanedSet = new Set<string>(); // use SET to avoid duplicate SKU names

    for (const row of catalogacionRows) {
      if (validAcrSkus.has(row.acrSku)) {
        valid.push(row);
      } else {
        orphanedSet.add(row.acrSku); // track unique orphaned SKUs.
      }
    }

    return {
      valid,
      orphaned: Array.from(orphanedSet),
    };
  }

  /**
   * Creates Parts data and Vehicle Applications from parsed catalogacion rows.
   * @param catalogacionRows - Parsed CATALOGACION rows
   * @returns Object with a list of Parts and Vehicle Applications
   */
  private static transformToPartsAndApplications(
    catalogacionRows: CatalogacionRow[]
  ): { parts: PartData[]; applications: VehicleApplication[] } {
    const partsMap = new Map<string, PartData>(); // Track unique parts
    const applications: VehicleApplication[] = [];

    for (const row of catalogacionRows) {
      if (!partsMap.has(row.acrSku)) {
        // Create part data if first time seeing this ACR SKU
        const part: PartData = {
          acrSku: row.acrSku,
          partType: row.partType,
          absType: row.absType,
          boltPattern: row.boltPattern,
          driveType: row.driveType,
          position: row.position,
          specifications: row.specifications,
          firstSeenAtRow: row.rowNumber, // what about image?
        };
        partsMap.set(row.acrSku, part);
      }

      // Create vehicle application for every row
      const vehicleApplication: VehicleApplication = {
        acrSku: row.acrSku,
        make: row.make,
        model: row.model,
        yearRange: row.yearRange,
        rowNumber: row.rowNumber,
      };
      applications.push(vehicleApplication);
    }

    return { parts: Array.from(partsMap.values()), applications };
  }
}
