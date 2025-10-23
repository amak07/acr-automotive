# Data Management Architecture Notes

**Last Updated**: October 22, 2025

---

## Transaction Strategy

### Phase 8.1: Single-Table Operations (Atomic by Default)

Each bulk endpoint touches **one table only**:

```typescript
// ✅ ATOMIC - PostgreSQL handles multi-row INSERT atomically
await supabase.from('parts').insert([100 parts]);
// If part #50 fails, all 100 are rolled back automatically
```

**Endpoints**:
- `POST /api/admin/bulk/parts/create` → Only `parts` table
- `POST /api/admin/bulk/vehicles/create` → Only `vehicle_applications` table
- `POST /api/admin/bulk/cross-references/create` → Only `cross_references` table

**No explicit transaction needed** - PostgreSQL treats multi-row INSERT as atomic.

---

### Phase 8.2: Multi-Table Operations (Excel Import)

Excel import needs **all-or-nothing** across multiple tables:

```typescript
// Import one part with relations:
- 1 part (parts table)
- 2 vehicle applications (vehicle_applications table)
- 3 cross-references (cross_references table)

// If ANY operation fails, ALL must be rolled back
```

**Solution: PostgreSQL Function**

Create database function that wraps all operations in explicit transaction:

```sql
CREATE FUNCTION bulk_import_all_tables(
  p_parts JSONB,
  p_vehicles JSONB,
  p_cross_refs JSONB
) RETURNS JSONB AS $$
BEGIN
  -- All operations inside function are atomic
  INSERT INTO parts SELECT * FROM jsonb_populate_recordset(...);
  INSERT INTO vehicle_applications SELECT * FROM jsonb_populate_recordset(...);
  INSERT INTO cross_references SELECT * FROM jsonb_populate_recordset(...);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  -- Automatic rollback on any error
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
```

**Called from ImportService**:
```typescript
class ImportService {
  async executeImport(data: ExcelData) {
    return await supabase.rpc('bulk_import_all_tables', {
      p_parts: data.parts,
      p_vehicles: data.vehicles,
      p_cross_refs: data.crossRefs
    });
  }
}
```

---

## Service Architecture

### Phase 8.1: BulkOperationsService

**Purpose**: Handle bulk operations for individual tables

```typescript
class BulkOperationsService {
  // Single-table operations (atomic within table)
  async createParts(parts: CreatePartInput[]): Promise<Part[]>
  async updateParts(parts: UpdatePartInput[]): Promise<Part[]>
  async deleteParts(ids: string[]): Promise<void>

  async createVehicleApplications(vehicles: CreateVehicleInput[]): Promise<VehicleApplication[]>
  async updateVehicleApplications(vehicles: UpdateVehicleInput[]): Promise<VehicleApplication[]>
  async deleteVehicleApplications(ids: string[]): Promise<void>

  async createCrossReferences(refs: CreateCrossRefInput[]): Promise<CrossReference[]>
  async updateCrossReferences(refs: UpdateCrossRefInput[]): Promise<CrossReference[]>
  async deleteCrossReferences(ids: string[]): Promise<void>
}
```

**Used by**:
- Bulk API endpoints (`/api/admin/bulk/*`)
- Each endpoint calls one service method

---

### Phase 8.2: ImportService (Future)

**Purpose**: Orchestrate multi-table atomic imports

```typescript
class ImportService {
  private bulkOps: BulkOperationsService;

  async executeImport(data: ExcelData): Promise<ImportResult> {
    // Calls PostgreSQL function for true atomicity
    return await supabase.rpc('bulk_import_all_tables', data);
  }

  async createSnapshot(): Promise<Snapshot> { ... }
  async rollbackToSnapshot(id: string): Promise<void> { ... }
}
```

---

## Future Refactor (Post-Phase 8.2)

### Optional: Consolidate into PartsService

**Goal**: DRY up single and bulk operations

```typescript
class PartsService {
  async createOne(part: CreatePartInput): Promise<Part> {
    return this.createMany([part])[0];  // Reuse bulk logic
  }

  async createMany(parts: CreatePartInput[]): Promise<Part[]> {
    // Shared validation + atomic insert
  }
}
```

**Benefits**:
- Single source of validation logic
- Consistent behavior between single and bulk
- Easier testing

**When**: After Phase 8.2 is complete and tested

---

## Key Decisions

**October 22, 2025**:
1. ✅ Keep `BulkOperationsService` name for Phase 8.1 (clear separation)
2. ✅ Single-table operations only in Phase 8.1 (atomic by default)
3. ✅ Multi-table atomicity deferred to Phase 8.2 (PostgreSQL function)
4. ✅ Don't refactor existing single-operation routes yet (minimize risk)

---

**Maintainer Notes**:
- Phase 8.1 builds the building blocks (single-table operations)
- Phase 8.2 adds orchestration layer (multi-table atomicity)
- Keep this file updated with architectural decisions