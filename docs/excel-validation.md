# Excel File Validation

How the system validates Excel files before processing to ensure data quality and prevent errors.

## Validation Levels

### 1. File Format Validation
Checks if the uploaded file is actually an Excel file.

**Valid file types:**
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

**Size limits:**
- Maximum: 50MB
- Warning if under 1KB (probably empty)

**Example error:**
```
❌ Invalid file type: text/plain
💡 Upload an Excel file (.xlsx or .xls)
```

### 2. Excel Structure Validation
Checks if the Excel file has proper structure.

**Requirements:**
- At least one worksheet
- Worksheet contains data (not empty)
- Minimum 10 rows (for a real parts catalog)

**Example warning:**
```
⚠️ Multiple worksheets found. Using: "CATALOGACION CLIENTES ACR"
💡 Ensure the correct worksheet contains the parts data
```

### 3. Header Detection Validation
Finds and validates Spanish column headers.

**Required headers:**
- ACR SKU column (`ACR`, `SKU ACR`, `CODIGO ACR`)
- Part type column (`Clase`, `CLASE`, `TIPO`)
- Vehicle make (`MARCA`, `Marca`, `FABRICANTE`)
- Vehicle model (`APLICACIÓN`, `APLICACION`, `MODELO`)
- Year range (`AÑO`, `ANO`, `AÑOS`)

**Example error:**
```
❌ Required column 'acrSku' not found in Excel headers
💡 Expected Spanish headers like: ACR, SKU ACR, CODIGO ACR
```

### 4. Sample Data Validation
Tests the first 10 rows to catch data quality issues early.

**Checks performed:**
- Required fields are not empty
- ACR SKU follows expected format (`ACR` + numbers)
- Part types make sense for auto parts
- Year ranges are formatted correctly

**Example warning:**
```
⚠️ ACR SKU format may be incorrect: "ABC123"
💡 Expected format: ACR followed by numbers (e.g., ACR512342)
```

## Validation Process

### Step 1: Basic File Check
```typescript
// Check file type and size
const validation = await ExcelValidator.validateExcelFile(file);

// Result if file is invalid
{
  isValid: false,
  errors: [{
    row: 0,
    errorType: 'invalid_format', 
    message: 'File too large: 75.2MB',
    suggestion: 'Maximum file size is 50MB'
  }]
}
```

### Step 2: Excel Reading
```typescript
// Read Excel workbook
const { workbook, fileInfo } = await ExcelParser.readExcelFile(file);

// File info extracted
{
  fileName: 'CATALOGACION ACR CLIENTES.xlsx',
  fileSize: 2841650,
  sheetCount: 1,
  activeSheetName: 'CATALOGACION CLIENTES ACR',
  totalRows: 2336,
  detectedFormat: 'CATALOGACION'
}
```

### Step 3: Header Detection
```typescript
// Find Spanish headers
const detection = ExcelParser.detectColumnMapping(worksheet, fileInfo);

// Successful detection
{
  mapping: {
    acrSku: 1,        // Column B
    partType: 4,      // Column E
    make: 10,         // Column K
    model: 11,        // Column L
    yearRange: 12     // Column M
  },
  detectedFormat: 'CATALOGACION',
  headerRow: 1,
  errors: []
}
```

### Step 4: Sample Data Check
```typescript
// Parse first 10 data rows
const { rows, errors } = ExcelParser.parseExcelData(
  worksheet, mapping, startRow, limitedFileInfo
);

// Check data quality
const sampleValidation = validateSampleData(rows);
```

## Error Types

### Blocking Errors (Prevent Import)
These errors stop the import process completely:

```typescript
{
  errorType: 'required',
  message: 'ACR SKU is required',
  row: 15,
  field: 'acrSku'
}
```

```typescript
{
  errorType: 'invalid_format',
  message: 'Excel file contains no worksheets',
  row: 0
}
```

### Warnings (Allow Import)
These issues are noted but don't block import:

```typescript
{
  errorType: 'invalid_format',
  message: 'Very few rows detected: 8',
  suggestion: 'Expected hundreds or thousands of parts in catalog'
}
```

## Real Data Results

From `CATALOGACION ACR CLIENTES.xlsx`:

### ✅ Successful Validation
```
File validated successfully. Format: CATALOGACION, Rows: 2336
```

### Details:
- **File format**: ✅ Valid Excel (.xlsx)
- **File size**: ✅ 2.8MB (within 50MB limit)  
- **Structure**: ✅ 1 worksheet, 2,336 rows
- **Headers**: ✅ All required Spanish headers found
- **Sample data**: ✅ 10 rows parsed without errors
- **ACR SKUs**: ✅ All follow ACR + numbers format
- **Part types**: ✅ MAZA (wheel bearings) as expected
- **Year ranges**: ✅ Format like "2007-2013"

## Validation Summary Display

### For Valid Files:
```
✅ File validation passed
📊 2,336 total rows
🏷️ CATALOGACION format detected  
🔍 Sample: ACR512342 | MAZA | HONDA | PILOT | 2007-2013
```

### For Invalid Files:
```
❌ Validation failed: 2 error(s), 1 warning(s)

Errors:
- Row 0: Invalid file type: text/plain
- Row 15: ACR SKU is required

Warnings:  
- Row 0: Very few rows detected: 8
```

## Usage in Admin Interface

```typescript
// In admin upload component
const handleFileUpload = async (file: File) => {
  // Show validation progress
  setStatus('Validating file...');
  
  const validation = await ExcelValidator.validateExcelFile(file);
  
  if (!validation.isValid) {
    // Show errors to user
    setErrors(validation.errors);
    setStatus('Validation failed');
    return;
  }
  
  // Show success and file info
  setFileInfo(validation.fileInfo);
  setStatus('File ready for import');
  
  // Enable import button
  setCanImport(true);
};
```

## Preventing Common Issues

### Wrong File Type
- Reject PDF, Word, text files
- Clear error message with suggested fix

### Empty Files  
- Warn about very small files
- Check for actual data rows

### Wrong Format
- Handle both CATALOGACION and LISTA DE PRECIOS
- Flexible header matching with Spanish accents

### Bad Data
- Sample validation catches issues early
- Clear row/column error references
- Actionable suggestions for fixes