import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase/client";
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  CROSS_REFERENCES_COLUMNS, // @deprecated - kept for backward compatibility
  ALIASES_COLUMNS,
  BRAND_COLUMN_MAP,
  IMAGE_VIEW_TYPE_MAP,
  WORKFLOW_STATUS_DISPLAY,
  ExportFilters,
  // Styling imports
  PARTS_COLUMN_GROUPS,
  VEHICLE_APPS_COLUMN_GROUPS,
  ALIASES_COLUMN_GROUPS,
  ROW_HEIGHTS,
  addGroupHeaderRow,
  addColumnHeaderRow,
  addInstructionsRow,
  applyDataRowStyle,
  PARTS_INSTRUCTIONS,
  VEHICLE_APPS_INSTRUCTIONS,
  ALIASES_INSTRUCTIONS,
} from "@/services/excel/shared";

// Type for cross-refs grouped by part and brand
type CrossRefsByPart = Map<string, Map<string, string[]>>;

// Type for images grouped by part and view_type
type ImagesByPart = Map<string, Record<string, string>>;

/**
 * ExcelExportService
 *
 * Handles Excel export of catalog data in standardized 2-sheet format (Phase 3).
 * Supports both full catalog export and filtered export based on search criteria.
 * Uses ExcelJS library for full Excel feature support including hidden columns.
 *
 * Sheet Structure (Phase 3 - 2 sheets):
 * 1. Parts - All/filtered parts with cross-refs and images inline
 *    - Core: _id (hidden), ACR_SKU, Part_Type, Position_Type, ABS_Type, Bolt_Pattern, Drive_Type, Specifications
 *    - Cross-refs: National_SKUs, ATV_SKUs, SYD_SKUs, TMK_SKUs, GROB_SKUs, RACE_SKUs, OEM_SKUs, OEM_2_SKUs, GMB_SKUs, GSP_SKUs, FAG_SKUs
 *    - Images: Image_URL_Front, Image_URL_Back, Image_URL_Top, Image_URL_Other, 360_Viewer_Status
 *
 * 2. Vehicle Applications - Vehicle fitment data for exported parts
 *    Columns: _id (hidden), _part_id (hidden), ACR_SKU, Make, Model, Start_Year, End_Year
 *
 * Cross-Reference Format:
 * - Each brand column contains semicolon-separated SKUs (e.g., "TM-123;TM-456")
 * - Use [DELETE]SKU to mark a SKU for explicit deletion on import
 *
 * Image URL Format:
 * - URLs from Supabase Storage or external sources
 * - 360_Viewer_Status shows "Confirmed" if part has 360 viewer
 *
 * Export-Import Loop:
 * 1. User exports to get IDs (all data or filtered results)
 * 2. User edits data in Excel (using ACR_SKU for readability)
 * 3. User imports - system matches by hidden _id columns and applies changes
 */
export class ExcelExportService {
  /**
   * Fetch all rows from a table using pagination
   *
   * PostgREST has a server-side max-rows limit (default 1000).
   * This method paginates through all results using range queries.
   *
   * @param tableName - Table to query
   * @param orderBy - ORDER BY clause
   * @returns All rows from the table
   */
  private async fetchAllRows(
    tableName: string,
    orderBy: string
  ): Promise<any[]> {
    // Exclude computed columns from parts table, include has_360_viewer and workflow_status
    let selectColumns = "*";
    if (tableName === "parts") {
      selectColumns =
        "id, acr_sku, workflow_status, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications, has_360_viewer";
    }

    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectColumns)
        .order(orderBy, { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch ${tableName}: ${error.message}`);
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE; // If we got a full page, there might be more
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Export all catalog data to Excel workbook
   *
   * Phase 3: 2-sheet format with inline cross-refs and images
   *
   * @returns Excel file buffer ready for download
   */
  async exportAllData(): Promise<Buffer> {
    // Fetch all data from database
    const [parts, vehicles, crossRefsByPart, imagesByPart, aliases] =
      await Promise.all([
        this.fetchAllRows("parts", "acr_sku"),
        this.fetchVehiclesWithSku(),
        this.fetchCrossRefsByPart(),
        this.fetchImagesByPart(),
        this.fetchAllAliases(),
      ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ACR Automotive";
    workbook.created = new Date();

    // Add Parts sheet (with inline cross-refs and images)
    this.addPartsSheet(workbook, parts, crossRefsByPart, imagesByPart);

    // Add Vehicle Applications sheet
    this.addVehiclesSheet(workbook, vehicles);

    // Add Vehicle Aliases sheet (Phase 4A)
    this.addAliasesSheet(workbook, aliases);

    // Note: Cross References sheet removed in Phase 3 (now inline in Parts sheet)

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  /**
   * Export filtered catalog data to Excel workbook
   *
   * Phase 3: 2-sheet format with inline cross-refs and images
   *
   * Filters parts based on search criteria, then includes all related
   * vehicle applications for the filtered parts.
   *
   * @param filters - Search filters to apply
   * @returns Excel file buffer ready for download
   */
  async exportFiltered(filters: ExportFilters): Promise<Buffer> {
    // Fetch filtered parts
    const parts = await this.fetchFilteredParts(filters);

    // Extract part IDs for relationship queries
    const partIds = parts.map((p) => p.id);

    // If no parts match, return empty workbook with aliases only
    if (partIds.length === 0) {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ACR Automotive";
      workbook.created = new Date();

      this.addPartsSheet(workbook, [], new Map(), new Map());
      this.addVehiclesSheet(workbook, []);
      const aliases = await this.fetchAllAliases();
      this.addAliasesSheet(workbook, aliases);

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }

    // Fetch vehicle applications, cross-refs, images, and aliases for filtered parts
    const [vehicles, crossRefsByPart, imagesByPart, aliases] =
      await Promise.all([
        this.fetchRowsByPartIds("vehicle_applications", partIds),
        this.fetchCrossRefsByPartIds(partIds),
        this.fetchImagesByPartIds(partIds),
        this.fetchAllAliases(),
      ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ACR Automotive";
    workbook.created = new Date();

    // Add sheets
    this.addPartsSheet(workbook, parts, crossRefsByPart, imagesByPart);
    this.addVehiclesSheet(workbook, vehicles);
    this.addAliasesSheet(workbook, aliases);

    // Note: Cross References sheet removed in Phase 3 (now inline in Parts sheet)

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  /**
   * Fetch parts with filters applied
   */
  private async fetchFilteredParts(filters: ExportFilters): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("parts")
        .select(
          "id, acr_sku, workflow_status, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications, has_360_viewer"
        )
        .order("acr_sku", { ascending: true });

      // Apply filters
      if (filters.search) {
        query = query.or(
          `acr_sku.ilike.%${filters.search}%,part_type.ilike.%${filters.search}%,specifications.ilike.%${filters.search}%`
        );
      }
      if (filters.part_type) {
        query = query.eq("part_type", filters.part_type);
      }
      if (filters.position_type) {
        query = query.eq("position_type", filters.position_type);
      }
      if (filters.abs_type) {
        query = query.eq("abs_type", filters.abs_type);
      }
      if (filters.drive_type) {
        query = query.eq("drive_type", filters.drive_type);
      }
      if (filters.bolt_pattern) {
        query = query.eq("bolt_pattern", filters.bolt_pattern);
      }

      const { data, error } = await query.range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch filtered parts: ${error.message}`);
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch all vehicle aliases (Phase 4A)
   */
  private async fetchAllAliases(): Promise<any[]> {
    const { data, error } = await supabase
      .from("vehicle_aliases")
      .select("id, alias, canonical_name, alias_type")
      .order("alias_type, alias", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch vehicle aliases: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetch all vehicle applications with ACR_SKU (joined from parts table)
   */
  private async fetchVehiclesWithSku(): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("vehicle_applications")
        .select("*, parts!inner(acr_sku)")
        .order("part_id, make, model, start_year", { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(
          `Failed to fetch vehicle applications: ${error.message}`
        );
      }

      if (data && data.length > 0) {
        // Flatten the nested parts.acr_sku into top-level acr_sku
        const flattened = data.map((row: any) => ({
          ...row,
          acr_sku: row.parts?.acr_sku || "",
          parts: undefined, // Remove nested object
        }));
        allRows = allRows.concat(flattened);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch all cross references with ACR_SKU (joined from parts table)
   */
  private async fetchCrossRefsWithSku(): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("cross_references")
        .select(
          "id, acr_part_id, competitor_brand, competitor_sku, parts!inner(acr_sku)"
        )
        .order("acr_part_id, competitor_brand, competitor_sku", {
          ascending: true,
        })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch cross references: ${error.message}`);
      }

      if (data && data.length > 0) {
        // Flatten the nested parts.acr_sku into top-level acr_sku
        const flattened = data.map((row: any) => ({
          ...row,
          acr_sku: row.parts?.acr_sku || "",
          parts: undefined, // Remove nested object
        }));
        allRows = allRows.concat(flattened);
        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Fetch all cross-references grouped by part ID and brand
   * Returns: Map<partId, Map<brand, sku[]>>
   */
  private async fetchCrossRefsByPart(): Promise<CrossRefsByPart> {
    const crossRefs = await this.fetchCrossRefsWithSku();
    const result: CrossRefsByPart = new Map();

    for (const cr of crossRefs) {
      const partId = cr.acr_part_id;
      const brand = (cr.competitor_brand || "").toUpperCase();
      const sku = cr.competitor_sku;

      if (!result.has(partId)) {
        result.set(partId, new Map());
      }
      const partMap = result.get(partId)!;

      if (!partMap.has(brand)) {
        partMap.set(brand, []);
      }
      partMap.get(brand)!.push(sku);
    }

    return result;
  }

  /**
   * Fetch all images grouped by part ID and view_type
   * Returns: Map<partId, { front?: url, back?: url, top?: url, other?: url }>
   */
  private async fetchImagesByPart(): Promise<ImagesByPart> {
    const PAGE_SIZE = 1000;
    const result: ImagesByPart = new Map();
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("part_images")
        .select("part_id, image_url, view_type")
        .order("part_id, display_order", { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch part images: ${error.message}`);
      }

      if (data && data.length > 0) {
        for (const img of data) {
          const partId = img.part_id;
          const viewType = img.view_type || "other";
          const url = img.image_url;

          if (!result.has(partId)) {
            result.set(partId, {});
          }
          const partImages = result.get(partId)!;

          // Only store first image per view_type (by display_order)
          if (!partImages[viewType]) {
            partImages[viewType] = url;
          }
        }

        start += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    return result;
  }

  /**
   * Fetch vehicle applications or cross-references by part IDs (with ACR_SKU joined)
   */
  private async fetchRowsByPartIds(
    tableName: string,
    partIds: string[]
  ): Promise<any[]> {
    const PAGE_SIZE = 1000;
    let allRows: any[] = [];

    // Process part IDs in chunks to avoid URL length limits
    const CHUNK_SIZE = 100; // Max 100 IDs per query
    for (let i = 0; i < partIds.length; i += CHUNK_SIZE) {
      const chunk = partIds.slice(i, i + CHUNK_SIZE);

      let start = 0;
      let hasMore = true;

      while (hasMore) {
        const partIdColumn =
          tableName === "vehicle_applications" ? "part_id" : "acr_part_id";

        // Exclude computed columns from cross_references
        const selectColumns =
          tableName === "cross_references"
            ? "id, acr_part_id, competitor_brand, competitor_sku, parts!inner(acr_sku)"
            : "*, parts!inner(acr_sku)";

        const { data, error } = await supabase
          .from(tableName)
          .select(selectColumns)
          .in(partIdColumn, chunk)
          .range(start, start + PAGE_SIZE - 1);

        if (error) {
          throw new Error(
            `Failed to fetch ${tableName} by part IDs: ${error.message}`
          );
        }

        if (data && data.length > 0) {
          // Flatten the nested parts.acr_sku into top-level acr_sku
          const flattened = data.map((row: any) => ({
            ...row,
            acr_sku: row.parts?.acr_sku || "",
            parts: undefined, // Remove nested object
          }));
          allRows = allRows.concat(flattened);
          start += PAGE_SIZE;
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }
    }

    return allRows;
  }

  /**
   * Fetch cross-references for specific part IDs, grouped by part and brand
   */
  private async fetchCrossRefsByPartIds(
    partIds: string[]
  ): Promise<CrossRefsByPart> {
    const result: CrossRefsByPart = new Map();
    const CHUNK_SIZE = 100;

    for (let i = 0; i < partIds.length; i += CHUNK_SIZE) {
      const chunk = partIds.slice(i, i + CHUNK_SIZE);

      const { data, error } = await supabase
        .from("cross_references")
        .select("acr_part_id, competitor_brand, competitor_sku")
        .in("acr_part_id", chunk);

      if (error) {
        throw new Error(
          `Failed to fetch cross-references by part IDs: ${error.message}`
        );
      }

      if (data) {
        for (const cr of data) {
          const partId = cr.acr_part_id;
          const brand = (cr.competitor_brand || "").toUpperCase();
          const sku = cr.competitor_sku;

          if (!result.has(partId)) {
            result.set(partId, new Map());
          }
          const partMap = result.get(partId)!;

          if (!partMap.has(brand)) {
            partMap.set(brand, []);
          }
          partMap.get(brand)!.push(sku);
        }
      }
    }

    return result;
  }

  /**
   * Fetch images for specific part IDs, grouped by part and view_type
   */
  private async fetchImagesByPartIds(partIds: string[]): Promise<ImagesByPart> {
    const result: ImagesByPart = new Map();
    const CHUNK_SIZE = 100;

    for (let i = 0; i < partIds.length; i += CHUNK_SIZE) {
      const chunk = partIds.slice(i, i + CHUNK_SIZE);

      const { data, error } = await supabase
        .from("part_images")
        .select("part_id, image_url, view_type")
        .in("part_id", chunk)
        .order("display_order", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch images by part IDs: ${error.message}`);
      }

      if (data) {
        for (const img of data) {
          const partId = img.part_id;
          const viewType = img.view_type || "other";
          const url = img.image_url;

          if (!result.has(partId)) {
            result.set(partId, {});
          }
          const partImages = result.get(partId)!;

          // Only store first image per view_type (by display_order)
          if (!partImages[viewType]) {
            partImages[viewType] = url;
          }
        }
      }
    }

    return result;
  }

  /**
   * Add Parts sheet to workbook (Phase 3: with inline cross-refs and images)
   * Styled with group headers, column headers, instructions row, and alternating data rows
   *
   * Row Structure:
   * - Row 1: Group headers (merged cells for logical groupings)
   * - Row 2: Column headers
   * - Row 3: Instructions row (help text for each column)
   * - Row 4+: Data rows with alternating colors
   */
  private addPartsSheet(
    workbook: ExcelJS.Workbook,
    parts: any[],
    crossRefsByPart: CrossRefsByPart,
    imagesByPart: ImagesByPart,
    locale: "en" | "es" = "es",
    baseUrl: string = ""
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.PARTS);

    // Define columns (widths and keys only - headers added manually for styling)
    worksheet.columns = PARTS_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
      hidden: col.hidden,
    }));

    // Row 1: Group headers (merged cells for logical groupings)
    addGroupHeaderRow(worksheet, PARTS_COLUMNS, PARTS_COLUMN_GROUPS);

    // Row 2: Column headers with styling
    addColumnHeaderRow(worksheet, PARTS_COLUMNS);

    // Row 3: Instructions row with help text
    addInstructionsRow(
      worksheet,
      PARTS_COLUMNS,
      PARTS_INSTRUCTIONS[locale],
      baseUrl
    );

    // Row 4+: Data rows with alternating colors
    parts.forEach((part, rowIndex) => {
      const partId = part.id;

      // Get cross-refs for this part, grouped by brand
      const partCrossRefs = crossRefsByPart.get(partId) || new Map();

      // Get images for this part, by view_type
      const partImages = imagesByPart.get(partId) || {};

      // Build brand column values (semicolon-separated SKUs)
      const brandColumnValues: Record<string, string> = {};
      for (const [propName, brandName] of Object.entries(BRAND_COLUMN_MAP)) {
        const skus = partCrossRefs.get(brandName) || [];
        brandColumnValues[propName] = skus.join(";");
      }

      const row = worksheet.addRow({
        // Core part fields
        _id: part.id,
        acr_sku: part.acr_sku,
        status: WORKFLOW_STATUS_DISPLAY[part.workflow_status] || "Activo",
        part_type: part.part_type,
        position_type: part.position_type || "",
        abs_type: part.abs_type || "",
        bolt_pattern: part.bolt_pattern || "",
        drive_type: part.drive_type || "",
        specifications: part.specifications || "",
        // Cross-reference brand columns (semicolon-separated SKUs)
        national_skus: brandColumnValues.national_skus || "",
        atv_skus: brandColumnValues.atv_skus || "",
        syd_skus: brandColumnValues.syd_skus || "",
        tmk_skus: brandColumnValues.tmk_skus || "",
        grob_skus: brandColumnValues.grob_skus || "",
        race_skus: brandColumnValues.race_skus || "",
        oem_skus: brandColumnValues.oem_skus || "",
        oem_2_skus: brandColumnValues.oem_2_skus || "",
        gmb_skus: brandColumnValues.gmb_skus || "",
        gsp_skus: brandColumnValues.gsp_skus || "",
        fag_skus: brandColumnValues.fag_skus || "",
        // Image URL columns
        image_url_front: partImages.front || "",
        image_url_back: partImages.back || "",
        image_url_top: partImages.top || "",
        image_url_other: partImages.other || "",
        viewer_360_status: part.has_360_viewer ? "Confirmed" : "",
      });

      // Apply alternating row styling
      applyDataRowStyle(row, rowIndex, PARTS_COLUMNS.length);
      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Add data validation for Status column (dropdown: Activo, Inactivo, Eliminar)
    const statusColIndex =
      PARTS_COLUMNS.findIndex((col) => col.key === "status") + 1;
    if (statusColIndex > 0) {
      const statusColumn = worksheet.getColumn(statusColIndex);
      // Apply to data rows only (row 4+, skipping header and instruction rows)
      for (let rowNum = 4; rowNum <= worksheet.rowCount; rowNum++) {
        const cell = worksheet.getCell(rowNum, statusColIndex);
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Activo,Inactivo,Eliminar"'],
          showErrorMessage: true,
          errorTitle: "Invalid Status",
          error: "Please select: Activo, Inactivo, or Eliminar",
        };
      }
    }

    // Freeze header rows (group headers + column headers + instructions)
    worksheet.views = [{ state: "frozen", ySplit: 3 }];
  }

  /**
   * Add Vehicle Applications sheet to workbook
   * Styled with group headers, column headers, instructions row, and alternating data rows
   *
   * Row Structure:
   * - Row 1: Group headers (merged cells for logical groupings)
   * - Row 2: Column headers
   * - Row 3: Instructions row (help text for each column)
   * - Row 4+: Data rows with alternating colors
   */
  private addVehiclesSheet(
    workbook: ExcelJS.Workbook,
    vehicles: any[],
    locale: "en" | "es" = "es"
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS);

    // Define columns (widths and keys only - headers added manually for styling)
    worksheet.columns = VEHICLE_APPLICATIONS_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
      hidden: col.hidden,
    }));

    // Row 1: Group headers (merged cells for logical groupings)
    addGroupHeaderRow(
      worksheet,
      VEHICLE_APPLICATIONS_COLUMNS,
      VEHICLE_APPS_COLUMN_GROUPS
    );

    // Row 2: Column headers with styling
    addColumnHeaderRow(worksheet, VEHICLE_APPLICATIONS_COLUMNS);

    // Row 3: Instructions row with help text
    addInstructionsRow(
      worksheet,
      VEHICLE_APPLICATIONS_COLUMNS,
      VEHICLE_APPS_INSTRUCTIONS[locale]
    );

    // Row 4+: Data rows with alternating colors
    vehicles.forEach((vehicle, rowIndex) => {
      const row = worksheet.addRow({
        _id: vehicle.id, // Map database 'id' to Excel '_id' column key
        _part_id: vehicle.part_id, // Map database 'part_id' to Excel '_part_id' column key
        acr_sku: vehicle.acr_sku || "",
        make: vehicle.make,
        model: vehicle.model,
        start_year: vehicle.start_year,
        end_year: vehicle.end_year,
      });

      // Apply alternating row styling
      applyDataRowStyle(row, rowIndex, VEHICLE_APPLICATIONS_COLUMNS.length);
      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Freeze header rows (group headers + column headers + instructions)
    worksheet.views = [{ state: "frozen", ySplit: 3 }];
  }

  /**
   * Add Vehicle Aliases sheet to workbook (Phase 4A)
   * Allows Humberto to manage vehicle nickname mappings via Excel
   * Styled with group headers, column headers, instructions row, and alternating data rows
   *
   * Row Structure:
   * - Row 1: Group headers (merged cells for logical groupings)
   * - Row 2: Column headers
   * - Row 3: Instructions row (help text for each column)
   * - Row 4+: Data rows with alternating colors
   */
  private addAliasesSheet(
    workbook: ExcelJS.Workbook,
    aliases: any[],
    locale: "en" | "es" = "es"
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.ALIASES);

    // Define columns (widths and keys only - headers added manually for styling)
    worksheet.columns = ALIASES_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
      hidden: col.hidden,
    }));

    // Row 1: Group headers (merged cells for logical groupings)
    addGroupHeaderRow(worksheet, ALIASES_COLUMNS, ALIASES_COLUMN_GROUPS);

    // Row 2: Column headers with styling
    addColumnHeaderRow(worksheet, ALIASES_COLUMNS);

    // Row 3: Instructions row with help text
    addInstructionsRow(
      worksheet,
      ALIASES_COLUMNS,
      ALIASES_INSTRUCTIONS[locale]
    );

    // Row 4+: Data rows with alternating colors
    aliases.forEach((alias, rowIndex) => {
      const row = worksheet.addRow({
        _id: alias.id,
        alias: alias.alias,
        canonical_name: alias.canonical_name,
        alias_type: alias.alias_type,
      });

      // Apply alternating row styling
      applyDataRowStyle(row, rowIndex, ALIASES_COLUMNS.length);
      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Freeze header rows (group headers + column headers + instructions)
    worksheet.views = [{ state: "frozen", ySplit: 3 }];
  }

  /**
   * Add Cross References sheet to workbook
   * @deprecated Phase 3 moves cross-references to brand columns in Parts sheet.
   * This method is kept for backward compatibility only.
   */
  private addCrossRefsSheet(
    workbook: ExcelJS.Workbook,
    crossRefs: any[]
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.CROSS_REFERENCES);

    // Define columns (widths and keys only - headers added manually for styling)
    worksheet.columns = CROSS_REFERENCES_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
      hidden: col.hidden,
    }));

    // Row 1: Simple header row (no group headers for deprecated sheet)
    const headerRow = worksheet.getRow(1);
    CROSS_REFERENCES_COLUMNS.forEach((col, idx) => {
      headerRow.getCell(idx + 1).value = col.header;
    });

    // Add rows
    crossRefs.forEach((crossRef) => {
      worksheet.addRow({
        _id: crossRef.id, // Map database 'id' to Excel '_id' column key
        _acr_part_id: crossRef.acr_part_id, // Map database 'acr_part_id' to Excel '_acr_part_id' column key
        acr_sku: crossRef.acr_sku || "",
        competitor_brand: crossRef.competitor_brand || "",
        competitor_sku: crossRef.competitor_sku,
      });
    });

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  /**
   * Get export statistics (for API response metadata)
   */
  async getExportStats(): Promise<{
    parts: number;
    vehicles: number;
    crossRefs: number;
    totalRecords: number;
  }> {
    const [partsCount, vehiclesCount, crossRefsCount] = await Promise.all([
      supabase.from("parts").select("id", { count: "exact", head: true }),
      supabase
        .from("vehicle_applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("cross_references")
        .select("id", { count: "exact", head: true }),
    ]);

    const parts = partsCount.count || 0;
    const vehicles = vehiclesCount.count || 0;
    const crossRefs = crossRefsCount.count || 0;

    return {
      parts,
      vehicles,
      crossRefs,
      totalRecords: parts + vehicles + crossRefs,
    };
  }
}
