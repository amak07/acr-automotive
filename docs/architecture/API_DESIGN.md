---
title: "API Design Patterns"
---

# API Design Patterns

> **Purpose**: RESTful API conventions, error handling, and response formats
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [API Structure](#api-structure)
- [RESTful Conventions](#restful-conventions)
- [Request Validation](#request-validation)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Query Patterns](#query-patterns)
- [File Organization](#file-organization)
- [Examples](#examples)

---

## API Structure

### Public vs Admin APIs

```
/api/
├── public/                  # Unauthenticated endpoints
│   ├── parts/              # Search parts
│   ├── vehicle-options/    # Get make/model/year options
│   └── settings/           # Get site settings
│
└── admin/                   # Authenticated endpoints
    ├── auth/               # Login
    ├── parts/              # CRUD parts
    ├── vehicles/           # CRUD vehicle applications
    ├── cross-references/   # CRUD cross-references
    ├── bulk/               # Bulk operations
    │   ├── parts/
    │   │   ├── create/
    │   │   ├── update/
    │   │   └── delete/
    │   ├── vehicles/
    │   └── cross-references/
    ├── export/
    │   └── excel/          # Excel export
    └── settings/           # Site settings management
```

**Separation Rationale**:

- **Public**: No auth required, read-only, aggressive caching
- **Admin**: Auth required, full CRUD, cache invalidation

---

## RESTful Conventions

### HTTP Methods

| Method     | Purpose                 | Idempotent | Safe |
| ---------- | ----------------------- | ---------- | ---- |
| **GET**    | Retrieve resource(s)    | Yes        | Yes  |
| **POST**   | Create new resource     | No         | No   |
| **PUT**    | Update entire resource  | Yes        | No   |
| **PATCH**  | Update partial resource | No         | No   |
| **DELETE** | Delete resource         | Yes        | No   |

**Pattern Used**: GET + POST + PATCH + DELETE

**Why PATCH over PUT**:

- Partial updates (only send changed fields)
- Smaller payloads
- Clearer intent

---

### URL Structure

**Pattern**: `/api/{scope}/{resource}/{sub-resource?}/{action?}`

**Examples**:

```
GET  /api/admin/parts                    # List parts
GET  /api/admin/parts?id={uuid}          # Get single part (with relations)
POST /api/admin/parts                    # Create part
PATCH /api/admin/parts                   # Update part
DELETE /api/admin/parts?id={uuid}        # Delete part

GET  /api/admin/vehicles?part_id={uuid}  # List vehicles for part
POST /api/admin/vehicles                 # Create vehicle application

POST /api/admin/bulk/parts/create        # Bulk create parts
POST /api/admin/export/excel             # Export to Excel
```

**Conventions**:

- Plural nouns for resources (`parts`, not `part`)
- Query parameters for single resource lookup (`?id=...`)
- Nested paths for sub-resources (`/bulk/parts/create`)
- Actions as final path segment (`/create`, `/export`)

---

### Resource Naming

| Resource             | Endpoint                              | Notes                                    |
| -------------------- | ------------------------------------- | ---------------------------------------- |
| Parts                | `/api/admin/parts`                    | Main catalog entity                      |
| Vehicle Applications | `/api/admin/vehicles`                 | Short name (not `/vehicle-applications`) |
| Cross References     | `/api/admin/cross-references`         | Hyphenated for readability               |
| Bulk Operations      | `/api/admin/bulk/{resource}/{action}` | Explicit action suffix                   |

**Why Short Names**:

- Easier to type
- Consistent with database table names
- Common in REST APIs (`users`, `posts`, `comments`)

---

## Request Validation

### Pattern: Zod at API Entry

**Every API route follows this pattern**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { queryPartsSchema } from "@/lib/schemas/admin";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    // 1. Extract raw params
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // 2. Validate with Zod (fail fast)
    const params = queryPartsSchema.parse(rawParams);

    // 3. Only validated data reaches business logic
    const result = await fetchParts(params);

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 4. Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // 5. Handle other errors
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: error.message }],
      },
      { status: 500 }
    );
  }
}
```

**File**: [src/app/api/admin/parts/route.ts](../../src/app/api/admin/parts/route.ts)

**Benefits**:

- **Security**: Invalid data rejected before reaching database
- **Type safety**: `params` has inferred TypeScript type
- **Clear errors**: Zod provides field-level error messages
- **Self-documenting**: Schema IS the API contract

**See**: [VALIDATION.md](VALIDATION.md) for Zod patterns

---

### Schema Centralization

**All schemas live in**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts)

**Pattern**:

```typescript
// Schema definition
export const createPartSchema = z.object({
  sku_number: z.string().min(1),
  part_type: z.string().min(1).max(100),
  position_type: z.string().max(50).optional(),
  // ...
});

// Type inference
export type CreatePartParams = z.infer<typeof createPartSchema>;

// Re-export from route schemas file
// src/app/api/admin/parts/schemas.ts
export { createPartSchema, type CreatePartParams } from "@/lib/schemas/admin";
```

**Why Centralized**:

- Single source of truth
- Reuse across routes
- Easier to maintain
- Consistent validation rules

---

## Response Format

### Success Response

**Pattern**: `{ success: true, data: T, ...metadata }`

**Example**:

```typescript
// Single resource
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "acr_sku": "ACR-001",
    "part_type": "Brake Rotor"
  },
  "timestamp": "2025-10-25T14:30:00.000Z"
}

// List with pagination
{
  "success": true,
  "data": [
    { "id": "...", "acr_sku": "ACR-001" },
    { "id": "...", "acr_sku": "ACR-002" }
  ],
  "count": 150,           // Total count for pagination
  "timestamp": "2025-10-25T14:30:00.000Z"
}

// Bulk operation
{
  "success": true,
  "created": 100,         // Number of resources created
  "data": [ ... ],        // Created resources
  "timestamp": "2025-10-25T14:30:00.000Z"
}
```

**Fields**:

- `success`: Always `true` for successful responses
- `data`: Resource or array of resources
- `count`: Total count (for paginated lists)
- `created`/`updated`/`deleted`: Count (for bulk operations)
- `timestamp`: ISO 8601 timestamp

---

### Error Response

**Pattern**: `{ success: false, errors: [...] }`

**Example**:

```typescript
// Validation error (400)
{
  "success": false,
  "errors": [
    {
      "field": "sku_number",
      "message": "String must contain at least 1 character(s)"
    },
    {
      "field": "part_type",
      "message": "Required"
    }
  ]
}

// Server error (500)
{
  "success": false,
  "errors": [
    {
      "message": "Database connection failed"
    }
  ]
}

// Not found (handled by checking data)
// Supabase returns error.code === "PGRST116" for not found
```

**Fields**:

- `success`: Always `false` for errors
- `errors`: Array of error objects
  - `field`: Optional, for validation errors
  - `message`: Human-readable error message

---

### HTTP Status Codes

| Code    | Meaning      | When to Use                          |
| ------- | ------------ | ------------------------------------ |
| **200** | OK           | Successful GET, PATCH, DELETE        |
| **201** | Created      | Successful POST                      |
| **400** | Bad Request  | Validation error, malformed request  |
| **401** | Unauthorized | Missing or invalid auth token        |
| **404** | Not Found    | Resource doesn't exist               |
| **500** | Server Error | Database error, unexpected exception |

**Pattern**:

```typescript
// Success
return NextResponse.json(successData, { status: 200 }); // or 201

// Validation error
return NextResponse.json(errorData, { status: 400 });

// Server error
return NextResponse.json(errorData, { status: 500 });
```

---

## Error Handling

### Layered Error Handling

**Layer 1: Zod Validation**

```typescript
try {
  const validated = schema.parse(rawInput);
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }
}
```

**Layer 2: Supabase Errors**

```typescript
const { data, error } = await supabase.from("parts").select("*");

if (error) {
  // Special case: Not found
  if (error.code === "PGRST116") {
    return NextResponse.json(
      { success: true, data: [] }, // Empty list, not error
      { status: 200 }
    );
  }

  // Other database errors
  return NextResponse.json(
    {
      success: false,
      errors: [{ message: error.message }],
    },
    { status: 500 }
  );
}
```

**Layer 3: Unexpected Errors**

```typescript
catch (error) {
  console.error("Unexpected error:", error);
  return NextResponse.json(
    {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    },
    { status: 500 }
  );
}
```

**File Example**: [src/app/api/admin/bulk/parts/create/route.ts](../../src/app/api/admin/bulk/parts/create/route.ts)

---

### Error Messages

**Principle**: Clear, actionable error messages

**Good**:

- "String must contain at least 1 character(s)" (Zod default)
- "PartID is required" (Custom Zod message)
- "Failed to create part: Duplicate SKU 'ACR-001'"

**Bad**:

- "Invalid input" (too vague)
- "Error 500" (not actionable)
- "Something went wrong" (useless)

**Custom Zod Messages**:

```typescript
z.uuid("PartID is required"); // Better than default "Invalid uuid"
z.string().min(1, "SKU cannot be empty");
```

---

## Query Patterns

### Single Resource by ID

**Pattern**: Query parameter `?id={uuid}`

```typescript
GET /api/admin/parts?id=123e4567-e89b-12d3-a456-426614174000

// API implementation
if (params.id) {
  // Fetch single part with all relations
  const { data: part, error } = await supabase
    .from("parts")
    .select(`
      *,
      vehicle_applications(*),
      cross_references(*)
    `)
    .eq("id", params.id)
    .single();

  return NextResponse.json({
    success: true,
    data: part,
  });
}
```

**Why Query Param (not `/parts/{id}`)**:

- Reuse same route handler
- Easier to add optional relations
- Consistent with list queries

---

### List with Pagination

**Pattern**: `offset` + `limit`

```typescript
GET /api/admin/parts?offset=0&limit=50&sort_by=acr_sku&sort_order=asc

// API implementation
let query = supabase
  .from("parts")
  .select("*, vehicle_applications(id), cross_references(id)", { count: "exact" })
  .range(params.offset, params.offset + params.limit - 1)
  .order(params.sort_by, { ascending: params.sort_order === "asc" });

// Response includes total count
{
  "success": true,
  "data": [ ... ],  // 50 parts
  "count": 9593     // Total parts in database
}
```

**Defaults** (from Zod schema):

- `offset`: 0
- `limit`: 50
- `sort_by`: "acr_sku"
- `sort_order`: "asc"

---

### List with Filters

**Pattern**: Optional query parameters

```typescript
GET /api/admin/parts?part_type=Brake%20Rotor&position_type=Front&search=acr

// API implementation
if (params.part_type) {
  query = query.eq("part_type", params.part_type);
}

if (params.position_type) {
  query = query.eq("position_type", params.position_type);
}

if (params.search) {
  // Fuzzy search on multiple fields
  query = query.or(`
    acr_sku.ilike.%${params.search}%,
    part_type.ilike.%${params.search}%,
    specifications.ilike.%${params.search}%
  `);
}
```

**Available Filters** (from schema):

```typescript
export const queryPartsSchema = z.object({
  // Pagination
  offset: z.coerce.number().default(0),
  limit: z.coerce.number().default(50),

  // Sorting
  sort_by: z.string().optional().default("acr_sku"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),

  // Filters
  search: z.string().optional(),
  part_type: z.string().optional(),
  position_type: z.string().optional(),
  abs_type: z.string().optional(),
  drive_type: z.string().optional(),
  bolt_pattern: z.string().optional(),
});
```

---

### Related Resources

**Pattern**: `?{parent}_id={uuid}`

```typescript
GET /api/admin/vehicles?part_id=123e4567-...

// API implementation
if (params.part_id) {
  query = query.eq("part_id", params.part_id);
}

// Returns all vehicle applications for that part
{
  "success": true,
  "data": [
    {
      "id": "...",
      "part_id": "123e4567-...",
      "make": "Toyota",
      "model": "Camry",
      "start_year": 2018,
      "end_year": 2023
    },
    // ...
  ],
  "count": 15
}
```

**Pattern Used For**:

- Vehicle applications by part: `?part_id=...`
- Cross references by part: `?acr_part_id=...`

---

## File Organization

### Route Structure

```
src/app/api/
├── admin/
│   ├── parts/
│   │   ├── route.ts          # GET, POST, PATCH, DELETE
│   │   └── schemas.ts        # Re-export from lib/schemas/admin.ts
│   ├── vehicles/
│   │   ├── route.ts
│   │   └── schemas.ts
│   ├── cross-references/
│   │   ├── route.ts
│   │   └── schemas.ts
│   └── bulk/
│       ├── parts/
│       │   ├── create/
│       │   │   └── route.ts  # POST only
│       │   ├── update/
│       │   │   └── route.ts  # POST only
│       │   └── delete/
│       │       └── route.ts  # POST only
│       └── ...
└── public/
    └── parts/
        └── route.ts           # GET only
```

**Convention**:

- One `route.ts` per endpoint
- Optional `schemas.ts` for route-specific schemas (usually re-exports)
- Bulk operations use POST (not PATCH/DELETE) for clarity
- Actions as nested folders (`/create`, `/update`, `/delete`)

---

### Schema Organization

**Centralized**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts)

```typescript
// ===== PARTS SCHEMAS =====
export const queryPartsSchema = z.object({ ... });
export const createPartSchema = z.object({ ... });
export const updatePartSchema = createPartSchema.omit({ sku_number: true }).partial();
export const deletePartSchema = z.object({ id: z.uuid() });

export type QueryPartsParams = z.infer<typeof queryPartsSchema>;
export type CreatePartParams = z.infer<typeof createPartSchema>;
// ...

// ===== CROSS REFERENCES SCHEMAS =====
export const queryCrossRefSchema = z.object({ ... });
// ...

// ===== VEHICLE APPLICATIONS SCHEMAS =====
export const queryVehicleSchema = z.object({ ... });
// ...

// ===== BULK OPERATIONS SCHEMAS =====
export const bulkCreatePartsSchema = z.object({
  parts: z.array(createPartSchema)
});
// ...
```

**Pattern**:

1. Define Zod schema
2. Infer TypeScript type
3. Export both
4. Group by resource

---

## Examples

### Example 1: Simple CRUD Endpoint

**File**: [src/app/api/admin/parts/route.ts](../../src/app/api/admin/parts/route.ts) (simplified)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { querySchema, createPartSchema } from "./schemas";
import { ZodError } from "zod";

// GET /api/admin/parts?id={uuid} (single) or ?offset=0&limit=50 (list)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const params = querySchema.parse(rawParams);

    if (params.id) {
      // Single part with relations
      const { data, error } = await supabase
        .from("parts")
        .select("*, vehicle_applications(*), cross_references(*)")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // List with pagination
    const { data, count, error } = await supabase
      .from("parts")
      .select("*", { count: "exact" })
      .range(params.offset, params.offset + params.limit - 1)
      .order(params.sort_by, { ascending: params.sort_order === "asc" });

    if (error) throw error;
    return NextResponse.json({ success: true, data, count });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, errors: [{ message: error.message }] },
      { status: 500 }
    );
  }
}

// POST /api/admin/parts (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createPartSchema.parse(body);

    const { data, error } = await supabase
      .from("parts")
      .insert({
        acr_sku: validated.sku_number,
        part_type: validated.part_type,
        // ... field mapping
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    // ... error handling
  }
}
```

---

### Example 2: Bulk Operation

**File**: [src/app/api/admin/bulk/parts/create/route.ts](../../src/app/api/admin/bulk/parts/create/route.ts)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BulkOperationsService } from "@/lib/services/BulkOperationsService";
import { bulkCreatePartsSchema } from "@/lib/schemas/admin";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate array of parts
    const validated = bulkCreatePartsSchema.parse(body);

    // Delegate to service layer
    const service = new BulkOperationsService();
    const result = await service.createParts(validated.parts);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        errors: [
          {
            message: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 }
    );
  }
}
```

**Request**:

```json
POST /api/admin/bulk/parts/create
{
  "parts": [
    {
      "sku_number": "ACR-001",
      "part_type": "Brake Rotor",
      "position_type": "Front"
    },
    {
      "sku_number": "ACR-002",
      "part_type": "Brake Pad",
      "position_type": "Rear"
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "created": 2,
  "data": [
    {
      "id": "123e4567-...",
      "acr_sku": "ACR-001",
      "part_type": "Brake Rotor",
      "position_type": "Front"
    },
    {
      "id": "789abcde-...",
      "acr_sku": "ACR-002",
      "part_type": "Brake Pad",
      "position_type": "Rear"
    }
  ]
}
```

---

### Example 3: Public Search API

**File**: [src/app/api/public/parts/route.ts](../../src/app/api/public/parts/route.ts)

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const params = publicPartsQuerySchema.parse(rawParams);

    // Multi-stage fuzzy search
    const { data: parts, error } = await supabase.rpc("search_parts_fuzzy", {
      search_query: params.search || "",
      part_type_filter: params.part_type,
      // ...
    });

    if (error) throw error;

    // Enrich with primary images (no N+1)
    const enrichedParts = await enrichWithPrimaryImages(parts);

    return NextResponse.json({
      success: true,
      data: enrichedParts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // ... error handling
  }
}

// Helper to avoid N+1 queries
async function enrichWithPrimaryImages(parts: DatabasePartRow[]) {
  const partIds = parts.map((p) => p.id);

  // Single query for all images
  const { data: images } = await supabase
    .from("part_images")
    .select("part_id, image_url, display_order")
    .in("part_id", partIds)
    .order("display_order", { ascending: true });

  const imagesByPartId = groupBy(images, "part_id");

  return parts.map((part) => ({
    ...part,
    primary_image_url: imagesByPartId[part.id]?.[0]?.image_url || null,
  }));
}
```

---

## Related Documentation

- [VALIDATION.md](VALIDATION.md) - Zod schema patterns
- [SERVICE_LAYER.md](SERVICE_LAYER.md) - When to use service layer
- [DATA_FLOW.md](DATA_FLOW.md) - Request lifecycle
- [docs/database/DATABASE.md](../database/DATABASE.md) - Database schema

---

**Next**: Read [SERVICE_LAYER.md](SERVICE_LAYER.md) to understand when and how to use the service layer pattern.
