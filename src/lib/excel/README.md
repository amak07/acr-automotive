# ACR Automotive Excel Parser

**Quick Start:** Parse LISTA DE PRECIOS Excel files to extract ACR parts and competitor cross-references.

## Usage

```typescript
import { PreciosParser } from './precios-parser';
import * as fs from 'fs';

// Parse Excel file - accepts both Buffer and ArrayBuffer
const fileBuffer = fs.readFileSync('LISTA_DE_PRECIOS.xlsx');
const result = PreciosParser.parseFile(fileBuffer);

// Result contains:
// - result.acrSkus: Set<string>           (865 ACR parts)
// - result.crossReferences: CrossReference[]  (7,530 mappings)
// - result.summary: processing stats
```

## File Structure Expected

- **Header Row:** Row 8  
- **Data Starts:** Row 9
- **Columns:** A=ID, B=ACR_SKU, C-M=Competitor brands

## Types

```typescript
interface CrossReference {
  acrSku: string;           // "ACR512343"
  competitorBrand: string;  // "TMK", "NATIONAL", etc.
  competitorSku: string;    // "TM512343"
}

interface PreciosResult {
  acrSkus: Set<string>;
  crossReferences: CrossReference[];
  summary: { totalParts, totalCrossReferences, processingTimeMs };
}
```

## Testing

```bash
npm test src/lib/excel/__tests__/precios-parser.test.ts
```

Tests include real Excel file processing (865 parts, <100ms).