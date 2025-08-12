# ACR Automotive Documentation

Documentation for the Excel processing system that handles Humberto's auto parts catalog data.

## What We've Built So Far

The Excel parser foundation that reads Spanish auto parts catalogs and validates them for processing.

**Current Results:**
- ✅ **2,336 rows** read from `CATALOGACION ACR CLIENTES.xlsx`
- ✅ **Spanish headers** detected automatically 
- ✅ **Column mapping** working (ACR→B, Clase→E, MARCA→K, etc.)
- ✅ **File validation** with clear error messages
- ✅ **0 parsing errors** with real data

## Documentation Files

### [📊 Excel Parser Overview](./excel-parser.md)
- How the parser reads Excel files
- Spanish header recognition
- Supported file formats (CATALOGACION, LISTA DE PRECIOS)
- Basic usage examples

### [🗄️ Data Structure](./excel-data-structure.md) 
- Excel data organization (2,336 rows, 753 unique parts expected)
- Column mapping from Spanish headers
- Database structure planning

### [✅ Validation System](./excel-validation.md)
- File format validation (.xlsx/.xls)
- Spanish header detection
- Sample data quality checks
- Error types and handling

## File Structure

```
src/lib/excel/
├── types.ts                    # TypeScript interfaces and Spanish headers
├── parser.ts                   # Excel reading and column detection
├── validator.ts                # File validation and error checking
└── __tests__/
    ├── parser.test.ts          # Unit tests with plain language comments
    ├── CATALOGACION ACR CLIENTES.xlsx    # Real test data
    └── 09 LISTA DE PRECIOS ACR 21 07 2024 INV 100725.xlsx
```

## Key Features Working

### Spanish Header Detection ✅
Finds Spanish column headers automatically:
```
Found: ACR | TMK | Clase | MARCA | APLICACIÓN | AÑO
Maps to: acrSku | competitorSku | partType | make | model | yearRange
```

### File Validation ✅
Checks files before processing:
- File type (.xlsx/.xls only)
- File size (max 50MB)
- Excel structure (worksheets, data)
- Required headers present

### Data Parsing ✅
Converts Excel rows to structured data:
```typescript
// Excel: ACR512342 | MAZA | HONDA | PILOT | 2007-2013
// Becomes:
{
  acrSku: "ACR512342",
  partType: "MAZA", 
  make: "HONDA",
  model: "PILOT",
  yearRange: "2007-2013",
  rowNumber: 5
}
```

## Real Data Test Results

From `CATALOGACION ACR CLIENTES.xlsx`:
- **Format detected**: CATALOGACION ✅
- **Total rows**: 2,336 
- **Headers found**: All required Spanish headers ✅
- **Sample parsing**: 2,335 data rows, 0 errors ✅
- **Processing time**: Under 1 second ✅

## Testing

Unit tests with real Excel files and plain language comments:

```bash
npm test parser.test.ts
```

**What's tested:**
- Spanish header detection with accents
- Column mapping accuracy  
- Data validation (required fields)
- Real file structure parsing
- Error handling scenarios

## What's Next

The foundation is complete. Next steps:
1. **Two-pass processing** - Separate unique parts from vehicle applications
2. **Data consistency** - Validate part data across duplicate ACR SKUs
3. **Admin interface** - Upload and preview Excel files
4. **Database import** - Insert processed data into Supabase

## Business Value

For Humberto's auto parts business:
- **Accurate data import** from monthly Excel updates
- **Spanish language support** for Mexican market
- **Error prevention** with validation before processing
- **Fast processing** of large catalogs (2,336+ rows)

---

*ACR Automotive Excel Parser Foundation - COMPLETED ✅*