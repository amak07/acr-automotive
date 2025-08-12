# Excel Data Structure

Understanding how ACR Automotive's Excel data is organized and processed.

## The Challenge

Humberto's Excel file has **2,335 rows** but only **753 unique auto parts**. This happens because:
- Each part can fit multiple vehicles
- Same ACR SKU appears in multiple rows
- Need to separate "parts" from "vehicle applications"

## Real Data Example

### Raw Excel Data
```
Row | ACR       | TMK       | Clase | MARCA | APLICACIÓN | AÑO
----|-----------|-----------|-------|--------|------------|----------
1   | ACR512342 | TM512342  | MAZA  | HONDA  | PILOT      | 2007-2013
2   | ACR512342 | TM512342  | MAZA  | HONDA  | RIDGELINE  | 2006-2014
3   | ACR512342 | TM512342  | MAZA  | ACURA  | MDX        | 2007-2013
4   | ACR510038 | TM510038  | MAZA  | ACURA  | TL         | 1995-1998
```

### What This Means
- **ACR512342** is ONE part that fits 3 different vehicles
- **ACR510038** is a DIFFERENT part that fits 1 vehicle
- Total: **2 unique parts**, **4 vehicle applications**

## Two-Pass Processing Strategy

### Pass 1: Discover Unique Parts
Group by ACR SKU and take the first occurrence:

```typescript
// Result: 753 unique parts
{
  "ACR512342": {
    acrSku: "ACR512342",
    competitorSku: "TM512342", 
    partType: "MAZA",
    // ... other part attributes
    firstSeenAtRow: 1
  },
  "ACR510038": {
    acrSku: "ACR510038",
    competitorSku: "TM510038",
    partType: "MAZA", 
    // ... other part attributes
    firstSeenAtRow: 4
  }
}
```

### Pass 2: Collect Vehicle Applications
Every Excel row becomes a vehicle application:

```typescript
// Result: 2,335 vehicle applications
[
  { acrSku: "ACR512342", make: "HONDA", model: "PILOT", yearRange: "2007-2013", rowNumber: 1 },
  { acrSku: "ACR512342", make: "HONDA", model: "RIDGELINE", yearRange: "2006-2014", rowNumber: 2 },
  { acrSku: "ACR512342", make: "ACURA", model: "MDX", yearRange: "2007-2013", rowNumber: 3 },
  { acrSku: "ACR510038", make: "ACURA", model: "TL", yearRange: "1995-1998", rowNumber: 4 }
]
```

## Database Structure

### Parts Table (753 records)
```sql
CREATE TABLE parts (
  id SERIAL PRIMARY KEY,
  acr_sku TEXT UNIQUE NOT NULL,           -- ACR512342
  competitor_sku TEXT,                    -- TM512342
  part_type TEXT NOT NULL,                -- MAZA
  position TEXT,                          -- TRASERA
  abs_type TEXT,                          -- C/ABS
  bolt_pattern TEXT,                      -- 5 ROSCAS
  drive_type TEXT,                        -- 4X2
  specifications TEXT,                    -- 28 ESTRIAS
  image_url TEXT                          -- URL or null
);
```

### Vehicle Applications Table (2,335 records)
```sql
CREATE TABLE vehicle_applications (
  id SERIAL PRIMARY KEY,
  part_id INTEGER REFERENCES parts(id),
  make TEXT NOT NULL,                     -- HONDA
  model TEXT NOT NULL,                    -- PILOT
  year_range TEXT NOT NULL               -- 2007-2013
);
```

### Cross References Table (753 records)
```sql
CREATE TABLE cross_references (
  id SERIAL PRIMARY KEY,
  part_id INTEGER REFERENCES parts(id),
  competitor_brand TEXT NOT NULL,         -- TMK
  competitor_sku TEXT NOT NULL            -- TM512342
);
```

## Data Consistency Rules

### Part Data Conflicts
When the same ACR SKU appears multiple times, part attributes must be identical:

**✅ Valid (consistent):**
```
Row 1: ACR512342 | MAZA | TRASERA | C/ABS
Row 2: ACR512342 | MAZA | TRASERA | C/ABS  // Same values
```

**❌ Invalid (conflict):**
```
Row 1: ACR512342 | MAZA | TRASERA | C/ABS
Row 2: ACR512342 | MAZA | DELANTERA | C/ABS  // Different position!
```

### Vehicle Application Duplicates
Each part-vehicle combination should appear only once:

**❌ Invalid (duplicate):**
```
Row 1: ACR512342 | HONDA | PILOT | 2007-2013
Row 5: ACR512342 | HONDA | PILOT | 2007-2013  // Exact same vehicle!
```

## Column Mapping

### CATALOGACION Format (14 columns)
```
A: #              → id (optional)
B: ACR            → acrSku (required)
C: SYD            → syd (ignored)
D: TMK            → competitorSku (optional)
E: Clase          → partType (required)
F: Posicion       → position (optional)
G: Sistema        → absType (optional)
H: Birlos         → boltPattern (optional)
I: Traccion       → driveType (optional)
J: Observaciones  → specifications (optional)
K: MARCA          → make (required)
L: APLICACIÓN     → model (required)
M: AÑO            → yearRange (required)
N: URL IMAGEN     → imageUrl (optional)
```

### LISTA DE PRECIOS Format (5+ columns)
```
A: ACR            → acrSku (required)
B: CLASE          → partType (required)
C: MARCA          → make (required)
D: APLICACION     → model (required)
E: AÑO            → yearRange (required)
```

## Processing Results

From real `CATALOGACION ACR CLIENTES.xlsx`:

```typescript
{
  uniqueParts: 753,                    // One per ACR SKU
  vehicleApplications: 2335,           // One per Excel row
  partDataConflicts: 0,                // No inconsistencies found
  applicationDuplicates: 0,            // No duplicate vehicles
  summary: {
    totalExcelRows: 2336,              // Including header
    uniquePartsDiscovered: 753,
    totalVehicleApplications: 2335,
    conflictingPartData: 0,
    duplicateApplications: 0,
    processingTimeMs: 847
  }
}
```

## Business Impact

This structure enables:
- **Fast part lookup** by ACR SKU
- **Vehicle compatibility search** (2007 Honda Pilot → show matching parts)
- **Cross-reference search** (TM512342 → find ACR512342)
- **Inventory management** (753 unique parts to stock)
- **Customer service** (instantly know what vehicles a part fits)