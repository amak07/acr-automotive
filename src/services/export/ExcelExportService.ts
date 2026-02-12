import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase/client";
import {
  SHEET_NAMES,
  PARTS_COLUMNS,
  VEHICLE_APPLICATIONS_COLUMNS,
  ALIASES_COLUMNS,
  BRAND_COLUMN_MAP,
  WORKFLOW_STATUS_DISPLAY,
  IMAGE_URL_COLUMN_NAMES,
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
  EXCEL_COLORS,
} from "@/services/excel/shared";

// Type for cross-refs grouped by part and brand
type CrossRefsByPart = Map<string, Map<string, string[]>>;

// Type for images grouped by part and view_type
type ImagesByPart = Map<string, Record<string, string>>;

/**
 * ExcelExportService
 *
 * Exports catalog data to a 3-sheet Excel template:
 * 1. Parts — with inline cross-ref brand columns, image URLs, Status, and Errors formula
 * 2. Vehicle Applications — with Status column, Errors formula
 * 3. Vehicle Aliases — with Status column, Errors formula
 *
 * No hidden columns. Records matched by business keys on re-import:
 * - Parts: by acr_sku
 * - VAs: by (acr_sku, make, model)
 * - Aliases: by (alias, canonical_name)
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
        "id, acr_sku, workflow_status, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications, has_360_viewer, viewer_360_frame_count";
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
   * @returns Excel file buffer ready for download
   */
  async exportAllData(baseUrl: string = "", locale: "en" | "es" = "en"): Promise<Buffer> {
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
    this.addPartsSheet(workbook, parts, crossRefsByPart, imagesByPart, locale, baseUrl);

    // Add Vehicle Applications sheet
    this.addVehiclesSheet(workbook, vehicles, locale);

    // Add Vehicle Aliases sheet
    this.addAliasesSheet(workbook, aliases, locale);

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  /**
   * Export filtered catalog data to Excel workbook
   * @param filters - Search filters to apply
   * @returns Excel file buffer ready for download
   */
  async exportFiltered(filters: ExportFilters, baseUrl: string = "", locale: "en" | "es" = "en"): Promise<Buffer> {
    // Fetch filtered parts
    const parts = await this.fetchFilteredParts(filters);

    // Extract part IDs for relationship queries
    const partIds = parts.map((p) => p.id);

    // If no parts match, return empty workbook with aliases only
    if (partIds.length === 0) {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ACR Automotive";
      workbook.created = new Date();

      this.addPartsSheet(workbook, [], new Map(), new Map(), locale, baseUrl);
      this.addVehiclesSheet(workbook, [], locale);
      const aliases = await this.fetchAllAliases();
      this.addAliasesSheet(workbook, aliases, locale);

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
    this.addPartsSheet(workbook, parts, crossRefsByPart, imagesByPart, locale, baseUrl);
    this.addVehiclesSheet(workbook, vehicles, locale);
    this.addAliasesSheet(workbook, aliases, locale);

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
          "id, acr_sku, workflow_status, part_type, position_type, abs_type, bolt_pattern, drive_type, specifications, has_360_viewer, viewer_360_frame_count"
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
   * Fetch all vehicle aliases
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
   * Add Parts sheet with inline cross-refs, images, Status dropdown, and Errors formula
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

    // Define columns (widths and keys only — headers added manually for styling)
    worksheet.columns = PARTS_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
    }));

    // Row 1: Group headers (merged cells for logical groupings)
    addGroupHeaderRow(worksheet, PARTS_COLUMNS, PARTS_COLUMN_GROUPS);

    // Row 2: Column headers with styling (locale-aware)
    addColumnHeaderRow(worksheet, PARTS_COLUMNS, locale);

    // Row 3: Instructions row with help text
    addInstructionsRow(
      worksheet,
      PARTS_COLUMNS,
      PARTS_INSTRUCTIONS[locale],
      baseUrl
    );

    // Precompute image column indices (constant across all rows)
    const imageColIndices = IMAGE_URL_COLUMN_NAMES.map((name) => ({
      name,
      idx: PARTS_COLUMNS.findIndex((c) => c.key === name) + 1,
    })).filter((c) => c.idx > 0);

    // Precompute 360 viewer column index
    const viewer360ColIdx = PARTS_COLUMNS.findIndex((c) => c.key === "viewer_360_status") + 1;

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
        viewer_360_status: part.has_360_viewer
          ? `Confirmed (${part.viewer_360_frame_count || 0} frames)`
          : "",
      });

      // Convert image URL cells to hyperlinks with short filename display
      for (const { idx } of imageColIndices) {
        const cell = row.getCell(idx);
        const url =
          typeof cell.value === "string" ? cell.value.trim() : "";
        if (url) {
          const filename = url.split("/").pop() || url;
          cell.value = { text: filename, hyperlink: url };
        }
      }

      // Convert 360 viewer status cell to hyperlink
      if (viewer360ColIdx > 0) {
        const viewer360Cell = row.getCell(viewer360ColIdx);
        if (viewer360Cell.value && typeof viewer360Cell.value === "string" && viewer360Cell.value !== "") {
          viewer360Cell.value = {
            text: viewer360Cell.value as string,
            hyperlink: `${baseUrl}/admin/parts/${encodeURIComponent(part.acr_sku)}?tab=360viewer`,
          };
        }
      }

      // Apply alternating row styling
      applyDataRowStyle(row, rowIndex, PARTS_COLUMNS.length);

      // Re-apply hyperlink styling (applyDataRowStyle resets all fonts to black)
      for (const { idx } of imageColIndices) {
        const cell = row.getCell(idx);
        if (cell.value && typeof cell.value === "object" && "hyperlink" in cell.value) {
          cell.font = {
            size: 10,
            color: { argb: EXCEL_COLORS.TEXT_LINK },
            underline: true,
          };
        }
      }

      // Re-apply hyperlink styling for 360 viewer cell
      if (viewer360ColIdx > 0) {
        const viewer360Cell = row.getCell(viewer360ColIdx);
        if (viewer360Cell.value && typeof viewer360Cell.value === "object" && "hyperlink" in viewer360Cell.value) {
          viewer360Cell.font = {
            size: 10,
            color: { argb: EXCEL_COLORS.TEXT_LINK },
            underline: true,
          };
        }
      }

      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Add Errors column formulas (SKU required, duplicate SKU check)
    const errorsColIndex = PARTS_COLUMNS.findIndex((c) => c.key === "errors") + 1;
    const skuColIndex = PARTS_COLUMNS.findIndex((c) => c.key === "acr_sku") + 1;
    const lastDataRow = worksheet.rowCount;
    if (errorsColIndex > 0 && skuColIndex > 0 && lastDataRow >= 4) {
      const skuCol = String.fromCharCode(64 + skuColIndex); // 1→A, 2→B, etc.
      for (let rowNum = 4; rowNum <= lastDataRow; rowNum++) {
        const cell = worksheet.getCell(rowNum, errorsColIndex);
        cell.value = {
          formula: `IF(${skuCol}${rowNum}="","SKU requerido","")&IF(AND(${skuCol}${rowNum}<>"",COUNTIF(${skuCol}$4:${skuCol}$${lastDataRow},${skuCol}${rowNum})>1),"; SKU duplicado","")`,
        };
        cell.font = { color: { argb: "FFCC0000" }, italic: true, size: 9 };
      }
    }

    // Add data validation for Status column (dropdown: Activo, Inactivo, Eliminar)
    const statusColIndex =
      PARTS_COLUMNS.findIndex((col) => col.key === "status") + 1;
    if (statusColIndex > 0) {
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
   * Add Vehicle Applications sheet with Status dropdown and Errors formula
   */
  private addVehiclesSheet(
    workbook: ExcelJS.Workbook,
    vehicles: any[],
    locale: "en" | "es" = "es"
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.VEHICLE_APPLICATIONS);

    worksheet.columns = VEHICLE_APPLICATIONS_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
    }));

    addGroupHeaderRow(
      worksheet,
      VEHICLE_APPLICATIONS_COLUMNS,
      VEHICLE_APPS_COLUMN_GROUPS
    );
    addColumnHeaderRow(worksheet, VEHICLE_APPLICATIONS_COLUMNS, locale);
    addInstructionsRow(
      worksheet,
      VEHICLE_APPLICATIONS_COLUMNS,
      VEHICLE_APPS_INSTRUCTIONS[locale]
    );

    vehicles.forEach((vehicle, rowIndex) => {
      const row = worksheet.addRow({
        acr_sku: vehicle.acr_sku || "",
        status: "Activo",
        make: vehicle.make,
        model: vehicle.model,
        start_year: vehicle.start_year,
        end_year: vehicle.end_year,
      });

      applyDataRowStyle(row, rowIndex, VEHICLE_APPLICATIONS_COLUMNS.length);
      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Errors column formulas (required fields + year range)
    const vaErrorsColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "errors") + 1;
    const vaSkuColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "acr_sku") + 1;
    const vaMakeColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "make") + 1;
    const vaModelColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "model") + 1;
    const vaStartYearColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "start_year") + 1;
    const vaEndYearColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((c) => c.key === "end_year") + 1;
    const vaLastRow = worksheet.rowCount;
    if (vaErrorsColIndex > 0 && vaLastRow >= 4) {
      const sc = String.fromCharCode(64 + vaSkuColIndex);
      const mc = String.fromCharCode(64 + vaMakeColIndex);
      const oc = String.fromCharCode(64 + vaModelColIndex);
      const sy = String.fromCharCode(64 + vaStartYearColIndex);
      const ey = String.fromCharCode(64 + vaEndYearColIndex);
      for (let rowNum = 4; rowNum <= vaLastRow; rowNum++) {
        const cell = worksheet.getCell(rowNum, vaErrorsColIndex);
        cell.value = {
          formula: `IF(${sc}${rowNum}="","SKU requerido","")&IF(${mc}${rowNum}="","; Marca requerida","")&IF(${oc}${rowNum}="","; Modelo requerido","")&IF(AND(${sy}${rowNum}<>"",${ey}${rowNum}<>"",${sy}${rowNum}>${ey}${rowNum}),"; Rango de años inválido","")`,
        };
        cell.font = { color: { argb: "FFCC0000" }, italic: true, size: 9 };
      }
    }

    // Status dropdown
    const vaStatusColIndex = VEHICLE_APPLICATIONS_COLUMNS.findIndex((col) => col.key === "status") + 1;
    if (vaStatusColIndex > 0) {
      for (let rowNum = 4; rowNum <= worksheet.rowCount; rowNum++) {
        worksheet.getCell(rowNum, vaStatusColIndex).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Activo,Eliminar"'],
          showErrorMessage: true,
          errorTitle: "Invalid Status",
          error: "Please select: Activo or Eliminar",
        };
      }
    }

    worksheet.views = [{ state: "frozen", ySplit: 3 }];
  }

  /**
   * Add Vehicle Aliases sheet with Status dropdown and Errors formula
   */
  private addAliasesSheet(
    workbook: ExcelJS.Workbook,
    aliases: any[],
    locale: "en" | "es" = "es"
  ): void {
    const worksheet = workbook.addWorksheet(SHEET_NAMES.ALIASES);

    worksheet.columns = ALIASES_COLUMNS.map((col) => ({
      key: col.key,
      width: col.width,
    }));

    addGroupHeaderRow(worksheet, ALIASES_COLUMNS, ALIASES_COLUMN_GROUPS);
    addColumnHeaderRow(worksheet, ALIASES_COLUMNS, locale);
    addInstructionsRow(
      worksheet,
      ALIASES_COLUMNS,
      ALIASES_INSTRUCTIONS[locale]
    );

    aliases.forEach((alias, rowIndex) => {
      const row = worksheet.addRow({
        alias: alias.alias,
        canonical_name: alias.canonical_name,
        alias_type: alias.alias_type,
        status: "Activo",
      });

      applyDataRowStyle(row, rowIndex, ALIASES_COLUMNS.length);
      row.height = ROW_HEIGHTS.DATA_ROW;
    });

    // Errors column formulas (required fields)
    const aliasErrorsColIndex = ALIASES_COLUMNS.findIndex((c) => c.key === "errors") + 1;
    const aliasColIndex = ALIASES_COLUMNS.findIndex((c) => c.key === "alias") + 1;
    const canonColIndex = ALIASES_COLUMNS.findIndex((c) => c.key === "canonical_name") + 1;
    const aliasLastRow = worksheet.rowCount;
    if (aliasErrorsColIndex > 0 && aliasLastRow >= 4) {
      const ac = String.fromCharCode(64 + aliasColIndex);
      const cc = String.fromCharCode(64 + canonColIndex);
      for (let rowNum = 4; rowNum <= aliasLastRow; rowNum++) {
        const cell = worksheet.getCell(rowNum, aliasErrorsColIndex);
        cell.value = {
          formula: `IF(${ac}${rowNum}="","Alias requerido","")&IF(${cc}${rowNum}="","; Nombre canónico requerido","")`,
        };
        cell.font = { color: { argb: "FFCC0000" }, italic: true, size: 9 };
      }
    }

    // Status dropdown
    const aliasStatusColIndex = ALIASES_COLUMNS.findIndex((col) => col.key === "status") + 1;
    if (aliasStatusColIndex > 0) {
      for (let rowNum = 4; rowNum <= worksheet.rowCount; rowNum++) {
        worksheet.getCell(rowNum, aliasStatusColIndex).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: ['"Activo,Eliminar"'],
          showErrorMessage: true,
          errorTitle: "Invalid Status",
          error: "Please select: Activo or Eliminar",
        };
      }
    }

    worksheet.views = [{ state: "frozen", ySplit: 3 }];
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
