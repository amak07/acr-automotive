import * as XLSX from "xlsx";
import {
  CATALOGACION_COLUMNS,
  CatalogacionResult,
  CatalogacionRow,
  EXCEL_STRUCTURE,
  PartData,
  VehicleApplication,
} from "./types";
import {
  ConflictReport,
  ProcessingResult,
} from "./conflict-types";
import { ConflictFactory } from "./conflict-utils";

export class CatalogacionParser {
  /**
   * Parse CATALOGACION Excel file
   */
  static parseFile(
    fileBuffer: ArrayBuffer | Buffer,
    validAcrSkus: Set<string>
  ): ProcessingResult<CatalogacionResult> {
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

      const conflicts: ConflictReport[] = [];

      // Create conflict report for orphaned SKUs (if any)
      if (orphaned.length > 0) {
        const orphanedConflict =
          ConflictFactory.createOrphanedApplicationConflict(orphaned);
        conflicts.push(orphanedConflict);
      }

      // Step 5: Transform to parts and applications
      const { parts, applications } =
        this.transformToPartsAndApplications(valid);

      // Step 6: Build CatalogacionResult
      const catalogacionResult: CatalogacionResult = {
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

      // Step 7: Build ProcessingResult wrapper
      const processingResult: ProcessingResult<CatalogacionResult> = {
        success: true, // No blocking conflicts for orphaned SKUs
        data: catalogacionResult,
        conflicts,
        summary: {
          processingTimeMs: Date.now() - startTime,
          totalRows: rawRows.length,
          validRecords: valid.length,
          skippedRows: catalogacionRows.length - valid.length,
          conflictCounts: {
            errors: 0,
            warnings: conflicts.filter((c) => c.severity === "warning").length,
            info: conflicts.filter((c) => c.severity === "info").length,
          },
        },
        canProceed: true,
      };

      return processingResult;
    } catch (error) {
      throw new Error(`Failed to parse CATALOGACION file: ${error}`);
    }
  }

  /**
   * Extract data rows from worksheet, skipping header rows
   */
  private static extractDataRows(worksheet: XLSX.WorkSheet): any[][] {
    // Get worksheet range to understand the data boundaries
    const range = worksheet["!ref"];
    if (!range) {
      return [];
    }

    // Start from DATA_START_ROW (row 2)
    const worksheetRange = XLSX.utils.decode_range(range);
    const endRow = worksheetRange.e.r + 1;

    const data = XLSX.utils.sheet_to_json(worksheet, {
      range: `A${EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW}:N${endRow}`,
      header: 1,
    });

    return data as any[][];
  }

  /**
   * Parse raw Excel rows into typed CatalogacionRow objects
   */
  private static parseRows(rawRows: any[][]): CatalogacionRow[] {
    const catalogacionRows: CatalogacionRow[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = EXCEL_STRUCTURE.CATALOGACION.DATA_START_ROW + i;

      try {
        const catalogacionRow = this.parseRow(row, rowNumber);
        if (catalogacionRow) {
          catalogacionRows.push(catalogacionRow);
        }
      } catch (error) {
        continue;
      }
    }

    return catalogacionRows;
  }

  /**
   * Parse a single Excel row into CatalogacionRow
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
   */
  private static isValidAcrSku(sku: string): boolean {
    return sku.startsWith("ACR");
  }

  /**
   * Validate ACR SKUs against PRECIOS master list
   */
  private static validateAcrSkus(
    catalogacionRows: CatalogacionRow[],
    validAcrSkus: Set<string>
  ): { valid: CatalogacionRow[]; orphaned: string[] } {
    const valid: CatalogacionRow[] = [];
    const orphanedSet = new Set<string>();

    for (const row of catalogacionRows) {
      if (validAcrSkus.has(row.acrSku)) {
        valid.push(row);
      } else {
        orphanedSet.add(row.acrSku);
      }
    }

    return {
      valid,
      orphaned: Array.from(orphanedSet),
    };
  }

  /**
   * Creates Parts data and Vehicle Applications from parsed catalogacion rows.
   */
  private static transformToPartsAndApplications(
    catalogacionRows: CatalogacionRow[]
  ): { parts: PartData[]; applications: VehicleApplication[] } {
    const partsMap = new Map<string, PartData>();
    const applications: VehicleApplication[] = [];

    for (const row of catalogacionRows) {
      if (!partsMap.has(row.acrSku)) {
        const part: PartData = {
          acrSku: row.acrSku,
          partType: row.partType,
          absType: row.absType,
          boltPattern: row.boltPattern,
          driveType: row.driveType,
          position: row.position,
          specifications: row.specifications,
          firstSeenAtRow: row.rowNumber,
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
