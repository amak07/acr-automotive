// Excel file validation system - ACR Automotive
import { ExcelParser } from './parser';
import { 
  ValidationResult, 
  ParseError, 
  ExcelFileInfo,
  ColumnMapping 
} from './types';

export class ExcelValidator {
  
  /**
   * Validate Excel file completely before processing
   */
  static async validateExcelFile(file: File): Promise<ValidationResult> {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    
    try {
      // 1. Basic file validation
      const basicValidation = this.validateFileBasics(file);
      errors.push(...basicValidation.errors);
      warnings.push(...basicValidation.warnings);
      
      if (basicValidation.errors.length > 0) {
        return {
          isValid: false,
          errors,
          warnings,
          fileInfo: this.createEmptyFileInfo(file)
        };
      }

      // 2. Read Excel file
      const { workbook, fileInfo } = await ExcelParser.readExcelFile(file);
      
      // 3. Validate Excel structure
      const structureValidation = this.validateExcelStructure(workbook, fileInfo);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      
      if (structureValidation.errors.length > 0) {
        return {
          isValid: false,
          errors,
          warnings,
          fileInfo
        };
      }

      // 4. Detect and validate column mapping
      const worksheet = workbook.Sheets[fileInfo.activeSheetName];
      const columnDetection = ExcelParser.detectColumnMapping(worksheet, fileInfo);
      
      errors.push(...columnDetection.errors);
      
      // Update file info with detection results
      const updatedFileInfo: ExcelFileInfo = {
        ...fileInfo,
        headerRow: columnDetection.headerRow,
        dataStartRow: columnDetection.headerRow + 1,
        detectedFormat: columnDetection.detectedFormat
      };

      if (!columnDetection.mapping) {
        return {
          isValid: false,
          errors,
          warnings,
          fileInfo: updatedFileInfo
        };
      }

      // 5. Sample data validation (first 10 rows)
      const sampleValidation = this.validateSampleData(
        worksheet, 
        columnDetection.mapping, 
        updatedFileInfo
      );
      
      errors.push(...sampleValidation.errors);
      warnings.push(...sampleValidation.warnings);

      // 6. Final validation result
      const isValid = errors.length === 0;
      
      return {
        isValid,
        errors,
        warnings,
        fileInfo: updatedFileInfo,
        columnMapping: columnDetection.mapping
      };
      
    } catch (error) {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: `Unexpected error during validation: ${error}`,
        suggestion: 'Ensure file is a valid Excel format (.xlsx or .xls)'
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        fileInfo: this.createEmptyFileInfo(file)
      };
    }
  }

  /**
   * Validate basic file properties
   */
  private static validateFileBasics(file: File): { errors: ParseError[]; warnings: ParseError[] } {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];

    // File type validation
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Sometimes Excel files appear as this
    ];
    
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: `Invalid file type: ${file.type}`,
        suggestion: 'Upload an Excel file (.xlsx or .xls)'
      });
    }

    // File size validation (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        suggestion: `Maximum file size is ${maxSize / 1024 / 1024}MB`
      });
    }

    // Warn about very small files
    if (file.size < 1024) {
      warnings.push({
        row: 0,
        errorType: 'invalid_format',
        message: 'File seems very small for parts catalog',
        suggestion: 'Verify this is the correct file with parts data'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate Excel workbook structure
   */
  private static validateExcelStructure(workbook: any, fileInfo: ExcelFileInfo): { errors: ParseError[]; warnings: ParseError[] } {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];

    // Check if workbook has sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: 'Excel file contains no worksheets',
        suggestion: 'Ensure the Excel file has at least one worksheet with data'
      });
      return { errors, warnings };
    }

    // Warn about multiple sheets
    if (workbook.SheetNames.length > 1) {
      warnings.push({
        row: 0,
        errorType: 'invalid_format',
        message: `Multiple worksheets found. Using: "${fileInfo.activeSheetName}"`,
        suggestion: 'Ensure the correct worksheet contains the parts data'
      });
    }

    // Check worksheet has data
    const worksheet = workbook.Sheets[fileInfo.activeSheetName];
    if (!worksheet['!ref']) {
      errors.push({
        row: 0,
        errorType: 'invalid_format',
        message: 'Worksheet appears to be empty',
        suggestion: 'Ensure the worksheet contains parts data with headers'
      });
      return { errors, warnings };
    }

    // Check minimum rows (expect at least 100 parts for a real catalog)
    if (fileInfo.totalRows < 10) {
      warnings.push({
        row: 0,
        errorType: 'invalid_format',
        message: `Very few rows detected: ${fileInfo.totalRows}`,
        suggestion: 'Expected hundreds or thousands of parts in catalog'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate sample data from first few rows
   */
  private static validateSampleData(
    worksheet: any, 
    mapping: ColumnMapping, 
    fileInfo: ExcelFileInfo
  ): { errors: ParseError[]; warnings: ParseError[] } {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];

    try {
      // Parse first 10 data rows for validation
      const sampleSize = Math.min(10, fileInfo.totalRows - fileInfo.dataStartRow + 1);
      const { rows: sampleRows, errors: parseErrors } = ExcelParser.parseExcelData(
        worksheet,
        mapping,
        fileInfo.dataStartRow,
        { ...fileInfo, totalRows: fileInfo.dataStartRow + sampleSize - 1 }
      );

      errors.push(...parseErrors);

      if (sampleRows.length === 0) {
        errors.push({
          row: fileInfo.dataStartRow,
          errorType: 'invalid_format',
          message: 'No valid data rows found in sample',
          suggestion: 'Check that data starts immediately after headers'
        });
        return { errors, warnings };
      }

      // Validate ACR SKU patterns
      const acrSkuPattern = /^ACR\d+$/i;
      const invalidSkus = sampleRows.filter(row => !acrSkuPattern.test(row.acrSku));
      
      if (invalidSkus.length > 0) {
        warnings.push({
          row: invalidSkus[0].rowNumber,
          field: 'acrSku',
          errorType: 'invalid_format',
          message: `ACR SKU format may be incorrect: "${invalidSkus[0].acrSku}"`,
          suggestion: 'Expected format: ACR followed by numbers (e.g., ACR512342)'
        });
      }

      // Check for expected part types (MAZA should be common)
      const partTypes = sampleRows.map(row => row.partType.toUpperCase());
      const hasExpectedTypes = partTypes.some(type => 
        type.includes('MAZA') || type.includes('COJINETE') || type.includes('RODAMIENTO')
      );
      
      if (!hasExpectedTypes) {
        warnings.push({
          row: sampleRows[0].rowNumber,
          field: 'partType',
          errorType: 'invalid_format',
          message: 'No expected auto parts types found in sample',
          suggestion: 'Expected part types like MAZA, COJINETE, RODAMIENTO for auto parts'
        });
      }

      // Validate year ranges
      const yearRangePattern = /\d{4}[-–]\d{4}|\d{4}/;
      const invalidYears = sampleRows.filter(row => !yearRangePattern.test(row.yearRange));
      
      if (invalidYears.length > 2) {
        warnings.push({
          row: invalidYears[0].rowNumber,
          field: 'yearRange',
          errorType: 'invalid_format',
          message: `Year range format may be incorrect: "${invalidYears[0].yearRange}"`,
          suggestion: 'Expected format: 2007-2013 or single year like 2010'
        });
      }

      return { errors, warnings };
      
    } catch (error) {
      errors.push({
        row: fileInfo.dataStartRow,
        errorType: 'invalid_format',
        message: `Failed to validate sample data: ${error}`,
        suggestion: 'Check data format and column alignment'
      });
      
      return { errors, warnings };
    }
  }

  /**
   * Create empty file info for error cases
   */
  private static createEmptyFileInfo(file: File): ExcelFileInfo {
    return {
      fileName: file.name,
      fileSize: file.size,
      sheetCount: 0,
      activeSheetName: '',
      headerRow: 1,
      dataStartRow: 2,
      totalRows: 0,
      detectedFormat: 'UNKNOWN'
    };
  }

  /**
   * Get validation summary for user display
   */
  static getValidationSummary(result: ValidationResult): string {
    if (result.isValid) {
      return `✅ File validated successfully. Format: ${result.fileInfo.detectedFormat}, Rows: ${result.fileInfo.totalRows}`;
    }
    
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    
    return `❌ Validation failed: ${errorCount} error(s), ${warningCount} warning(s)`;
  }
}