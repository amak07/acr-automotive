# Validation Patterns

> **Purpose**: Zod schema patterns, type inference, and validation strategy
>
> **Last Updated**: 2025-10-25
> **Status**: Production

## Table of Contents

- [Why Zod](#why-zod)
- [Schema Organization](#schema-organization)
- [Common Patterns](#common-patterns)
- [Type Inference](#type-inference)
- [Validation Strategy](#validation-strategy)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Why Zod

**Problem**: TypeScript only validates at compile-time, not runtime.

```typescript
// TypeScript says this is fine at compile-time
type User = { name: string, age: number };

// But at runtime, this could be ANYTHING from API/user input:
const user: User = await request.json(); // Could be { name: 123, age: "old" }
```

**Solution**: Zod provides runtime validation + compile-time types.

```typescript
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Runtime validation (throws if invalid)
const user = userSchema.parse(await request.json());

// TypeScript knows the type automatically
type User = z.infer<typeof userSchema>; // { name: string, age: number }
```

---

### Zod vs Alternatives

| Feature | Zod | Yup | Joi | io-ts |
|---------|-----|-----|-----|-------|
| TypeScript inference | ✅ Excellent | ⚠️ Limited | ❌ None | ✅ Good |
| Bundle size | ✅ Small (12kb) | ⚠️ Medium (28kb) | ❌ Large (145kb) | ✅ Small |
| Schema composition | ✅ Excellent | ✅ Good | ✅ Good | ⚠️ Complex |
| Error messages | ✅ Clear | ✅ Good | ✅ Good | ⚠️ Verbose |
| React Hook Form | ✅ Native | ✅ Resolver | ⚠️ Requires adapter | ❌ No |

**Why Zod for ACR Automotive**:
- Perfect TypeScript integration (single source of truth)
- Small bundle size (matters for client-side validation)
- Excellent React Hook Form support
- Clear, actionable error messages

---

## Schema Organization

### Centralized Schemas

**File**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts)

**Structure**:
```typescript
// ===== PARTS SCHEMAS =====
export const queryPartsSchema = z.object({ ... });
export const createPartSchema = z.object({ ... });
export const updatePartSchema = createPartSchema.omit({ sku_number: true }).partial();
export const deletePartSchema = z.object({ id: z.uuid() });

export type QueryPartsParams = z.infer<typeof queryPartsSchema>;
export type CreatePartParams = z.infer<typeof createPartSchema>;
export type UpdatePartParams = z.infer<typeof updatePartSchema>;
export type DeletePartParams = z.infer<typeof deletePartSchema>;

// ===== CROSS REFERENCES SCHEMAS =====
export const queryCrossRefSchema = z.object({ ... });
export const createCrossRefSchema = z.object({ ... });
// ...

// ===== VEHICLE APPLICATIONS SCHEMAS =====
export const queryVehicleSchema = z.object({ ... });
export const createVehicleSchema = z.object({ ... });
// ...

// ===== BULK OPERATIONS SCHEMAS =====
export const bulkCreatePartsSchema = z.object({
  parts: z.array(createPartSchema),
});
// ...

// ===== SITE SETTINGS SCHEMAS =====
export const contactInfoSchema = z.object({ ... });
export const brandingSchema = z.object({ ... });
// ...
```

**Benefits**:
- Single source of truth
- Reusable across routes
- Easier to maintain
- Consistent validation rules

---

### Schema Re-exports

**Pattern**: Route-specific `schemas.ts` files re-export from central schemas.

**Example**: [src/app/api/admin/parts/schemas.ts](../../src/app/api/admin/parts/schemas.ts)
```typescript
// Re-export from centralized schemas
export {
  queryPartsSchema as querySchema,
  createPartSchema,
  updatePartSchema,
  deletePartSchema,
  type QueryPartsParams,
  type CreatePartParams,
  type UpdatePartParams,
  type DeletePartParams,
} from '@/lib/schemas/admin';
```

**Why Re-export**:
- Shorter imports in route handlers
- Can rename for route context (`queryPartsSchema` → `querySchema`)
- Still maintain single source of truth

---

## Common Patterns

### Query Parameters Schema

**Pattern**: Use `z.coerce` to convert strings to numbers, provide defaults.

```typescript
export const queryPartsSchema = z.object({
  // Single resource lookup
  id: z.uuid().optional(),

  // Pagination
  limit: z.coerce.number().default(50),    // String "50" → Number 50
  offset: z.coerce.number().default(0),

  // Sorting
  sort_by: z.string().optional().default("acr_sku"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),

  // Search
  search: z.string().optional(),

  // Filters (all optional)
  part_type: z.string().optional(),
  position_type: z.string().optional(),
  abs_type: z.string().optional(),
  drive_type: z.string().optional(),
  bolt_pattern: z.string().optional(),
});
```

**Why `z.coerce.number()`**:
- URL query params are always strings: `?offset=50&limit=20`
- `z.number()` would fail validation
- `z.coerce.number()` converts strings to numbers

**Usage**:
```typescript
const { searchParams } = new URL(request.url);
const rawParams = Object.fromEntries(searchParams.entries());
// rawParams = { offset: "50", limit: "20" } (all strings)

const params = queryPartsSchema.parse(rawParams);
// params = { offset: 50, limit: 20 } (numbers now)
```

---

### Create Schema

**Pattern**: Required fields, optional enhancements, length constraints.

```typescript
export const createPartSchema = z.object({
  // Required fields
  sku_number: z.string().min(1),              // At least 1 char
  part_type: z.string().min(1).max(100),      // 1-100 chars

  // Optional fields
  position_type: z.string().max(50).optional(),
  abs_type: z.string().max(20).optional(),
  bolt_pattern: z.string().max(50).optional(),
  drive_type: z.string().max(50).optional(),
  specifications: z.string().optional(),       // No max length

  // Validated optional fields
  image_url: z.string().url().optional(),      // Must be URL if provided
});
```

**Field Types**:
- `z.string()` - Any string
- `.min(1)` - Not empty
- `.max(100)` - Max length
- `.optional()` - Can be omitted or null
- `.url()` - Must be valid URL

---

### Update Schema

**Pattern**: Derive from create schema, make fields optional, add ID.

```typescript
export const updatePartSchema = createPartSchema
  .omit({ sku_number: true })  // Can't change SKU
  .partial()                    // All fields optional
  .extend({
    id: z.uuid("PartID is required."),  // ID is required
  });
```

**Composition Methods**:
- `.omit({ field: true })` - Remove field
- `.partial()` - Make all fields optional
- `.extend({ ... })` - Add new fields
- `.pick({ field: true })` - Keep only certain fields

**Result**:
```typescript
// createPartSchema
{
  sku_number: string,      // Required
  part_type: string,       // Required
  position_type?: string,  // Optional
  // ...
}

// updatePartSchema
{
  id: string,              // Required (uuid)
  part_type?: string,      // Optional
  position_type?: string,  // Optional
  // ... (no sku_number)
}
```

---

### Delete Schema

**Pattern**: Just the ID.

```typescript
export const deletePartSchema = z.object({
  id: z.uuid("PartID is required."),
});
```

**Custom Error Message**:
- Default: "Invalid uuid"
- Custom: "PartID is required." (more actionable)

---

### Bulk Operation Schema

**Pattern**: Wrap create/update schema in an array.

```typescript
export const bulkCreatePartsSchema = z.object({
  parts: z.array(createPartSchema),
});

// Request body
{
  "parts": [
    { "sku_number": "ACR-001", "part_type": "Brake Rotor" },
    { "sku_number": "ACR-002", "part_type": "Brake Pad" }
  ]
}
```

**Benefits**:
- Validates each array item
- Reuses single-resource schema
- Clear error messages with array indexes

---

### Enum Schemas

**Pattern**: Use `z.enum()` for fixed choices.

```typescript
export const queryPartsSchema = z.object({
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

// TypeScript knows: sort_order is "asc" | "desc"
```

**Error Message**:
```json
{
  "field": "sort_order",
  "message": "Invalid enum value. Expected 'asc' | 'desc', received 'ascending'"
}
```

---

### Nested Object Schemas

**Pattern**: Define schemas for nested objects.

```typescript
export const contactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
  whatsapp: z.string(),
  address: z.string(),
});

export const bannerSchema = z.object({
  id: z.string(),
  image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ),
  mobile_image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const brandingSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  logo_url: z.string(),
  favicon_url: z.string(),
  banners: z.array(bannerSchema),  // Array of nested objects
});
```

**Custom Refinements**:
```typescript
.refine(
  (val) => val === "" || z.string().url().safeParse(val).success,
  { message: "Must be a valid URL or empty" }
)
```

**Explanation**:
- Allow empty string OR valid URL
- `.safeParse()` returns `{ success: boolean, ... }` (doesn't throw)
- Custom error message

---

### Discriminated Unions

**Pattern**: Use when schema varies based on a key.

```typescript
export const updateSettingSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("contact_info"), value: contactInfoSchema }),
  z.object({ key: z.literal("branding"), value: brandingSchema }),
]);

// Request body options:
// Option 1:
{
  "key": "contact_info",
  "value": { "email": "...", "phone": "...", ... }
}

// Option 2:
{
  "key": "branding",
  "value": { "company_name": "...", "logo_url": "...", ... }
}
```

**Benefits**:
- Type safety based on discriminant (`key`)
- Validates `value` based on `key`
- Clear error messages

---

## Type Inference

### Pattern: Define Schema → Infer Type

```typescript
// 1. Define Zod schema (runtime validation)
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

// 2. Infer TypeScript type (compile-time)
type User = z.infer<typeof userSchema>;
// Result: { name: string; age: number; email: string }

// 3. Use in functions
function createUser(user: User) {
  // TypeScript knows: user.name is string, user.age is number
}
```

**Single Source of Truth**:
- Change schema → type updates automatically
- No manual type definitions
- Schema IS the contract

---

### Exported Types

**Pattern**: Export both schema and type.

```typescript
export const createPartSchema = z.object({ ... });
export type CreatePartParams = z.infer<typeof createPartSchema>;
```

**Usage**:
```typescript
import { createPartSchema, CreatePartParams } from "@/lib/schemas/admin";

// Runtime validation
const validated = createPartSchema.parse(body);

// Type annotation
function createPart(params: CreatePartParams) { ... }
```

---

### Optional Fields

```typescript
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
});

type Inferred = z.infer<typeof schema>;
// Result: { required: string; optional?: string | undefined }
```

---

### Default Values

```typescript
const schema = z.object({
  limit: z.number().default(50),
});

type Inferred = z.infer<typeof schema>;
// Result: { limit: number } (not optional, has default)

const result = schema.parse({}); // { limit: 50 }
```

---

## Validation Strategy

### Validate at API Boundaries

**Principle**: Validate ALL external data before it enters your system.

```
External Data → Zod Validation → Internal System
(untrusted)       (boundary)       (trusted)
```

**Examples of External Data**:
- HTTP request bodies
- Query parameters
- File uploads
- Third-party API responses

**NOT Validated**:
- Internal function calls (TypeScript handles this)
- Database responses (Supabase types are trusted)

---

### API Route Pattern

**Every API route follows this pattern**:

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw input
    const body = await request.json();

    // 2. Validate (fail fast)
    const validated = schema.parse(body);

    // 3. Business logic (only with validated data)
    const result = await createResource(validated);

    // 4. Success response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 5. Error handling
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, errors: transformZodErrors(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, errors: [{ message: error.message }] },
      { status: 500 }
    );
  }
}
```

**Key Points**:
- Validation happens BEFORE business logic
- Invalid data never reaches database
- ZodError is caught and transformed to API error format

---

### Client-Side Validation

**Pattern**: React Hook Form + Zod resolver.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPartSchema } from "@/lib/schemas/admin";

function PartForm() {
  const form = useForm({
    resolver: zodResolver(createPartSchema),  // Use same schema!
    defaultValues: {
      sku_number: "",
      part_type: "",
      // ...
    },
  });

  async function onSubmit(data) {
    // data is already validated by Zod
    const response = await fetch("/api/admin/parts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("sku_number")} />
      {form.formState.errors.sku_number && (
        <span>{form.formState.errors.sku_number.message}</span>
      )}
    </form>
  );
}
```

**Benefits**:
- Same validation rules on client and server
- Immediate feedback (no server round-trip)
- Type-safe form handling

---

## Error Handling

### ZodError Structure

```typescript
try {
  schema.parse(invalidData);
} catch (error) {
  if (error instanceof ZodError) {
    console.log(error.issues);
    // [
    //   {
    //     code: "too_small",
    //     minimum: 1,
    //     type: "string",
    //     inclusive: true,
    //     message: "String must contain at least 1 character(s)",
    //     path: ["sku_number"]
    //   },
    //   {
    //     code: "invalid_type",
    //     expected: "string",
    //     received: "undefined",
    //     message: "Required",
    //     path: ["part_type"]
    //   }
    // ]
  }
}
```

**Important Fields**:
- `message`: Human-readable error
- `path`: Field name (array for nested fields)
- `code`: Error type (for programmatic handling)

---

### Transform Zod Errors for API

**Pattern**: Convert Zod format → API error format.

```typescript
if (error instanceof ZodError) {
  return NextResponse.json(
    {
      success: false,
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),  // ["user", "email"] → "user.email"
        message: issue.message,        // "Invalid email"
      })),
    },
    { status: 400 }
  );
}
```

**Result**:
```json
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
```

---

### Custom Error Messages

**Pattern**: Pass string to Zod methods.

```typescript
z.uuid("PartID is required")  // Instead of "Invalid uuid"
z.string().min(1, "SKU cannot be empty")  // Instead of default
z.number().int("Must be an integer")
```

**When to Use Custom Messages**:
- Default is too technical ("Invalid uuid" → "PartID is required")
- Need Spanish translation
- Want more context ("Required" → "Part type is required")

---

### Safe Parse (No Throw)

**Pattern**: Use `.safeParse()` when you don't want exceptions.

```typescript
const result = schema.safeParse(data);

if (result.success) {
  console.log(result.data);  // Validated data
} else {
  console.log(result.error.issues);  // Validation errors
}
```

**When to Use**:
- Custom error handling
- Conditional validation
- Refinements (see custom refinements above)

---

## Examples

### Example 1: Query Parameters with Defaults

**File**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts:4-18)

```typescript
export const queryPartsSchema = z.object({
  id: z.uuid().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
  search: z.string().optional(),
  sort_by: z.string().optional().default("acr_sku"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),

  // Filter parameters
  part_type: z.string().optional(),
  position_type: z.string().optional(),
  abs_type: z.string().optional(),
  drive_type: z.string().optional(),
  bolt_pattern: z.string().optional(),
});
```

**Usage**:
```typescript
// URL: /api/admin/parts?search=brake&limit=20
const { searchParams } = new URL(request.url);
const rawParams = Object.fromEntries(searchParams.entries());
// rawParams = { search: "brake", limit: "20" }

const params = queryPartsSchema.parse(rawParams);
// params = {
//   search: "brake",
//   limit: 20,          // Coerced from string
//   offset: 0,          // Default applied
//   sort_by: "acr_sku", // Default applied
//   sort_order: "asc",  // Default applied
// }
```

---

### Example 2: Schema Composition

**File**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts:20-38)

```typescript
export const createPartSchema = z.object({
  sku_number: z.string().min(1),
  part_type: z.string().min(1).max(100),
  position_type: z.string().max(50).optional(),
  abs_type: z.string().max(20).optional(),
  bolt_pattern: z.string().max(50).optional(),
  drive_type: z.string().max(50).optional(),
  specifications: z.string().optional(),
  image_url: z.string().url().optional(),
});

export const updatePartSchema = createPartSchema
  .omit({ sku_number: true })  // Can't update SKU
  .partial()                    // All fields optional
  .extend({ id: z.uuid("PartID is required.") });

export const deletePartSchema = z.object({
  id: z.uuid("PartID is required."),
});
```

**Inferred Types**:
```typescript
type CreatePartParams = {
  sku_number: string;
  part_type: string;
  position_type?: string;
  abs_type?: string;
  bolt_pattern?: string;
  drive_type?: string;
  specifications?: string;
  image_url?: string;
};

type UpdatePartParams = {
  id: string; // uuid
  part_type?: string;
  position_type?: string;
  abs_type?: string;
  // ... (no sku_number)
};

type DeletePartParams = {
  id: string; // uuid
};
```

---

### Example 3: Nested Objects and Arrays

**File**: [src/lib/schemas/admin.ts](../../src/lib/schemas/admin.ts:136-146)

```typescript
export const bannerSchema = z.object({
  id: z.string(),
  image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ),
  mobile_image_url: z.string().refine(
    (val) => val === "" || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or empty" }
  ).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const brandingSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  logo_url: z.string(),
  favicon_url: z.string(),
  banners: z.array(bannerSchema),  // Array validation
});
```

**Usage**:
```typescript
const data = {
  company_name: "ACR Automotive",
  logo_url: "/logo.png",
  favicon_url: "/favicon.ico",
  banners: [
    {
      id: "banner-1",
      image_url: "https://example.com/banner.jpg",
      mobile_image_url: "",  // Empty string is valid
      display_order: 0,
      is_active: true,
    },
    {
      id: "banner-2",
      image_url: "invalid-url",  // This will fail validation
      display_order: 1,
      is_active: false,
    },
  ],
};

// Validation error:
{
  "success": false,
  "errors": [
    {
      "field": "banners.1.image_url",
      "message": "Must be a valid URL or empty"
    }
  ]
}
```

---

## Related Documentation

- [API_DESIGN.md](API_DESIGN.md) - How validation fits into API routes
- [DATA_FLOW.md](DATA_FLOW.md) - Validation in request lifecycle
- [Zod Documentation](https://zod.dev) - Official Zod docs

---

**Next**: Read [SERVICE_LAYER.md](SERVICE_LAYER.md) to understand when to use the service layer vs direct database queries.
