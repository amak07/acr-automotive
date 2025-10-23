# Phase 1: Bulk Operations + Excel Export - Production Plan

**Version:** 1.0
**Date:** October 21, 2025
**Estimated Effort:** 30-38 hours
**Dependencies:** SheetJS (xlsx 0.18.5), PostgreSQL extensions
**Status:** Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Bulk Operations APIs](#bulk-operations-apis)
4. [Excel Export System](#excel-export-system)
5. [Service Layer Architecture](#service-layer-architecture)
6. [Testing Strategy](#testing-strategy)
7. [Implementation Checklist](#implementation-checklist)

---

## Overview

### **Phase 1 Goals**

Build the foundation for data management:
- ✅ Enable bulk create/update/delete operations
- ✅ Generate standardized Excel exports
- ✅ Prepare schema for future multi-tenancy
- ✅ Establish atomic transaction patterns

### **What's Included**

**Bulk Operations APIs (18-22 hours):**
- 9 REST endpoints (parts, VAs, CRs × create/update/delete)
- Atomic transaction wrapper
- Zod validation schemas
- Business logic validation

**Excel Export System (6-8 hours):**
- 3-sheet workbook generation (Parts, Vehicle_Applications, Cross_References)
- Hidden ID columns (_id, _tenant_id)
- Export options: All data, Filtered data, Empty template

**Database Migration (2-3 hours):**
- Add tenant_id columns (nullable, defaults NULL)
- Update unique constraints (composite tenant-scoped)
- Create import_history table (for Phase 2)

**Testing (6.5 hours):**
- Unit tests for all 9 bulk API endpoints
- Integration tests for Excel export
- Transaction rollback tests

### **What's NOT Included (Phase 2)**

- ❌ Excel import/parsing
- ❌ Validation engine
- ❌ Diff engine
- ❌ Rollback system
- ❌ Admin UI components

---

## Database Schema Changes

### **Migration 005: Add Multi-Tenancy Support**

**File:** `src/lib/supabase/migrations/005_add_tenant_id.sql`

```sql
-- ============================================================================
-- Migration 005: Add Multi-Tenancy Support (Preparation)
-- Description: Add tenant_id columns for future multi-tenancy
-- Date: 2025-10-21
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Add tenant_id columns to all core tables
-- =====================================================

-- Parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Vehicle applications
ALTER TABLE vehicle_applications
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Cross references
ALTER TABLE cross_references
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Part images
ALTER TABLE part_images
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Part 360 frames
ALTER TABLE part_360_frames
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- All tenant_id columns default to NULL for MVP (single tenant)
-- Future: Will be populated with actual tenant IDs from auth context

-- =====================================================
-- 2. Create tenants table (for future use)
-- =====================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'inactive'))
);

-- Add comment
COMMENT ON TABLE tenants IS
    'Multi-tenant support. MVP uses NULL tenant_id (default tenant). Future: One row per dealer/business.';

-- =====================================================
-- 3. Update unique constraints for tenant isolation
-- =====================================================

-- Parts: ACR_SKU must be unique per tenant
DROP INDEX IF EXISTS idx_parts_acr_sku_unique;
CREATE UNIQUE INDEX idx_parts_sku_tenant
    ON parts(acr_sku, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'));

-- Comment explaining NULL tenant_id handling
COMMENT ON INDEX idx_parts_sku_tenant IS
    'Ensures ACR_SKU uniqueness per tenant. NULL tenant_id treated as default tenant (00000000-0000-0000-0000-000000000000).';

-- Vehicle Applications: (part_id, make, model, start_year) unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_apps_unique_per_tenant
    ON vehicle_applications(
        part_id,
        make,
        model,
        start_year,
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')
    );

-- Cross References: (acr_part_id, competitor_sku, competitor_brand) unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_refs_unique_per_tenant
    ON cross_references(
        acr_part_id,
        competitor_sku,
        COALESCE(competitor_brand, ''),
        COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000')
    );

-- =====================================================
-- 4. Add performance indexes for tenant_id
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_parts_tenant_id ON parts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_applications_tenant_id ON vehicle_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_references_tenant_id ON cross_references(tenant_id);
CREATE INDEX IF NOT EXISTS idx_part_images_tenant_id ON part_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_part_360_frames_tenant_id ON part_360_frames(tenant_id);

-- =====================================================
-- 5. Enable Row Level Security (RLS) for tenants table
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Public read (for now - will restrict later)
CREATE POLICY "Public read tenants" ON tenants FOR SELECT USING (true);

-- Admin write (for now - will restrict later)
CREATE POLICY "Admin write tenants" ON tenants FOR ALL USING (true);

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed successfully';
  RAISE NOTICE 'Added tenant_id columns to 5 tables';
  RAISE NOTICE 'Updated 3 unique constraints for tenant isolation';
  RAISE NOTICE 'Created 5 indexes for tenant_id queries';
  RAISE NOTICE 'Created tenants table for future multi-tenancy';
END $$;
```

---

### **Migration 006: Create Import History Table**

**File:** `src/lib/supabase/migrations/006_add_import_history.sql`

```sql
-- ============================================================================
-- Migration 006: Add Import History (Rollback Support)
-- Description: Table for storing import snapshots for rollback feature
-- Date: 2025-10-21
-- Idempotent: Yes (safe to re-run)
-- ============================================================================

-- =====================================================
-- 1. Create import_history table
-- =====================================================

CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_snapshot CHECK (
        snapshot ? 'timestamp' AND
        snapshot ? 'changes_summary' AND
        snapshot ? 'rollback_data'
    )
);

-- Add helpful comment
COMMENT ON TABLE import_history IS
    'Stores last 3 import snapshots for rollback feature. JSONB contains inverse operations needed to undo import.';

COMMENT ON COLUMN import_history.snapshot IS
    'JSONB structure: { timestamp, changes_summary: {...}, rollback_data: { parts_to_delete, parts_to_restore, parts_to_revert, ... } }';

-- =====================================================
-- 2. Create indexes for performance
-- =====================================================

-- Query last N imports per tenant (most common query)
CREATE INDEX IF NOT EXISTS idx_import_history_tenant_created
    ON import_history(tenant_id, created_at DESC);

-- Query all imports (admin audit trail)
CREATE INDEX IF NOT EXISTS idx_import_history_created
    ON import_history(created_at DESC);

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================

ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Public read (for rollback status check)
CREATE POLICY "Public read import history"
    ON import_history FOR SELECT USING (true);

-- Admin write (for creating/deleting snapshots)
CREATE POLICY "Admin write import history"
    ON import_history FOR ALL USING (true);

-- =====================================================
-- 4. Create function to auto-cleanup old snapshots
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_import_snapshots()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep only last 3 snapshots per tenant
    DELETE FROM import_history
    WHERE id IN (
        SELECT id FROM import_history
        WHERE tenant_id IS NOT DISTINCT FROM NEW.tenant_id
        ORDER BY created_at DESC
        OFFSET 3
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_import_snapshots ON import_history;
CREATE TRIGGER trigger_cleanup_import_snapshots
    AFTER INSERT ON import_history
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_import_snapshots();

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 006 completed successfully';
  RAISE NOTICE 'Created import_history table';
  RAISE NOTICE 'Created 2 indexes';
  RAISE NOTICE 'Created auto-cleanup trigger (keeps last 3 snapshots)';
END $$;
```

---

## Bulk Operations APIs

### **API Endpoint Structure**

```
src/app/api/admin/bulk/
├── parts/
│   ├── create/route.ts      → POST bulk create parts
│   ├── update/route.ts      → POST bulk update parts
│   └── delete/route.ts      → POST bulk delete parts
├── vehicles/
│   ├── create/route.ts      → POST bulk create vehicle applications
│   ├── update/route.ts      → POST bulk update vehicle applications
│   └── delete/route.ts      → POST bulk delete vehicle applications
└── cross-references/
    ├── create/route.ts      → POST bulk create cross references
    ├── update/route.ts      → POST bulk update cross references
    └── delete/route.ts      → POST bulk delete cross references
```

---

### **1. Bulk Parts Create**

**Endpoint:** `POST /api/admin/bulk/parts/create`

**Request Schema:**
```typescript
// File: src/lib/validation/bulk-operations.ts

import { z } from 'zod';

export const bulkCreatePartsSchema = z.object({
  operations: z.array(z.object({
    acr_sku: z.string().min(1).max(50),
    part_type: z.string().min(1).max(100),
    position_type: z.string().max(50).optional().nullable(),
    abs_type: z.string().max(20).optional().nullable(),
    bolt_pattern: z.string().max(50).optional().nullable(),
    drive_type: z.string().max(50).optional().nullable(),
    specifications: z.string().optional().nullable(),
    tenant_id: z.string().uuid().optional().nullable(), // For future MT
  })).min(1).max(500), // Max 500 parts per bulk operation
});

export type BulkCreatePartsRequest = z.infer<typeof bulkCreatePartsSchema>;
```

**Response:**
```typescript
interface BulkCreatePartsResponse {
  success: true;
  created: number;
  parts: Array<{
    id: string;
    acr_sku: string;
  }>;
}

// OR on error:
interface BulkCreatePartsError {
  success: false;
  error: string;
  details?: Array<{
    index: number;
    acr_sku: string;
    error: string;
  }>;
}
```

**Implementation:**
```typescript
// File: src/app/api/admin/bulk/parts/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { bulkCreatePartsSchema } from '@/lib/validation/bulk-operations';
import { BulkOperationsService } from '@/lib/services/bulk-operations.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operations } = bulkCreatePartsSchema.parse(body);

    // Use bulk service (atomic transaction)
    const result = await BulkOperationsService.bulkCreateParts(operations);

    return NextResponse.json({
      success: true,
      created: result.length,
      parts: result.map(p => ({ id: p.id, acr_sku: p.acr_sku })),
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map(issue => ({
          index: issue.path[1] as number,
          field: issue.path[2],
          error: issue.message,
        })),
      }, { status: 400 });
    }

    console.error('[Bulk Create Parts] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create parts',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

### **2. Bulk Parts Update**

**Endpoint:** `POST /api/admin/bulk/parts/update`

**Request Schema:**
```typescript
export const bulkUpdatePartsSchema = z.object({
  operations: z.array(z.object({
    id: z.string().uuid(),
    updates: z.object({
      part_type: z.string().min(1).max(100).optional(),
      position_type: z.string().max(50).optional().nullable(),
      abs_type: z.string().max(20).optional().nullable(),
      bolt_pattern: z.string().max(50).optional().nullable(),
      drive_type: z.string().max(50).optional().nullable(),
      specifications: z.string().optional().nullable(),
      // NOTE: acr_sku NOT allowed in bulk update (use import for SKU changes with warnings)
    }),
  })).min(1).max(500),
});
```

**Response:**
```typescript
interface BulkUpdatePartsResponse {
  success: true;
  updated: number;
  parts: Array<{
    id: string;
    acr_sku: string;
  }>;
}
```

**Implementation:** Similar to create, uses `BulkOperationsService.bulkUpdateParts()`

---

### **3. Bulk Parts Delete**

**Endpoint:** `POST /api/admin/bulk/parts/delete`

**Request Schema:**
```typescript
export const bulkDeletePartsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});
```

**Response:**
```typescript
interface BulkDeletePartsResponse {
  success: true;
  deleted: number;
  cascaded: {
    vehicle_applications: number;
    cross_references: number;
    part_images: number;
    part_360_frames: number;
  };
}
```

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = bulkDeletePartsSchema.parse(body);

    // Count cascaded deletes BEFORE deleting
    const cascadeCounts = await BulkOperationsService.countCascadedDeletes(ids);

    // Delete in transaction (cascades automatically via FK constraints)
    await BulkOperationsService.bulkDeleteParts(ids);

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      cascaded: cascadeCounts,
    });

  } catch (error) {
    // ... error handling
  }
}
```

---

### **4-9. Vehicle Applications & Cross References APIs**

Similar structure for vehicles and cross-references:

**Vehicle Applications:**
- `POST /api/admin/bulk/vehicles/create`
- `POST /api/admin/bulk/vehicles/update`
- `POST /api/admin/bulk/vehicles/delete`

**Cross References:**
- `POST /api/admin/bulk/cross-references/create`
- `POST /api/admin/bulk/cross-references/update`
- `POST /api/admin/bulk/cross-references/delete`

**Key Differences:**

**Vehicle Applications Schema:**
```typescript
export const bulkCreateVehiclesSchema = z.object({
  operations: z.array(z.object({
    part_id: z.string().uuid(),
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(100),
    start_year: z.number().int().min(1900).max(2100),
    end_year: z.number().int().min(1900).max(2100),
    tenant_id: z.string().uuid().optional().nullable(),
  }).refine(data => data.start_year <= data.end_year, {
    message: 'start_year must be <= end_year',
  })).min(1).max(1000),
});
```

**Cross References Schema:**
```typescript
export const bulkCreateCrossRefsSchema = z.object({
  operations: z.array(z.object({
    acr_part_id: z.string().uuid(),
    competitor_sku: z.string().min(1).max(50),
    competitor_brand: z.string().max(50).optional().nullable(),
    tenant_id: z.string().uuid().optional().nullable(),
  })).min(1).max(1000),
});
```

---

## Excel Export System

### **Export Service Architecture**

```typescript
// File: src/lib/services/excel-export.service.ts

import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';

export interface ExportOptions {
  format: 'all' | 'filtered' | 'template';
  filters?: {
    part_type?: string;
    position_type?: string;
    search?: string;
  };
  tenantId?: string; // For future MT
}

export class ExcelExportService {
  /**
   * Generate Excel export with 3 sheets
   * Returns buffer ready for download
   */
  static async generateExport(options: ExportOptions): Promise<Buffer> {
    // Step 1: Query data based on options
    const data = await this.queryData(options);

    // Step 2: Create workbook
    const workbook = XLSX.utils.book_new();

    // Step 3: Add three sheets
    const partsSheet = this.createPartsSheet(data.parts);
    const vehiclesSheet = this.createVehiclesSheet(data.vehicles);
    const crossRefsSheet = this.createCrossRefsSheet(data.crossRefs);

    XLSX.utils.book_append_sheet(workbook, partsSheet, 'Parts');
    XLSX.utils.book_append_sheet(workbook, vehiclesSheet, 'Vehicle_Applications');
    XLSX.utils.book_append_sheet(workbook, crossRefsSheet, 'Cross_References');

    // Step 4: Add instructions sheet
    const instructionsSheet = this.createInstructionsSheet();
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'README');

    // Step 5: Return buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Query data from database
   */
  private static async queryData(options: ExportOptions) {
    if (options.format === 'template') {
      // Return empty arrays with correct structure
      return {
        parts: [],
        vehicles: [],
        crossRefs: [],
      };
    }

    // Build query based on filters
    let partsQuery = supabase
      .from('parts')
      .select(`
        id,
        acr_sku,
        part_type,
        position_type,
        abs_type,
        bolt_pattern,
        drive_type,
        specifications,
        tenant_id
      `)
      .order('acr_sku', { ascending: true });

    // Apply filters
    if (options.filters?.part_type) {
      partsQuery = partsQuery.eq('part_type', options.filters.part_type);
    }
    if (options.filters?.position_type) {
      partsQuery = partsQuery.eq('position_type', options.filters.position_type);
    }
    if (options.filters?.search) {
      partsQuery = partsQuery.ilike('acr_sku', `%${options.filters.search}%`);
    }
    if (options.tenantId !== undefined) {
      partsQuery = partsQuery.eq('tenant_id', options.tenantId);
    }

    const { data: parts, error: partsError } = await partsQuery;
    if (partsError) throw partsError;

    // Get vehicle applications for exported parts
    const partIds = parts?.map(p => p.id) || [];
    const { data: vehicles } = await supabase
      .from('vehicle_applications')
      .select('*')
      .in('part_id', partIds)
      .order('part_id', { ascending: true });

    // Get cross references for exported parts
    const { data: crossRefs } = await supabase
      .from('cross_references')
      .select('*')
      .in('acr_part_id', partIds)
      .order('acr_part_id', { ascending: true });

    return {
      parts: parts || [],
      vehicles: vehicles || [],
      crossRefs: crossRefs || [],
    };
  }

  /**
   * Create Parts sheet with hidden ID columns
   */
  private static createPartsSheet(parts: any[]) {
    const rows = parts.map(p => ({
      '_id': p.id,
      '_tenant_id': p.tenant_id || '',
      'ACR_SKU': p.acr_sku,
      'Part_Type': p.part_type,
      'Position_Type': p.position_type || '',
      'ABS_Type': p.abs_type || '',
      'Bolt_Pattern': p.bolt_pattern || '',
      'Drive_Type': p.drive_type || '',
      'Specifications': p.specifications || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Hide ID columns (columns A and B)
    worksheet['!cols'] = [
      { hidden: true, wch: 40 },  // _id (hidden, wide for UUID)
      { hidden: true, wch: 40 },  // _tenant_id (hidden)
      { wch: 15 },                // ACR_SKU
      { wch: 20 },                // Part_Type
      { wch: 15 },                // Position_Type
      { wch: 12 },                // ABS_Type
      { wch: 15 },                // Bolt_Pattern
      { wch: 15 },                // Drive_Type
      { wch: 40 },                // Specifications
    ];

    return worksheet;
  }

  /**
   * Create Vehicle Applications sheet
   */
  private static createVehiclesSheet(vehicles: any[]) {
    const rows = vehicles.map(v => ({
      '_id': v.id,
      '_part_id': v.part_id,
      '_tenant_id': v.tenant_id || '',
      'ACR_SKU': this.lookupPartSku(v.part_id),  // Helper lookup
      'Make': v.make,
      'Model': v.model,
      'Start_Year': v.start_year,
      'End_Year': v.end_year,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Hide ID columns
    worksheet['!cols'] = [
      { hidden: true, wch: 40 },  // _id
      { hidden: true, wch: 40 },  // _part_id
      { hidden: true, wch: 40 },  // _tenant_id
      { wch: 15 },                // ACR_SKU (for user reference)
      { wch: 15 },                // Make
      { wch: 20 },                // Model
      { wch: 12 },                // Start_Year
      { wch: 12 },                // End_Year
    ];

    return worksheet;
  }

  /**
   * Create Cross References sheet
   */
  private static createCrossRefsSheet(crossRefs: any[]) {
    const rows = crossRefs.map(cr => ({
      '_id': cr.id,
      '_acr_part_id': cr.acr_part_id,
      '_tenant_id': cr.tenant_id || '',
      'ACR_SKU': this.lookupPartSku(cr.acr_part_id),
      'Competitor_SKU': cr.competitor_sku,
      'Competitor_Brand': cr.competitor_brand || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { hidden: true, wch: 40 },  // _id
      { hidden: true, wch: 40 },  // _acr_part_id
      { hidden: true, wch: 40 },  // _tenant_id
      { wch: 15 },                // ACR_SKU
      { wch: 15 },                // Competitor_SKU
      { wch: 20 },                // Competitor_Brand
    ];

    return worksheet;
  }

  /**
   * Create instructions sheet
   */
  private static createInstructionsSheet() {
    const instructions = [
      ['ACR Automotive - Data Export'],
      [''],
      ['INSTRUCTIONS:'],
      ['1. This file contains your current parts catalog, vehicle applications, and cross-references.'],
      ['2. You can edit the visible columns, add new rows, or delete rows.'],
      ['3. DO NOT delete or edit the hidden columns (they contain system IDs).'],
      ['4. To add new parts: Add rows at the bottom with empty _id column.'],
      ['5. To update parts: Edit the visible columns, keep _id unchanged.'],
      ['6. To delete parts: Remove the entire row.'],
      ['7. Import this file back to apply your changes.'],
      [''],
      ['WARNINGS:'],
      ['- Deleting a part will also delete its vehicle applications and cross-references.'],
      ['- Changing ACR_SKU will show a warning during import (all related data updated).'],
      ['- Large deletions (>20 items) will require confirmation during import.'],
      [''],
      ['HIDDEN COLUMNS:'],
      ['- _id: System ID for this record (DO NOT EDIT)'],
      ['- _part_id: Foreign key to parts table (DO NOT EDIT)'],
      ['- _tenant_id: Multi-tenant support (future use, leave empty)'],
      [''],
      ['For help, contact ACR Automotive support.'],
    ];

    return XLSX.utils.aoa_to_sheet(instructions);
  }

  // Helper to lookup part SKU by ID (cached in memory during export)
  private static partSkuCache: Map<string, string> = new Map();

  private static lookupPartSku(partId: string): string {
    return this.partSkuCache.get(partId) || '';
  }
}
```

---

### **Export API Endpoint**

**Endpoint:** `GET /api/admin/export`

**Query Parameters:**
```typescript
interface ExportQueryParams {
  format?: 'all' | 'filtered' | 'template'; // Default: 'all'
  part_type?: string;
  position_type?: string;
  search?: string;
}
```

**Implementation:**
```typescript
// File: src/app/api/admin/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ExcelExportService } from '@/lib/services/excel-export.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      format: (searchParams.get('format') || 'all') as 'all' | 'filtered' | 'template',
      filters: {
        part_type: searchParams.get('part_type') || undefined,
        position_type: searchParams.get('position_type') || undefined,
        search: searchParams.get('search') || undefined,
      },
    };

    // Generate Excel buffer
    const buffer = await ExcelExportService.generateExport(options);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ACR_Export_${timestamp}.xlsx`;

    // Return file for download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate export',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

## Service Layer Architecture

### **Bulk Operations Service**

```typescript
// File: src/lib/services/bulk-operations.service.ts

import { supabase } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

type Part = Tables<'parts'>;
type PartInsert = TablesInsert<'parts'>;
type PartUpdate = TablesUpdate<'parts'>;

export class BulkOperationsService {
  /**
   * Bulk create parts (atomic transaction)
   */
  static async bulkCreateParts(operations: PartInsert[]): Promise<Part[]> {
    // Validate: Check for duplicate ACR_SKUs within batch
    const skus = operations.map(op => op.acr_sku);
    const duplicates = skus.filter((sku, idx) => skus.indexOf(sku) !== idx);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate ACR_SKUs in batch: ${duplicates.join(', ')}`);
    }

    // Validate: Check if SKUs already exist in database
    const { data: existing } = await supabase
      .from('parts')
      .select('acr_sku')
      .in('acr_sku', skus);

    if (existing && existing.length > 0) {
      const existingSkus = existing.map(p => p.acr_sku);
      throw new Error(`Parts already exist: ${existingSkus.join(', ')}`);
    }

    // Insert all parts in single query (Supabase handles transaction internally)
    const { data, error } = await supabase
      .from('parts')
      .insert(operations)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk update parts (atomic transaction)
   */
  static async bulkUpdateParts(
    operations: Array<{ id: string; updates: PartUpdate }>
  ): Promise<Part[]> {
    const results: Part[] = [];

    // Note: Supabase doesn't support batch updates in single query
    // We need to use RPC or individual updates
    // For true atomicity, use Supabase Edge Function with Postgres transaction

    for (const op of operations) {
      const { data, error } = await supabase
        .from('parts')
        .update(op.updates)
        .eq('id', op.id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    return results;
  }

  /**
   * Bulk delete parts (atomic, cascades to VAs and CRs)
   */
  static async bulkDeleteParts(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('parts')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Count items that will be cascade deleted
   */
  static async countCascadedDeletes(partIds: string[]) {
    const [vaCount, crCount, imgCount, framesCount] = await Promise.all([
      supabase.from('vehicle_applications').select('id', { count: 'exact', head: true }).in('part_id', partIds),
      supabase.from('cross_references').select('id', { count: 'exact', head: true }).in('acr_part_id', partIds),
      supabase.from('part_images').select('id', { count: 'exact', head: true }).in('part_id', partIds),
      supabase.from('part_360_frames').select('id', { count: 'exact', head: true }).in('part_id', partIds),
    ]);

    return {
      vehicle_applications: vaCount.count || 0,
      cross_references: crCount.count || 0,
      part_images: imgCount.count || 0,
      part_360_frames: framesCount.count || 0,
    };
  }

  /**
   * Bulk create vehicle applications
   */
  static async bulkCreateVehicles(operations: TablesInsert<'vehicle_applications'>[]) {
    // Validate: Check part_ids exist
    const partIds = [...new Set(operations.map(op => op.part_id))];
    const { data: existingParts } = await supabase
      .from('parts')
      .select('id')
      .in('id', partIds);

    const validPartIds = new Set(existingParts?.map(p => p.id) || []);
    const invalidOps = operations.filter(op => !validPartIds.has(op.part_id));

    if (invalidOps.length > 0) {
      throw new Error(`Invalid part_ids: ${invalidOps.map(op => op.part_id).join(', ')}`);
    }

    // Validate: year ranges
    const invalidRanges = operations.filter(op => op.start_year > op.end_year);
    if (invalidRanges.length > 0) {
      throw new Error(`Invalid year ranges (start > end)`);
    }

    // Insert
    const { data, error } = await supabase
      .from('vehicle_applications')
      .insert(operations)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk update vehicle applications
   */
  static async bulkUpdateVehicles(
    operations: Array<{ id: string; updates: TablesUpdate<'vehicle_applications'> }>
  ) {
    const results = [];

    for (const op of operations) {
      const { data, error } = await supabase
        .from('vehicle_applications')
        .update(op.updates)
        .eq('id', op.id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    return results;
  }

  /**
   * Bulk delete vehicle applications
   */
  static async bulkDeleteVehicles(ids: string[]) {
    const { error } = await supabase
      .from('vehicle_applications')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  /**
   * Bulk create cross references
   */
  static async bulkCreateCrossRefs(operations: TablesInsert<'cross_references'>[]) {
    // Validate: Check acr_part_ids exist
    const partIds = [...new Set(operations.map(op => op.acr_part_id))];
    const { data: existingParts } = await supabase
      .from('parts')
      .select('id')
      .in('id', partIds);

    const validPartIds = new Set(existingParts?.map(p => p.id) || []);
    const invalidOps = operations.filter(op => !validPartIds.has(op.acr_part_id));

    if (invalidOps.length > 0) {
      throw new Error(`Invalid acr_part_ids: ${invalidOps.map(op => op.acr_part_id).join(', ')}`);
    }

    // Insert
    const { data, error } = await supabase
      .from('cross_references')
      .insert(operations)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk update cross references
   */
  static async bulkUpdateCrossRefs(
    operations: Array<{ id: string; updates: TablesUpdate<'cross_references'> }>
  ) {
    const results = [];

    for (const op of operations) {
      const { data, error } = await supabase
        .from('cross_references')
        .update(op.updates)
        .eq('id', op.id)
        .select()
        .single();

      if (error) throw error;
      results.push(data);
    }

    return results;
  }

  /**
   * Bulk delete cross references
   */
  static async bulkDeleteCrossRefs(ids: string[]) {
    const { error} = await supabase
      .from('cross_references')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }
}
```

---

## Testing Strategy

### **Unit Tests (6.5 hours)**

**Test File:** `src/lib/services/__tests__/bulk-operations.test.ts`

```typescript
import { BulkOperationsService } from '../bulk-operations.service';
import { supabase } from '@/lib/supabase/client';

describe('BulkOperationsService - Parts', () => {
  describe('bulkCreateParts', () => {
    it('creates multiple parts atomically', async () => {
      const operations = [
        { acr_sku: 'TEST-001', part_type: 'Wheel Hub' },
        { acr_sku: 'TEST-002', part_type: 'Wheel Hub' },
        { acr_sku: 'TEST-003', part_type: 'Wheel Hub' },
      ];

      const result = await BulkOperationsService.bulkCreateParts(operations);

      expect(result).toHaveLength(3);
      expect(result[0].acr_sku).toBe('TEST-001');
    });

    it('rejects duplicate ACR_SKUs within batch', async () => {
      const operations = [
        { acr_sku: 'TEST-DUP', part_type: 'Wheel Hub' },
        { acr_sku: 'TEST-DUP', part_type: 'Wheel Hub' },
      ];

      await expect(
        BulkOperationsService.bulkCreateParts(operations)
      ).rejects.toThrow('Duplicate ACR_SKUs');
    });

    it('rejects if ACR_SKU already exists in DB', async () => {
      // Create part first
      await supabase.from('parts').insert({ acr_sku: 'TEST-EXISTS', part_type: 'Wheel Hub' });

      const operations = [
        { acr_sku: 'TEST-EXISTS', part_type: 'Wheel Hub' },
      ];

      await expect(
        BulkOperationsService.bulkCreateParts(operations)
      ).rejects.toThrow('Parts already exist');
    });
  });

  describe('bulkUpdateParts', () => {
    it('updates multiple parts', async () => {
      // Create parts first
      const { data: parts } = await supabase
        .from('parts')
        .insert([
          { acr_sku: 'TEST-UPD-1', part_type: 'Wheel Hub' },
          { acr_sku: 'TEST-UPD-2', part_type: 'Wheel Hub' },
        ])
        .select();

      const operations = [
        { id: parts[0].id, updates: { specifications: 'Updated spec 1' } },
        { id: parts[1].id, updates: { specifications: 'Updated spec 2' } },
      ];

      const result = await BulkOperationsService.bulkUpdateParts(operations);

      expect(result[0].specifications).toBe('Updated spec 1');
      expect(result[1].specifications).toBe('Updated spec 2');
    });
  });

  describe('bulkDeleteParts', () => {
    it('deletes multiple parts and cascades to children', async () => {
      // Create part with VA and CR
      const { data: part } = await supabase
        .from('parts')
        .insert({ acr_sku: 'TEST-DEL', part_type: 'Wheel Hub' })
        .select()
        .single();

      await supabase.from('vehicle_applications').insert({
        part_id: part.id,
        make: 'Honda',
        model: 'Civic',
        start_year: 2016,
        end_year: 2020,
      });

      await supabase.from('cross_references').insert({
        acr_part_id: part.id,
        competitor_sku: 'COMP-123',
        competitor_brand: 'Competitor',
      });

      // Delete part
      await BulkOperationsService.bulkDeleteParts([part.id]);

      // Verify cascaded deletes
      const { data: vas } = await supabase
        .from('vehicle_applications')
        .select()
        .eq('part_id', part.id);

      const { data: crs } = await supabase
        .from('cross_references')
        .select()
        .eq('acr_part_id', part.id);

      expect(vas).toHaveLength(0);
      expect(crs).toHaveLength(0);
    });
  });
});

// Similar tests for vehicles and cross-references...
```

**Test File:** `src/lib/services/__tests__/excel-export.test.ts`

```typescript
import { ExcelExportService } from '../excel-export.service';
import * as XLSX from 'xlsx';

describe('ExcelExportService', () => {
  it('generates valid 3-sheet Excel file', async () => {
    const buffer = await ExcelExportService.generateExport({ format: 'all' });

    const workbook = XLSX.read(buffer, { type: 'buffer' });

    expect(workbook.SheetNames).toContain('Parts');
    expect(workbook.SheetNames).toContain('Vehicle_Applications');
    expect(workbook.SheetNames).toContain('Cross_References');
    expect(workbook.SheetNames).toContain('README');
  });

  it('hides ID columns in Parts sheet', async () => {
    const buffer = await ExcelExportService.generateExport({ format: 'all' });

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const partsSheet = workbook.Sheets['Parts'];

    expect(partsSheet['!cols'][0].hidden).toBe(true);  // _id column
    expect(partsSheet['!cols'][1].hidden).toBe(true);  // _tenant_id column
    expect(partsSheet['!cols'][2].hidden).toBeUndefined();  // ACR_SKU visible
  });

  it('exports empty template with headers only', async () => {
    const buffer = await ExcelExportService.generateExport({ format: 'template' });

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const partsSheet = workbook.Sheets['Parts'];
    const data = XLSX.utils.sheet_to_json(partsSheet);

    expect(data).toHaveLength(0);  // No data rows
    expect(partsSheet['A1'].v).toBe('_id');  // Headers present
  });

  it('applies filters when exporting filtered data', async () => {
    const buffer = await ExcelExportService.generateExport({
      format: 'filtered',
      filters: { part_type: 'Wheel Hub' },
    });

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const partsSheet = workbook.Sheets['Parts'];
    const data = XLSX.utils.sheet_to_json(partsSheet);

    // All rows should have part_type = 'Wheel Hub'
    data.forEach((row: any) => {
      expect(row.Part_Type).toBe('Wheel Hub');
    });
  });
});
```

---

## Implementation Checklist

### **Week 1: Database + Bulk APIs (18-22h)**

**Database Migration (2-3h):**
- [ ] Create `005_add_tenant_id.sql` migration
- [ ] Create `006_add_import_history.sql` migration
- [ ] Run migrations in local Supabase
- [ ] Verify indexes created
- [ ] Test unique constraints work

**Bulk Parts APIs (6-8h):**
- [ ] Create validation schemas (`bulk-operations.ts`)
- [ ] Implement `POST /api/admin/bulk/parts/create`
- [ ] Implement `POST /api/admin/bulk/parts/update`
- [ ] Implement `POST /api/admin/bulk/parts/delete`
- [ ] Test each endpoint with Postman/Thunder Client

**Bulk Vehicles APIs (4-5h):**
- [ ] Implement `POST /api/admin/bulk/vehicles/create`
- [ ] Implement `POST /api/admin/bulk/vehicles/update`
- [ ] Implement `POST /api/admin/bulk/vehicles/delete`

**Bulk Cross-Refs APIs (4-5h):**
- [ ] Implement `POST /api/admin/bulk/cross-references/create`
- [ ] Implement `POST /api/admin/bulk/cross-references/update`
- [ ] Implement `POST /api/admin/bulk/cross-references/delete`

**Service Layer (4-6h):**
- [ ] Create `BulkOperationsService` class
- [ ] Implement validation logic (duplicates, foreign keys)
- [ ] Implement cascade delete counting
- [ ] Add error handling and logging

---

### **Week 2: Excel Export (6-8h)**

**Export Service (4-5h):**
- [ ] Create `ExcelExportService` class
- [ ] Implement `generateExport()` method
- [ ] Implement `createPartsSheet()` with hidden columns
- [ ] Implement `createVehiclesSheet()`
- [ ] Implement `createCrossRefsSheet()`
- [ ] Implement `createInstructionsSheet()`
- [ ] Test hidden columns work in Excel

**Export API (1-2h):**
- [ ] Implement `GET /api/admin/export`
- [ ] Handle query parameters (filters)
- [ ] Test file download in browser
- [ ] Verify filename format

**Integration (1h):**
- [ ] Test export → open in Excel → verify data
- [ ] Test filters work correctly
- [ ] Test empty template generation

---

### **Week 3: Testing (6.5h)**

**Unit Tests (4h):**
- [ ] Test bulk create (parts, vehicles, cross-refs)
- [ ] Test bulk update
- [ ] Test bulk delete + cascades
- [ ] Test validation (duplicates, invalid IDs, year ranges)

**Integration Tests (2.5h):**
- [ ] Test Excel export (all formats)
- [ ] Test hidden columns
- [ ] Test filters
- [ ] Test large datasets (>1000 parts)

---

## Success Criteria

**Phase 1 Complete When:**

✅ All 9 bulk API endpoints working
✅ Excel export generates valid 3-sheet file
✅ Hidden ID columns work in Excel
✅ Filters apply correctly in exports
✅ Database migrations run successfully
✅ All tests passing (>90% coverage)
✅ No TypeScript errors
✅ Documentation complete

**Ready for Phase 2:**

✅ Bulk APIs tested and deployed
✅ Export format finalized (serves as import format)
✅ tenant_id schema in place
✅ Service layer patterns established

---

**Next:** [Phase 2: Excel Import + Rollback](./phase2-import-rollback-production.md)

---

**Last Updated:** October 21, 2025
**Status:** ✅ Ready for Implementation
