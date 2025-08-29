# Excel Parser System

The Excel parser reads auto parts data from Spanish Excel files and converts it into a structured format for the ACR Automotive database.

## What It Does

Takes Excel files like `CATALOGACION ACR CLIENTES.xlsx` and extracts:
- **753 unique auto parts** (wheel bearings, etc.)
- **2,335 vehicle applications** (which cars each part fits)
- **Cross-reference data** (competitor part numbers)

## Supported File Formats

### CATALOGACION Format
```
A: #          B: ACR        C: SYD       D: TMK
E: Clase      F: Posicion   G: Sistema   H: Birlos
I: Traccion   J: Observaciones          K: MARCA
L: APLICACIÓN M: AÑO        N: URL IMAGEN
```

**Example row:**
```
1 | ACR512342 | SYD123 | TM512342 | MAZA | TRASERA | C/ABS | 5 ROSCAS | 4X2 | 28 ESTRIAS | HONDA | PILOT | 2007-2013 | http://...
```

### LISTA DE PRECIOS Format
```
A: ACR       B: CLASE     C: MARCA     D: APLICACION    E: AÑO
```

**Example row:**
```
ACR512342 | MAZA | HONDA | PILOT | 2007-2013
```

## How It Works

### 1. File Reading
```typescript
// Load Excel file into memory
const { workbook, fileInfo } = await ExcelParser.readExcelFile(file);
```

### 2. Header Detection
```typescript
// Find Spanish column headers automatically
const detection = ExcelParser.detectColumnMapping(worksheet, fileInfo);
// Result: { acrSku: 1, partType: 4, make: 10, model: 11, yearRange: 12 }
```

### 3. Data Parsing
```typescript
// Convert Excel rows to structured data
const { rows, errors } = ExcelParser.parseExcelData(worksheet, mapping, startRow, fileInfo);
```

### 4. Validation
```typescript
// Check file format and data quality
const validation = await ExcelValidator.validateExcelFile(file);
```

## Key Features

### Spanish Header Recognition
Automatically detects Spanish column headers with variations:
- `ACR` → `acrSku`
- `Clase` / `CLASE` → `partType`
- `MARCA` / `Marca` → `make`
- `APLICACIÓN` / `APLICACION` → `model`
- `AÑO` / `ANO` → `yearRange`

### Accent Handling
Normalizes Spanish accents for reliable matching:
- `APLICACIÓN` becomes `APLICACION`
- `AÑO` becomes `ANO`

### Error Detection
Catches common problems:
- Missing required fields (ACR SKU, part type, make, model, year)
- Invalid file formats
- Empty data rows
- Corrupted Excel files

## Data Structure

### Input (Excel Row)
```
ACR512342 | MAZA | HONDA | PILOT | 2007-2013 | TM512342
```

### Output (Structured Data)
```typescript
{
  acrSku: "ACR512342",
  partType: "MAZA",
  make: "HONDA", 
  model: "PILOT",
  yearRange: "2007-2013",
  competitorSku: "TM512342",
  rowNumber: 5
}
```

## Real Data Results

From `CATALOGACION ACR CLIENTES.xlsx`:
- **Total rows**: 2,336
- **Data rows**: 2,335 (header row excluded)
- **Parsing success**: 100% (0 errors)
- **Format detected**: CATALOGACION
- **Processing time**: <1 second

## Error Handling

### File Validation Errors
```typescript
{
  row: 0,
  errorType: 'invalid_format',
  message: 'Invalid file type: text/plain',
  suggestion: 'Upload an Excel file (.xlsx or .xls)'
}
```

### Data Validation Errors
```typescript
{
  row: 15,
  field: 'acrSku',
  errorType: 'required',
  message: 'ACR SKU is required',
  cellValue: ''
}
```

## Usage Example

```typescript
import { ExcelParser, ExcelValidator } from '@/lib/excel';

// 1. Validate file
const validation = await ExcelValidator.validateExcelFile(file);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  return;
}

// 2. Read and parse
const { workbook, fileInfo } = await ExcelParser.readExcelFile(file);
const detection = ExcelParser.detectColumnMapping(worksheet, fileInfo);
const { rows, errors } = ExcelParser.parseExcelData(
  worksheet, 
  detection.mapping, 
  fileInfo.dataStartRow, 
  fileInfo
);

// 3. Process results
console.log(`Parsed ${rows.length} parts from Excel file`);
console.log(`Sample part:`, rows[0]);
```

## File Structure

```
src/lib/excel/
├── types.ts           # TypeScript interfaces
├── parser.ts          # Core Excel reading logic
├── validator.ts       # File validation
└── __tests__/
    ├── parser.test.ts # Unit tests
    ├── CATALOGACION ACR CLIENTES.xlsx
    └── 09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx
```

## Next Steps

This parser is the foundation for:
1. **Two-pass processing** - Discover unique parts vs vehicle applications
2. **Database import** - Insert parsed data into Supabase
3. **Admin interface** - Upload and preview Excel files
4. **Data consistency** - Validate part information across duplicates