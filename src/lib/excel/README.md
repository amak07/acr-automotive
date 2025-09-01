# Excel Parser System - ACR Automotive

Simplified one-time bootstrap parsers for importing ACR Automotive's Excel data into Supabase.

## Overview

Two streamlined parsers handle the initial data import:
- **PreciosParser**: Extracts ACR SKUs + cross-references from PRECIOS file
- **CatalogacionParser**: Extracts part details + vehicle applications from CATALOGACION file

**Performance**: PRECIOS (45-147ms), CATALOGACION (96-132ms)

## File Structure

```
src/lib/excel/
├── precios-parser.ts      # PRECIOS Excel parser
├── catalogacion-parser.ts # CATALOGACION Excel parser
├── types.ts               # TypeScript interfaces
└── __tests__/             # Real Excel file tests
```

## Data Flow

### 1. PRECIOS Processing
```
Input:  LISTA DE PRECIOS Excel file
Output: 865 ACR SKUs + 9,400 cross-references
```

### 2. CATALOGACION Processing
```
Input:  CATALOGACION ACR CLIENTES Excel file + Valid ACR SKUs
Output: 740 part details + 2,304 vehicle applications
```

### 3. Database Import
```
parts → cross_references → vehicle_applications
```

## Excel File Formats

### PRECIOS (LISTA DE PRECIOS)
- **Data starts**: Row 9 (header at row 8)
- **Key columns**: A(ACR), C(NATIONAL), D(ATV), E(SYD), F(TMK), etc.
- **Output**: ACR SKUs + competitor cross-references

### CATALOGACION (CATALOGACION ACR CLIENTES)
- **Data starts**: Row 2 (header at row 1)
- **Key columns**: B(ACR), E(Clase), K(MARCA), L(APLICACIÓN), M(AÑO)
- **Output**: Part details + vehicle applications

## Database Schema

### Parts (740 records)
```sql
parts (
  acr_sku,           -- ACR512342
  part_type,         -- MAZA
  position,          -- TRASERA
  abs_type,          -- C/ABS
  specifications     -- 28 ESTRIAS
)
```

### Cross References (9,400 records)
```sql
cross_references (
  acr_sku,           -- ACR512342
  competitor_sku,    -- TM512342
  competitor_brand   -- TMK
)
```

### Vehicle Applications (2,304 records)
```sql
vehicle_applications (
  acr_sku,           -- ACR512342
  make,              -- HONDA
  model,             -- PILOT
  year_range         -- 2007-2013
)
```

## Usage

### Bootstrap Import Script
```typescript
// scripts/bootstrap-import.ts
const preciosResult = PreciosParser.parseFile(preciosBuffer);
await importPreciosData(preciosResult);

const catalogacionResult = CatalogacionParser.parseFile(
  catalogacionBuffer, 
  validAcrSkus
);
await importCatalogacionData(catalogacionResult, importedParts);
```

### Console Output
```
🔍 Starting PRECIOS parsing...
📄 Found 865 data rows
✅ Parsed 865 valid rows
🔗 Generated 9400 cross-references
🏷️  Found 865 unique ACR SKUs
⚡ PRECIOS parsing completed in 147ms

🔍 Starting CATALOGACION parsing...
📄 Found 2304 data rows
✅ Parsed 2304 valid rows
🔗 Valid: 2291, Orphaned: 13
⚠️  Found 13 orphaned ACR SKUs: [ACR510001, ACR510002, ...]
⚡ CATALOGACION parsing completed in 132ms
```

## Key Features

### Data Validation
- **PRECIOS**: Validates ACR SKU presence, filters long SKUs (>50 chars)
- **CATALOGACION**: Cross-validates against PRECIOS master list
- **Orphan Detection**: Identifies CATALOGACION SKUs not in PRECIOS

### Part Deduplication
- **Single Part Record**: Each ACR SKU becomes one part record
- **Multiple Applications**: Same part can fit multiple vehicles
- **First Occurrence**: Takes part details from first Excel row

### Real Data Results
From actual Excel files:
- **865 unique parts** from PRECIOS
- **740 parts with applications** from CATALOGACION  
- **13 orphaned SKUs** (in CATALOGACION but not PRECIOS)
- **2,304 vehicle applications** total

## Business Logic

### Cross-Reference Strategy
Every competitor brand gets a separate cross-reference record:
```typescript
ACR512342 → TM512342 (TMK)
ACR512342 → GM512342 (GMB)  
ACR512342 → F512342 (FAG)
```

### Vehicle Compatibility
Each Excel row becomes a vehicle application:
```typescript
ACR512342 → HONDA PILOT 2007-2013
ACR512342 → HONDA RIDGELINE 2006-2014
ACR512342 → ACURA MDX 2007-2013
```

## Error Handling

### File Issues
- Logs warnings for missing data
- Continues parsing on non-critical errors
- Provides detailed console feedback

### Data Issues
- Skips rows without ACR SKUs
- Filters excessively long competitor SKUs
- Reports orphaned SKUs as warnings

## Testing

Run tests with real Excel files:
```bash
npm test -- excel
```

Tests verify:
- ✅ Correct parsing of actual Excel data
- ✅ Performance under 200ms
- ✅ Proper handling of Spanish headers
- ✅ Cross-reference generation accuracy

## Next Steps

After bootstrap import:
1. **Admin CRUD Interface**: Manage parts/applications through web UI
2. **Search API**: Fast cross-reference and vehicle compatibility lookup
3. **Image Management**: Upload part images through admin panel

This simplified system gets 80% of data imported quickly, then relies on CRUD interface for ongoing management.