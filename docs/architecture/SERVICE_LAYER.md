# Service Layer Pattern

> **Purpose**: When and how to use the service layer for complex business logic
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [What is the Service Layer](#what-is-the-service-layer)
- [When to Use Service Layer](#when-to-use-service-layer)
- [When NOT to Use Service Layer](#when-not-to-use-service-layer)
- [Service Structure](#service-structure)
- [Existing Services](#existing-services)
- [Examples](#examples)

---

## What is the Service Layer

**Definition**: A service layer is a collection of TypeScript classes that encapsulate complex business logic, separate from API routes and UI components.

**Purpose**:
- Isolate business logic from framework code (Next.js routes)
- Enable reusability across multiple endpoints
- Simplify testing (no HTTP mocking needed)
- Handle multi-step operations

**Analogy**:
```
┌─────────────────┐
│   API Route     │  ← Thin controller (validation, HTTP handling)
│   (route.ts)    │
└────────┬────────┘
         │ delegates to
         ▼
┌─────────────────┐
│  Service Layer  │  ← Fat service (business logic, orchestration)
│  (Service.ts)   │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│    Database     │  ← Data persistence
│   (Supabase)    │
└─────────────────┘
```

---

## When to Use Service Layer

### 1. Multi-Step Operations

**Use Case**: Operation requires multiple database queries/mutations.

**Example**: Bulk operations (create 100 parts atomically)

**Why Service Layer**:
- Encapsulates orchestration logic
- Handles transactions/rollbacks
- Clear separation of concerns

**File**: [src/lib/services/BulkOperationsService.ts](../../src/lib/services/BulkOperationsService.ts)

---

### 2. Pagination Bypass

**Use Case**: Need to fetch ALL records, but PostgREST limits to 1000 rows.

**Example**: Excel export (9,600 parts)

**Why Service Layer**:
- Multi-page fetching logic
- Progress tracking
- Memory management

**File**: [src/lib/services/ExcelExportService.ts](../../src/lib/services/ExcelExportService.ts)

---

### 3. Complex Transformations

**Use Case**: Data needs significant transformation before/after database.

**Example**: Excel import (parse → validate → transform → insert)

**Why Service Layer**:
- Multi-stage processing
- Error accumulation
- Rollback on failure

---

### 4. Reusable Business Logic

**Use Case**: Same logic used in multiple API endpoints.

**Example**: Part creation logic used in both single create and bulk create.

**Why Service Layer**:
- DRY (Don't Repeat Yourself)
- Consistent behavior
- Easier to maintain

---

### 5. External API Integration

**Use Case**: Calling third-party APIs (future: competitor price scraping).

**Why Service Layer**:
- Isolate external dependencies
- Handle rate limiting
- Mock for testing

---

## When NOT to Use Service Layer

### 1. Simple CRUD

**Don't Use**: Single database query with no transformation.

**Example**:
```typescript
// ❌ Don't create a service for this
class PartService {
  async getPart(id: string) {
    return supabase.from("parts").select("*").eq("id", id).single();
  }
}

// ✅ Do this directly in API route
export async function GET(request: NextRequest) {
  const { data } = await supabase
    .from("parts")
    .select("*")
    .eq("id", id)
    .single();

  return NextResponse.json({ success: true, data });
}
```

**Reason**: Service adds no value, just indirection.

---

### 2. UI-Specific Logic

**Don't Use**: Logic specific to UI state or React components.

**Example**: Form validation, pagination state, sorting state.

**Where It Goes**: React hooks, Context, or component state.

**Reason**: Service layer is for business logic, not UI logic.

---

### 3. Simple Aggregations

**Don't Use**: Single aggregation query (count, sum, average).

**Example**:
```typescript
// ❌ Don't need a service
class StatsService {
  async getPartCount() {
    return supabase.from("parts").select("*", { count: "exact", head: true });
  }
}

// ✅ Do this directly in API route
const { count } = await supabase
  .from("parts")
  .select("*", { count: "exact", head: true });
```

---

## Service Structure

### Class-Based Pattern

**Why Classes**:
- Group related methods
- Share state (optional)
- Clear instantiation

**Pattern**:
```typescript
export class MyService {
  // Optional: Shared dependencies
  private supabase = createClient(...);

  // Grouped methods by resource
  async createResource(params: CreateParams) { ... }
  async updateResource(params: UpdateParams) { ... }
  async deleteResource(id: string) { ... }
}
```

**Usage**:
```typescript
const service = new MyService();
const result = await service.createResource(params);
```

---

### Return Format

**Pattern**: Consistent response format.

```typescript
type OperationResult = {
  success: boolean;
  created?: number;    // For bulk creates
  updated?: number;    // For bulk updates
  deleted?: number;    // For bulk deletes
  data?: T[];          // Successful results
  errors?: Error[];    // Failed operations
};

type Error = {
  index?: number;      // For bulk operations
  field?: string;      // For validation errors
  message: string;     // Human-readable error
};
```

**Example**:
```typescript
// Success
{
  success: true,
  created: 100,
  data: [ ... ]
}

// Partial failure
{
  success: false,
  created: 98,
  errors: [
    { index: 5, message: "Duplicate SKU: ACR-005" },
    { index: 23, message: "Invalid part type" }
  ]
}
```

---

### Error Handling

**Pattern**: Catch errors, don't throw.

```typescript
async createParts(parts: CreatePartParams[]): Promise<BulkOperationResult> {
  try {
    // Business logic
    const { data, error } = await supabase.from("parts").insert(partsForDb);

    if (error) {
      return {
        success: false,
        errors: [{ index: 0, message: error.message }],
      };
    }

    return {
      success: true,
      created: data.length,
      data,
    };
  } catch (error: any) {
    // Unexpected errors
    return {
      success: false,
      errors: [{ index: 0, message: error.message }],
    };
  }
}
```

**Why**:
- API route handles HTTP status codes
- Service focuses on business logic
- Easier to test (no try-catch needed)

---

## Existing Services

### BulkOperationsService

**File**: [src/lib/services/BulkOperationsService.ts](../../src/lib/services/BulkOperationsService.ts)

**Purpose**: Atomic bulk creates, updates, and deletes for parts, vehicles, and cross-references.

**Methods**:
```typescript
class BulkOperationsService {
  // Parts
  async createParts(parts: CreatePartParams[]): Promise<BulkOperationResult>
  async updateParts(parts: UpdatePartParams[]): Promise<BulkOperationResult>
  async deleteParts(ids: string[]): Promise<BulkOperationResult>

  // Vehicle Applications
  async createVehicleApplications(vehicles: CreateVehicleApplicationParams[]): Promise<BulkOperationResult>
  async updateVehicleApplications(vehicles: UpdateVehicleApplicationParams[]): Promise<BulkOperationResult>
  async deleteVehicleApplications(ids: string[]): Promise<BulkOperationResult>

  // Cross References
  async createCrossReferences(refs: CreateCrossReferenceParams[]): Promise<BulkOperationResult>
  async updateCrossReferences(refs: UpdateCrossReferenceParams[]): Promise<BulkOperationResult>
  async deleteCrossReferences(ids: string[]): Promise<BulkOperationResult>
}
```

**Key Features**:
- **Atomic operations**: PostgreSQL multi-row INSERT is atomic (all or nothing)
- **Field mapping**: `sku_number` → `acr_sku` (API field names ≠ database column names)
- **Concurrent updates**: Uses `Promise.all` for independent operations
- **Error accumulation**: Collects all errors before returning

**Example**:
```typescript
const service = new BulkOperationsService();
const result = await service.createParts([
  { sku_number: "ACR-001", part_type: "Brake Rotor" },
  { sku_number: "ACR-002", part_type: "Brake Pad" },
]);

if (result.success) {
  console.log(`Created ${result.created} parts`);
} else {
  console.error(`Errors:`, result.errors);
}
```

---

### ExcelExportService

**File**: [src/lib/services/ExcelExportService.ts](../../src/lib/services/ExcelExportService.ts)

**Purpose**: Generate Excel workbooks with parts catalog data, bypassing PostgREST pagination limits.

**Methods**:
```typescript
class ExcelExportService {
  async exportPartsToExcel(
    filters?: ExportFilters
  ): Promise<{ success: boolean; buffer?: Buffer; error?: string }>

  async exportVehicleApplicationsToExcel(
    partId: string
  ): Promise<{ success: boolean; buffer?: Buffer; error?: string }>

  async exportCrossReferencesToExcel(
    partId: string
  ): Promise<{ success: boolean; buffer?: Buffer; error?: string }>
}
```

**Key Features**:
- **Pagination bypass**: Fetches ALL records using offset/limit loop
- **Hidden columns**: Stores IDs in hidden columns for import matching
- **Frozen headers**: First row frozen for scrolling
- **ExcelJS**: Direct workbook generation (no temp files)

**Example**:
```typescript
const service = new ExcelExportService();
const result = await service.exportPartsToExcel({
  part_type: "Brake Rotor",
  position_type: "Front",
});

if (result.success) {
  return new NextResponse(result.buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="parts-export.xlsx"',
    },
  });
}
```

**Performance**: 9,593 parts exported in ~2-3 seconds.

**See**: [docs/features/data-management/EXCEL_EXPORT.md](../features/data-management/EXCEL_EXPORT.md)

---

## Examples

### Example 1: Bulk Create Parts

**File**: [src/lib/services/BulkOperationsService.ts](../../src/lib/services/BulkOperationsService.ts:20-60)

```typescript
async createParts(parts: CreatePartParams[]): Promise<BulkOperationResult & { data?: any[] }> {
  try {
    // 1. Transform API field names to database column names
    const partsForDb = parts.map((part) => ({
      acr_sku: part.sku_number,         // API: sku_number → DB: acr_sku
      part_type: part.part_type,
      position_type: part.position_type,
      abs_type: part.abs_type,
      bolt_pattern: part.bolt_pattern,
      drive_type: part.drive_type,
      specifications: part.specifications,
      image_url: part.image_url,
    }));

    // 2. Atomic insert (PostgreSQL treats multi-row INSERT as atomic)
    const { data, error } = await supabase
      .from("parts")
      .insert(partsForDb)
      .select();

    // 3. Handle database errors
    if (error) {
      return {
        success: false,
        errors: [{ index: 0, message: error.message }],
      };
    }

    // 4. Success response
    return {
      success: true,
      created: data.length,
      data,
    };
  } catch (error: any) {
    // 5. Unexpected errors
    return {
      success: false,
      errors: [{ index: 0, message: error.message }],
    };
  }
}
```

**Used By**: [src/app/api/admin/bulk/parts/create/route.ts](../../src/app/api/admin/bulk/parts/create/route.ts)

---

### Example 2: Paginated Export

**File**: [src/lib/services/ExcelExportService.ts](../../src/lib/services/ExcelExportService.ts:50-120)

```typescript
async exportPartsToExcel(filters?: ExportFilters) {
  try {
    const allParts: DatabasePartRow[] = [];
    let offset = 0;
    const limit = 1000; // PostgREST max

    // 1. Fetch all parts using pagination
    while (true) {
      let query = supabase
        .from("parts")
        .select("*")
        .range(offset, offset + limit - 1)
        .order("acr_sku", { ascending: true });

      // Apply filters
      if (filters?.part_type) {
        query = query.eq("part_type", filters.part_type);
      }

      const { data: parts, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      if (!parts || parts.length === 0) break;

      allParts.push(...parts);

      // If we got less than limit, we're done
      if (parts.length < limit) break;

      offset += limit;
    }

    // 2. Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Parts");

    // 3. Add headers (visible + hidden ID column)
    worksheet.columns = [
      { header: "ID", key: "id", width: 20, hidden: true },  // Hidden for import matching
      { header: "ACR SKU", key: "acr_sku", width: 15 },
      { header: "Part Type", key: "part_type", width: 20 },
      { header: "Position Type", key: "position_type", width: 15 },
      // ...
    ];

    // 4. Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // 5. Add data rows
    allParts.forEach((part) => {
      worksheet.addRow({
        id: part.id,
        acr_sku: part.acr_sku,
        part_type: part.part_type,
        // ...
      });
    });

    // 6. Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return { success: true, buffer: Buffer.from(buffer) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

**Used By**: [src/app/api/admin/export/excel/route.ts](../../src/app/api/admin/export/excel/route.ts)

**Why Service Layer**:
- Complex multi-step process (paginate → transform → generate → buffer)
- Reusable across different export endpoints
- Isolated ExcelJS logic

---

### Example 3: Concurrent Operations

**File**: [src/lib/services/BulkOperationsService.ts](../../src/lib/services/BulkOperationsService.ts:100-150)

```typescript
async updateParts(parts: UpdatePartParams[]): Promise<BulkOperationResult> {
  try {
    // Update each part independently (no shared state)
    const updatePromises = parts.map((part, index) => {
      return supabase
        .from("parts")
        .update({
          part_type: part.part_type,
          position_type: part.position_type,
          // ...
        })
        .eq("id", part.id)
        .then(({ data, error }) => {
          if (error) {
            return { index, error: error.message };
          }
          return { index, data };
        });
    });

    // Execute all updates concurrently
    const results = await Promise.all(updatePromises);

    // Separate successes from failures
    const successes = results.filter((r) => !r.error);
    const failures = results.filter((r) => r.error);

    if (failures.length > 0) {
      return {
        success: false,
        updated: successes.length,
        errors: failures.map((f) => ({
          index: f.index,
          message: f.error,
        })),
      };
    }

    return {
      success: true,
      updated: successes.length,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [{ index: 0, message: error.message }],
    };
  }
}
```

**Why `Promise.all`**:
- Updates are independent (no shared state)
- Faster than sequential (100 updates in parallel vs 100 sequential)
- PostgreSQL handles concurrency

**Alternative (Sequential)**:
```typescript
// ❌ Slower for independent operations
for (const part of parts) {
  await supabase.from("parts").update(...).eq("id", part.id);
}
```

---

## Related Documentation

- [API_DESIGN.md](API_DESIGN.md) - How API routes delegate to services
- [DATA_FLOW.md](DATA_FLOW.md) - Service layer in request lifecycle
- [docs/features/data-management/BULK_OPERATIONS.md](../features/data-management/BULK_OPERATIONS.md)
- [docs/features/data-management/EXCEL_EXPORT.md](../features/data-management/EXCEL_EXPORT.md)

---

**Next**: Read [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) to understand client-side state patterns with TanStack Query.
