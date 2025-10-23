# Category 1: Data Management System - Production Plan

**Version:** 2.0 (Production-Ready)
**Date:** October 21, 2025
**Status:** Ready for Implementation
**Total Effort:** 78-95 hours (8-10 weeks part-time)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase Breakdown](#phase-breakdown)
4. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
5. [Success Criteria](#success-criteria)
6. [Risk Mitigation](#risk-mitigation)

---

## Executive Summary

### **Purpose**

Build a production-grade bulk data management system for ACR Automotive that enables:
- Efficient bulk operations via atomic transactions
- Standardized Excel export/import workflows
- Safe rollback capabilities for error recovery
- Future multi-tenancy support

### **Business Value**

**For Humberto (Primary User):**
- Manage inventory via familiar Excel interface
- Bulk add/update/delete hundreds of parts at once
- Preview all changes before applying (safety net)
- Rollback last 3 imports if mistakes detected
- Reduce manual data entry time by 80%

**For ACR Automotive (Business):**
- Scale to manage 10,000+ parts efficiently
- Maintain data integrity with comprehensive validation
- Enable future multi-tenant expansion (multiple dealers)
- Reduce support tickets from manual entry errors

### **Key Decisions**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Import Format** | Export-only (no blank templates) | Simpler, safer, prevents data loss |
| **Matching Strategy** | ID-based only (no field fallback) | Multi-tenant ready, prevents conflicts |
| **ID Column Display** | Hidden columns in Excel | Clean UX, prevents accidental edits |
| **ACR_SKU Mutability** | Semi-immutable (warning on change) | Flexible but safe, preserves relationships |
| **Rollback History** | Last 3 snapshots, sequential rollback | Production safety, no over-engineering |
| **Multi-Tenancy Prep** | Add tenant_id schema NOW | Zero cost, future-proof |
| **Excel Library** | SheetJS (xlsx 0.18.5) | Sufficient, already installed |
| **Testing Coverage** | 13 hours (API + business logic) | Production-grade safety |

---

## Architecture Overview

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bulk Ops     │  │ Export       │  │ Import       │      │
│  │ Modals       │  │ Modal        │  │ Wizard       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/admin/  │  │ /api/admin/  │  │ /api/admin/  │      │
│  │ bulk/*       │  │ export       │  │ import/*     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ BulkOperationsService                                 │  │
│  │  - Atomic transactions                               │  │
│  │  - 3-layer validation (Zod → Business → DB)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ExcelExportService                                    │  │
│  │  - 3-sheet generation (Parts, VAs, CRs)             │  │
│  │  - Hidden ID columns                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ExcelImportService                                    │  │
│  │  - Parse Excel (SheetJS)                             │  │
│  │  - Validation engine (23 errors, 12 warnings)       │  │
│  │  - Diff engine (ID-based matching)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ RollbackService                                       │  │
│  │  - Snapshot management (JSONB storage)              │  │
│  │  - Inverse operations (restore/revert/delete)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Database Layer (Supabase)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ parts       │  │ vehicle_    │  │ cross_      │         │
│  │ + tenant_id │  │ applications│  │ references  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────────────────────────────────────┐           │
│  │ import_history (rollback snapshots)         │           │
│  │  - JSONB snapshot                           │           │
│  │  - Keep last 3                              │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### **Key Architectural Patterns**

#### **1. Atomic Transactions**
All bulk operations execute in single PostgreSQL transaction:
```typescript
// All-or-nothing guarantee
await db.transaction(async (tx) => {
  // 100 operations execute atomically
  // If ANY fails, ALL rollback automatically
});
```

#### **2. Three-Layer Validation**
```typescript
Layer 1: Zod Schema (API boundary)
         → Type safety, required fields, data types

Layer 2: Business Logic (Service layer)
         → ACR_SKU uniqueness, year ranges, foreign keys

Layer 3: Database Constraints (PostgreSQL)
         → Fallback safety, UNIQUE, NOT NULL, CHECK
```

#### **3. ID-Based Matching (Export-Import Loop)**
```typescript
// User workflow:
1. Export → Gets Excel with IDs (hidden columns)
2. Edit → Modifies data, IDs preserved
3. Import → System matches by ID, applies changes

// System behavior:
If ID exists in DB → UPDATE existing record
If ID missing → CREATE new record
If in DB but not Excel → DELETE record

// Multi-tenant safe:
ID = globally unique UUID
tenant_id = scoped per tenant (future)
```

---

## Phase Breakdown

### **Phase 1: Bulk Operations + Excel Export**

**Duration:** 30-38 hours (3-4 weeks part-time)
**Detailed Plan:** [phase1-bulk-export-production.md](./phase1-bulk-export-production.md)

**Deliverables:**
- ✅ Bulk APIs (9 endpoints: parts, VAs, CRs × create/update/delete)
- ✅ Excel export system (3-sheet format with hidden IDs)
- ✅ Database migration (tenant_id preparation)
- ✅ Service layer (atomic transactions, validation)
- ✅ Unit tests for APIs (6.5 hours)

**Dependencies:**
- SheetJS (xlsx 0.18.5) - already installed ✅
- PostgreSQL extensions (uuid-ossp, pg_trgm) - already enabled ✅

**Risk:** Moderate (well-understood patterns, no new tech)

---

### **Phase 2: Excel Import + Rollback**

**Duration:** 48-57 hours (5-6 weeks part-time)
**Detailed Plan:** [phase2-import-rollback-production.md](./phase2-import-rollback-production.md)

**Deliverables:**
- ✅ Import validation engine (23 error rules, 12 warnings)
- ✅ Diff engine (ID-based change detection)
- ✅ Import wizard UI (4-step flow with preview)
- ✅ 3-snapshot rollback system (sequential enforcement)
- ✅ Admin UI (rollback section in settings)
- ✅ Integration tests (6.5 hours)

**Dependencies:**
- Phase 1 bulk APIs ✅ (import executes via bulk operations)
- SheetJS for parsing ✅
- React Hook Form + Zod (already in use) ✅

**Risk:** High (complex diff logic, data integrity critical)
**Mitigation:** Extensive preview step, comprehensive testing

---

## Multi-Tenancy Strategy

### **Current State (MVP - Single Tenant)**
- Humberto's business only
- No tenant isolation needed
- All data owned by "default tenant"

### **Future State (Multi-Tenant SaaS)**
- Multiple dealers/businesses
- Data isolation per tenant
- Shared codebase

### **Preparation Strategy: "Schema Now, Logic Later"**

#### **Phase 1 (NOW - No Extra Work)**

**Add tenant_id columns:**
```sql
-- Migration 005: Add tenant_id to all tables
ALTER TABLE parts ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE vehicle_applications ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cross_references ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE import_history ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- All default to NULL for MVP (single tenant)
-- Future: Will populate with actual tenant IDs
```

**Update unique constraints:**
```sql
-- Replace simple ACR_SKU uniqueness with tenant-scoped uniqueness
DROP INDEX idx_parts_acr_sku_unique;
CREATE UNIQUE INDEX idx_parts_sku_tenant
  ON parts(acr_sku, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'));

-- NULL tenant_id treated as "default tenant" UUID
```

**Service layer accepts tenantId:**
```typescript
// All services ready for multi-tenancy
class BulkOperationsService {
  static async bulkCreate(
    items: T[],
    options?: { tenantId?: string }  // ← Optional now, required later
  ) {
    // MVP: tenantId is always null
    // Future: Use from auth context
  }
}
```

**Excel exports include tenant_id (hidden):**
```typescript
// Export columns:
_id (hidden)
_tenant_id (hidden)  // Always null for MVP, populated later
ACR_SKU (visible)
Part_Type (visible)
```

**Cost:** Zero additional hours (schema changes in planned migration)

#### **Phase 2 (LATER - When Onboarding Second Tenant)**

**What changes:**
1. Create `tenants` table
2. Update RLS policies (row-level security per tenant)
3. Update service layer to use actual tenant_id from auth
4. Import wizard validates tenant_id matches authenticated user

**What stays the same:**
- All APIs already accept tenantId parameter
- All database tables already have tenant_id columns
- Excel format already includes tenant_id (just populate it)

**Estimated Effort:** 15-20 hours (not included in current plan)

---

## Success Criteria

### **Phase 1 Success Metrics**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Bulk Create Speed** | <5s for 100 parts | Performance test |
| **Transaction Safety** | 100% rollback on error | Integration test |
| **Export File Size** | <5MB for 1000 parts | File size check |
| **Export Accuracy** | 100% data match | Validation test |
| **API Uptime** | No errors during testing | Test suite pass |

### **Phase 2 Success Metrics**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Import Validation** | Catches all 23 error types | Unit tests |
| **Diff Accuracy** | 100% correct change detection | Integration test |
| **Rollback Success** | Restores exact previous state | E2E test |
| **Preview Accuracy** | Matches actual import results | Manual QA |
| **User Satisfaction** | Humberto approves UX | User testing |

### **Production Readiness Checklist**

**Code Quality:**
- ✅ All TypeScript strict mode (no `any`)
- ✅ All API routes have Zod validation
- ✅ All services have error handling
- ✅ All database queries use parameterized queries (SQL injection safe)

**Testing:**
- ✅ 90%+ code coverage for services
- ✅ All API endpoints have unit tests
- ✅ Critical flows have integration tests
- ✅ Rollback tested with complex scenarios

**Security:**
- ✅ Admin-only endpoints (withAdminAuth HOC)
- ✅ Input validation (Zod + business logic)
- ✅ SQL injection prevention (parameterized queries)
- ✅ File upload limits (10MB per file)

**Performance:**
- ✅ Bulk operations <5s for 100 items
- ✅ Excel export <10s for 1000 parts
- ✅ Import validation <30s for 500 rows
- ✅ Database queries optimized (indexed columns)

**UX:**
- ✅ Loading states for long operations
- ✅ Progress indicators during import
- ✅ Clear error messages with row numbers
- ✅ Preview before destructive operations

---

## Risk Mitigation

### **High Risk: Data Loss During Import**

**Scenario:** User accidentally deletes all data in Excel, imports empty file
**Impact:** All parts, VAs, CRs deleted
**Mitigation:**
1. ✅ Large deletion warning (>20 items or >30% of DB)
2. ✅ Preview step shows all deletions in red
3. ✅ Explicit confirmation required
4. ✅ Rollback available (last 3 imports)

**Residual Risk:** Low

---

### **Medium Risk: Import Validation Complexity**

**Scenario:** Edge cases not caught by validation, corrupt data imported
**Impact:** Data integrity issues, manual cleanup required
**Mitigation:**
1. ✅ Three-layer validation (Zod + business + DB)
2. ✅ Comprehensive test suite (23 error scenarios)
3. ✅ Preview step for manual review
4. ✅ Atomic transactions (all-or-nothing)

**Residual Risk:** Low

---

### **Medium Risk: Rollback Complexity**

**Scenario:** Rollback fails mid-execution, database in inconsistent state
**Impact:** Partial rollback, data corruption
**Mitigation:**
1. ✅ Rollback uses atomic transaction
2. ✅ Integration tests for complex scenarios
3. ✅ Snapshots include all cascaded data (VAs, CRs)
4. ✅ Sequential rollback enforcement (prevents conflicts)

**Residual Risk:** Low

---

### **Low Risk: Performance Degradation**

**Scenario:** Bulk operations slow with large datasets (>1000 items)
**Impact:** User frustration, timeouts
**Mitigation:**
1. ✅ Batch processing (chunk 1000 into 10×100)
2. ✅ Progress indicators in UI
3. ✅ Database indexes on all query columns
4. ✅ Performance tests with large datasets

**Residual Risk:** Very Low

---

## Timeline & Effort Summary

### **Phase 1: Bulk Operations + Excel Export**

| Task | Hours | Confidence |
|------|-------|------------|
| Bulk APIs (9 endpoints) | 18-22 | High |
| Excel export service | 6-8 | High |
| Database migration | 2-3 | High |
| Service layer | 4-6 | Medium |
| Unit tests | 6.5 | High |
| **Phase 1 Total** | **30-38** | **High** |

### **Phase 2: Excel Import + Rollback**

| Task | Hours | Confidence |
|------|-------|------------|
| Import validation engine | 12-15 | Medium |
| Diff engine | 8-10 | Medium |
| Import wizard UI | 12-15 | High |
| Rollback service | 8-10 | Medium |
| Admin UI (rollback section) | 4-5 | High |
| Integration tests | 6.5 | High |
| **Phase 2 Total** | **48-57** | **Medium** |

### **Grand Total**

**Development:** 78-95 hours
**Testing:** 13 hours (included in above)
**Timeline:** 8-10 weeks part-time (20h/week)
**Calendar Duration:** ~2 months

---

## Next Steps

1. **Review** this plan with stakeholders
2. **Prioritize** Phase 1 or Phase 2 (recommendation: Phase 1 first)
3. **Read** detailed plans:
   - [Phase 1: Bulk Operations + Export](./phase1-bulk-export-production.md)
   - [Phase 2: Import + Rollback](./phase2-import-rollback-production.md)
   - [Excel Format Specification](./excel-format-specification.md)
4. **Begin** implementation once approved

---

## References

- **Original Technical Plan:** `docs/technical-plans/site-enhancements/acr_cat1_tech_plan.txt`
- **Phase 1 Detailed Plan:** `docs/technical-plans/data-management/phase1-bulk-export-production.md`
- **Phase 2 Detailed Plan:** `docs/technical-plans/data-management/phase2-import-rollback-production.md`
- **Excel Format Spec:** `docs/technical-plans/data-management/excel-format-specification.md`
- **Database Schema:** `src/lib/supabase/schema.sql`
- **Existing Migrations:** `src/lib/supabase/migrations/`

---

**Last Updated:** October 21, 2025
**Status:** ✅ Ready for Implementation
**Version:** 2.0 (Production-Ready)
