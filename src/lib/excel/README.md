# ACR Automotive Excel Parser

**Quick Start:** Two-step Excel processing system for ACR parts catalog and vehicle applications with data integrity validation.

## Usage

### PRECIOS Parser (Cross-References)
```typescript
import { PreciosParser } from './precios-parser';

const preciosBuffer = fs.readFileSync('LISTA_DE_PRECIOS.xlsx');
const preciosResult = PreciosParser.parseFile(preciosBuffer);

// Result: 865 ACR parts, 7,530 cross-references
// Performance: <100ms processing
```

### CATALOGACION Parser (Vehicle Applications)
```typescript
import { CatalogacionParser } from './catalogacion-parser';

// First get valid ACR SKUs from PRECIOS
const catalogacionBuffer = fs.readFileSync('CATALOGACION_ACR_CLIENTES.xlsx');
const catalogacionResult = CatalogacionParser.parseFile(
  catalogacionBuffer, 
  preciosResult.acrSkus  // Validation against master list
);

// Result: 740 unique parts, 2,304 vehicle applications
// Performance: <200ms processing
// Data Integrity: Orphaned SKU detection
```

## File Structures

### PRECIOS File (Cross-References)
- **Header Row:** Row 8, **Data Starts:** Row 9
- **Columns:** A=ID, B=ACR_SKU, C-M=Competitor brands
- **Output:** Cross-reference mappings (competitor SKU → ACR SKU)

### CATALOGACION File (Vehicle Applications)  
- **Header Row:** Row 1, **Data Starts:** Row 2
- **Columns:** B=ACR_SKU, E=PartType, K=Make, L=Model, M=Year
- **Output:** Part details + vehicle compatibility data

## Data Integrity Features

- **ACR SKU Validation:** CATALOGACION validated against PRECIOS master list
- **Conflict Detection:** Comprehensive reporting system for data inconsistencies
- **Severity Classification:** Blocking errors vs. warnings vs. info messages
- **Orphaned Detection:** Reports ACR SKUs in CATALOGACION but not in PRECIOS
- **Performance Monitoring:** Sub-200ms processing time targets
- **Error Handling:** Graceful handling of malformed data

## Conflict Detection System (NEW)

```typescript
// Enhanced parser results with conflict detection
interface ProcessingResult<TData> {
  success: boolean;
  data?: TData;
  conflicts: ConflictReport[];
  summary: ProcessingSummary;
  canProceed: boolean;
}

// Individual conflict reports for admin review
interface ConflictReport {
  severity: 'error' | 'warning' | 'info';
  source: 'precios' | 'catalogacion' | 'cross-validation';
  description: string;
  affectedRows: number[];
  affectedSkus: string[];
  suggestion?: string;
  impact: 'blocking' | 'non-blocking';
}
```

## Types

```typescript
interface PreciosResult {
  acrSkus: Set<string>;
  crossReferences: CrossReference[];
  summary: ProcessingSummary;
}

interface CatalogacionResult {
  parts: PartData[];
  applications: VehicleApplication[];
  orphanedApplications: string[];  // ACR SKUs not in PRECIOS
  summary: ProcessingSummary;
}
```

## Testing

```bash
npm test src/lib/excel/__tests__/precios-parser.test.ts
npm test src/lib/excel/__tests__/catalogacion-parser.test.ts
```

Tests include real Excel file processing with performance validation.