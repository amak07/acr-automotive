# Code Organization

> **Purpose**: Principles and patterns for organizing code in the ACR Automotive codebase
>
> **Last Updated**: 2025-10-27
> **Status**: Current standard

## Table of Contents

- [Overview](#overview)
- [Organizational Principles](#organizational-principles)
- [Directory Structure](#directory-structure)
- [Naming Conventions](#naming-conventions)
- [When to Create New Folders](#when-to-create-new-folders)

---

## Overview

The ACR Automotive codebase follows **industry-standard organizational patterns** that prioritize:

1. **Clarity** - Easy to find code
2. **Scalability** - Easy to add new features
3. **Maintainability** - Easy to understand and modify
4. **Separation of Concerns** - Clear boundaries between layers

---

## Organizational Principles

### 1. Separation by Purpose, Not File Type

**❌ Anti-pattern** (by file type):
```
src/
├── components/  # All components mixed together
├── hooks/       # All hooks mixed together
└── utils/       # All utilities mixed together
```

**✅ Good pattern** (by purpose/domain):
```
src/
├── components/
│   ├── features/     # Feature-specific components
│   │   ├── admin/    # Admin features
│   │   └── public/   # Public features
│   └── shared/       # Reusable across features
├── hooks/
│   └── api/          # Grouped by domain (parts, vehicles, etc.)
└── services/         # Business logic by domain
```

### 2. Feature-Based Over Role-Based

Components and logic are organized by **what they do** (feature), not **how they work** (role).

**Example**:
```
components/features/admin/parts/     # All parts-related admin UI
components/features/admin/settings/  # All settings-related admin UI
```

### 3. Domain-Driven Hooks

Related hooks are grouped in a single file by domain, not split into individual files.

**Example**:
```typescript
// ✅ Good: All parts hooks together
// src/hooks/api/admin/parts.ts
export function useGetParts() { ... }
export function useGetPartById() { ... }
export function useCreatePart() { ... }
export function useUpdatePartById() { ... }
```

**Benefits**:
- Fewer files to navigate
- Related functionality together
- Cleaner imports

### 4. Clear Lib vs Services Boundary

**`lib/`** = Low-level utilities and infrastructure
- No business logic
- Reusable across domains
- Stateless helpers
- Examples: parsers, validation schemas, database clients

**`services/`** = Business logic and orchestration
- Domain-specific operations
- Complex multi-step workflows
- Stateful operations
- Examples: BulkOperationsService, ExcelExportService

### 5. Scripts by Purpose

Utility scripts are organized by their purpose:

```
scripts/
├── db/       # Database operations (bootstrap, migrations, etc.)
├── test/     # Testing utilities
└── dev/      # Development debugging tools
```

---

## Directory Structure

### Components

```
src/components/
├── acr/              # ACR Design System (proprietary)
│   ├── Button.tsx
│   ├── Card.tsx
│   └── ...
│
├── ui/               # shadcn/ui base components (third-party)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
│
├── features/         # Feature-specific components
│   ├── admin/        # Admin-only features
│   │   ├── dashboard/
│   │   ├── parts/
│   │   ├── settings/
│   │   └── ...
│   └── public/       # Public-facing features
│       ├── search/
│       ├── parts/
│       └── ...
│
└── shared/           # Shared across features
    ├── layout/       # Global layout components
    └── auth/         # Authentication components
```

**When to use each**:
- `acr/` - Project-specific design system components
- `ui/` - Base components from shadcn/ui (copied, not imported)
- `features/admin/` - Admin-specific UI
- `features/public/` - Public-facing UI
- `shared/` - Reusable across admin and public

### Hooks

```
src/hooks/
├── api/              # API/data hooks (NEW: domain-based)
│   ├── admin/
│   │   ├── parts.ts        # All parts-related hooks
│   │   ├── vehicles.ts     # All vehicle-related hooks
│   │   └── stats.ts        # Stats and filters
│   └── public/
│       ├── parts.ts        # Public parts hooks
│       └── vehicles.ts     # Public vehicle hooks
│
├── common/           # Common utilities
│   ├── queryKeys.ts  # TanStack Query keys
│   ├── use-toast.ts  # Toast notifications
│   └── ...
│
├── admin/            # Legacy (backwards compatibility)
└── public/           # Legacy (backwards compatibility)
```

**Migration path**:
- **New code**: Use `@/hooks/api/admin/parts`
- **Old code**: Legacy imports still work

### Services

```
src/services/
├── bulk-operations/
│   └── BulkOperationsService.ts
├── export/
│   └── ExcelExportService.ts
└── excel/            # Excel import pipeline
    ├── import/
    ├── validation/
    ├── diff/
    └── shared/
```

**Pattern**: One service per domain or complex feature

### Lib (Utilities)

```
src/lib/
├── supabase/         # Database client & types
├── i18n/             # Internationalization
├── schemas/          # Zod validation schemas
├── excel/            # Low-level Excel parsers
└── utils.ts          # General utilities
```

**Rule**: No business logic, only reusable utilities

### Scripts

```
scripts/
├── db/               # Database operations
│   ├── bootstrap-import.ts
│   ├── check-production.ts
│   └── generate-types.js
├── test/             # Testing utilities
│   ├── test-bulk-operations.ts
│   └── test-excel-export.ts
└── dev/              # Development tools
    ├── debug-parser.ts
    └── analyze-export.ts
```

---

## Naming Conventions

### Components

**Pattern**: PascalCase with descriptive names

```
PartsList.tsx           # List component
PartFormContainer.tsx   # Container component
SearchFilters.tsx       # Filter component
```

**Suffixes**:
- `List` - Lists data (PartsList, VehiclesList)
- `Form` - Form component (PartForm)
- `Container` - Container/wrapper (PartFormContainer)
- `Modal` - Modal dialogs (AddPartModal)
- `Details` - Detail view (PartDetails)

### Hooks

**Pattern**: `use` prefix + domain + action

```
useGetParts()            # Fetch parts list
useGetPartById()         # Fetch single part
useCreatePart()          # Create part
useUpdatePartById()      # Update part
```

**Domain files**:
```
parts.ts          # All parts hooks
vehicles.ts       # All vehicle hooks
stats.ts          # Statistics hooks
```

### Services

**Pattern**: PascalCase + `Service` suffix

```
BulkOperationsService
ExcelExportService
ValidationEngine
```

### Scripts

**Pattern**: kebab-case with descriptive names

```
bootstrap-import.ts
check-production.ts
test-bulk-operations.ts
```

---

## When to Create New Folders

### Components

**Create a new feature folder when**:
- Feature has 3+ related components
- Feature has unique business logic
- Feature is conceptually distinct

**Example**: Creating a new admin feature
```
src/components/features/admin/inventory/
├── InventoryList.tsx
├── InventoryForm.tsx
└── InventoryFilters.tsx
```

### Hooks

**Create a new domain file when**:
- Adding hooks for a new resource type
- Grouping 2+ related hooks

**Example**: Adding orders feature
```
src/hooks/api/admin/orders.ts
export function useGetOrders() { ... }
export function useCreateOrder() { ... }
export function useUpdateOrder() { ... }
```

### Services

**Create a new service when**:
- Complex multi-step business logic
- Need to bypass API limitations (pagination, etc.)
- Reusable across multiple endpoints

**Example**: Adding a reporting service
```
src/services/reports/
└── ReportGenerationService.ts
```

---

## Best Practices

### ✅ Do

1. **Group related code together** - Keep feature files close
2. **Use domain-based organization** - Group by what it does
3. **Create index.ts for clean imports** - Export from folders
4. **Follow the established patterns** - Match existing structure
5. **Use absolute imports** - `@/components/...` not `../../`

### ❌ Don't

1. **Don't organize by file type** - Components/hooks mixed by domain
2. **Don't create deep nesting** - Max 3-4 levels deep
3. **Don't duplicate code** - Extract to `shared/` or `lib/`
4. **Don't mix concerns** - Business logic in services, not components
5. **Don't use relative imports** - Use `@/` path alias

---

## Examples

### Adding a New Admin Feature

**Scenario**: Adding vehicle inventory tracking

**Steps**:
1. Create component folder: `src/components/features/admin/inventory/`
2. Create hooks: `src/hooks/api/admin/inventory.ts`
3. Create service (if needed): `src/services/inventory/InventoryService.ts`
4. Create API routes: `src/app/api/admin/inventory/route.ts`

### Adding a New Public Feature

**Scenario**: Adding a parts comparison tool

**Steps**:
1. Create component folder: `src/components/features/public/compare/`
2. Create hooks: `src/hooks/api/public/compare.ts`
3. Create API route: `src/app/api/public/compare/route.ts`

---

## Migration Notes

### Legacy Hooks

Old hook imports still work for backwards compatibility:

```typescript
// Old way (still works)
import { useGetParts } from '@/hooks/admin'

// New way (preferred)
import { useGetParts } from '@/hooks/api/admin/parts'
```

**Recommendation**: Update imports gradually as you touch files

---

## Related Documentation

- [OVERVIEW.md](OVERVIEW.md) - System architecture overview
- [COMPONENT_ARCHITECTURE.md](COMPONENT_ARCHITECTURE.md) - Component patterns
- [SERVICE_LAYER.md](SERVICE_LAYER.md) - Service layer patterns
- [API_DESIGN.md](API_DESIGN.md) - API design conventions
