# API Reference

> **Complete API documentation** for ACR Automotive - All public and admin endpoints

## Overview

ACR Automotive provides 25 RESTful API endpoints organized into two categories:

- **Public APIs** (3 endpoints) - Search, vehicle options, settings
- **Admin APIs** (22 endpoints) - CRUD operations, bulk operations, image management, exports

All APIs follow REST conventions and return JSON responses (except Excel export which returns XLSX).

---

## Table of Contents

### Public APIs
- [Search Parts](#get-apipublicparts)
- [Get Vehicle Options](#get-apipublicvehicle-options)
- [Get Site Settings](#get-apipublicsettings)

### Admin APIs - Parts Management
- [List/Get Parts](#get-apiadminparts)
- [Create Part](#post-apiadminparts)
- [Update Part](#put-apiadminparts)
- [Delete Part](#delete-apiadminparts)

### Admin APIs - Bulk Operations
- [Bulk Create Parts](#post-apiadminbulkpartscreate)
- [Bulk Update Parts](#put-apiadminbulkpartsupdate)
- [Bulk Delete Parts](#delete-apiadminbulkpartsdelete)
- [Bulk Create Vehicles](#post-apiadminbulkvehiclescreate)
- [Bulk Update Vehicles](#put-apiadminbulkvehiclesupdate)
- [Bulk Delete Vehicles](#delete-apiadminbulkvehiclesdelete)
- [Bulk Create Cross-References](#post-apiadminbulkcross-referencescreate)
- [Bulk Update Cross-References](#put-apiadminbulkcross-referencesupdate)
- [Bulk Delete Cross-References](#delete-apiadminbulkcross-referencesdelete)

### Admin APIs - Image Management
- [List Part Images](#get-apiadminpartsidfimages)
- [Upload Images](#post-apiadminpartsidfimages)
- [Reorder Images](#put-apiadminpartsidfimagesreorder)
- [Set Primary Image](#put-apiadminpartsidfimagesimageidprimary)
- [Update Image Caption](#put-apiadminpartsidfimagesfimageid)
- [Delete Image](#delete-apiadminpartsidfimagesfimageid)
- [List 360° Frames](#get-apiadminpartsidf360-frames)
- [Upload 360° Frames](#post-apiadminpartsidf360-frames)
- [Delete 360° Viewer](#delete-apiadminpartsidf360-frames)

### Admin APIs - Other
- [Export to Excel](#get-apiadminexport)
- [Get Admin Stats](#get-apiadminstats)
- [Get Filter Options](#get-apiadminfilter-options)
- [Authentication](#post-apiadminauth)
- [Get Settings](#get-apiadminsettings)
- [Update Settings](#put-apiadminsettings)
- [Upload Asset](#post-apiadminsettingsupload-asset)
- [List Vehicles](#get-apiadminvehicles)
- [List Cross-References](#get-apiadmincross-references)

---

## Response Format

### Success Response
```typescript
{
  data: T | T[],      // Single object or array
  count?: number,     // Total count (for paginated lists)
  success?: boolean   // For mutation operations
}
```

### Error Response
```typescript
{
  error: string,           // Human-readable error message
  issues?: Array<{         // Validation errors (Zod)
    field: string,
    message: string
  }>,
  details?: any            // Additional error details
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., SKU already exists)
- `500 Internal Server Error` - Server error

---

# Public APIs

## `GET /api/public/parts`

Search parts by vehicle (Make/Model/Year) or SKU.

### Query Parameters

**Vehicle Search**:
- `make?: string` - Vehicle make (e.g., "HONDA")
- `model?: string` - Vehicle model (e.g., "CIVIC")
- `year?: string` - Vehicle year (e.g., "2018")

**SKU Search**:
- `sku_term?: string` - ACR SKU or competitor SKU (e.g., "ACR-BR-001" or "TM512342")

**Pagination**:
- `limit?: number` - Results per page (default: 15)
- `offset?: number` - Results to skip (default: 0)

### Response

```typescript
{
  data: Array<{
    id: string;
    acr_sku: string;
    part_type: string;
    position_type: string | null;
    abs_type: string | null;
    bolt_pattern: string | null;
    drive_type: string | null;
    specifications: any;
    primary_image_url: string | null;     // First image from part_images
    match_type?: "exact_acr" | "competitor_sku" | "fuzzy";
    similarity?: number;                   // 0.0-1.0 for fuzzy matches
  }>,
  count: number,
  search_type?: "sku" | "vehicle"
}
```

### Examples

**Vehicle Search**:
```bash
GET /api/public/parts?make=HONDA&model=CIVIC&year=2018&limit=15&offset=0
```

**SKU Search (Exact ACR SKU)**:
```bash
GET /api/public/parts?sku_term=ACR-BR-001
```

**SKU Search (Competitor Cross-Reference)**:
```bash
GET /api/public/parts?sku_term=TM512342
# Returns ACR-BR-001 via cross_references table
```

**SKU Search (Fuzzy Match)**:
```bash
GET /api/public/parts?sku_term=ACR-BR-00
# Returns ACR-BR-001 with similarity: 0.85
```

### Algorithm

```
IF sku_term provided:
  1. Search for exact ACR SKU match
     → If found, return with match_type="exact_acr"

  2. Search cross_references for competitor_sku
     → If found, return ACR part with match_type="competitor_sku"

  3. Fuzzy search using trigrams (similarity > 0.3)
     → Return matches sorted by similarity DESC, match_type="fuzzy"

IF make/model/year provided:
  1. Call search_by_vehicle(make, model, year) RPC function
  2. Returns parts matching vehicle application
  3. Enriches with primary_image_url (first image by display_order)
```

---

## `GET /api/public/vehicle-options`

Get cascading dropdown options for Make/Model/Year.

### Query Parameters

- `make?: string` - Filter models by make
- `model?: string` - Filter years by make+model

### Response

```typescript
{
  makes?: string[],           // If no params
  models?: string[],          // If make param
  years?: number[]            // If make+model params
}
```

### Examples

**Get All Makes**:
```bash
GET /api/public/vehicle-options
# Response: { makes: ["HONDA", "TOYOTA", "FORD", ...] }
```

**Get Models for HONDA**:
```bash
GET /api/public/vehicle-options?make=HONDA
# Response: { models: ["ACCORD", "CIVIC", "CR-V", ...] }
```

**Get Years for HONDA CIVIC**:
```bash
GET /api/public/vehicle-options?make=HONDA&model=CIVIC
# Response: { years: [2018, 2019, 2020, 2021, 2022] }
```

### Year Expansion

Years are stored as ranges (e.g., "2018-2022") but expanded in response:
```typescript
// Database: "2018-2022"
// Response: [2018, 2019, 2020, 2021, 2022]
```

---

## `GET /api/public/settings`

Get all public site settings (contact info, branding, banners).

### Response

```typescript
{
  settings: {
    contact_info: {
      email: string;
      phone: string;
      whatsapp: string;
      address: string;
    },
    branding: {
      company_name: string;
      logo_url: string;
      favicon_url: string;
      banners: Array<{
        id: string;
        image_url: string;
        mobile_image_url?: string;
        title?: string;
        subtitle?: string;
        cta_text?: string;
        cta_link?: string;
        display_order: number;
        is_active: boolean;
      }>;
    }
  }
}
```

### Example

```bash
GET /api/public/settings
```

### Cache Headers

```
Cache-Control: public, max-age=600  # 10 minutes
```

---

# Admin APIs - Parts Management

## `GET /api/admin/parts`

List all parts (paginated) or get single part with full details.

### Query Parameters

**Single Part**:
- `id?: string` - Part UUID (if provided, returns single part with relationships)

**List Parts (all optional)**:
- `limit?: number` - Results per page (default: 15)
- `offset?: number` - Results to skip (default: 0)
- `sort_by?: string` - Column to sort by (default: "created_at")
- `sort_order?: "asc" | "desc"` - Sort direction (default: "desc")
- `search?: string` - Text search in ACR SKU
- `part_type?: string` - Filter by part type
- `position_type?: string` - Filter by position
- `abs_type?: string` - Filter by ABS type
- `drive_type?: string` - Filter by drive type
- `bolt_pattern?: string` - Filter by bolt pattern

### Response (Single Part)

```typescript
{
  data: {
    // Part fields
    id: string;
    acr_sku: string;
    part_type: string;
    // ... all part fields

    // Relationships
    vehicle_applications: Array<VehicleApplication>;
    cross_references: Array<CrossReference>;
    vehicle_count: number;
    cross_reference_count: number;
  }
}
```

### Response (List)

```typescript
{
  data: Array<{
    id: string;
    acr_sku: string;
    part_type: string;
    // ... all part fields
    vehicle_count: number;
    cross_reference_count: number;
  }>,
  count: number  // Total count (not just current page)
}
```

### Examples

**Get Single Part**:
```bash
GET /api/admin/parts?id=550e8400-e29b-41d4-a716-446655440000
```

**List All Parts (Paginated)**:
```bash
GET /api/admin/parts?limit=15&offset=0&sort_by=created_at&sort_order=desc
```

**Search and Filter**:
```bash
GET /api/admin/parts?search=ACR-BR&part_type=Brake%20Rotor&limit=15
```

---

## `POST /api/admin/parts`

Create a new part.

### Request Body

```typescript
{
  sku_number: string;         // Part number (e.g., "BR-001")
  part_type: string;          // "Brake Rotor", "Brake Pad", etc.
  position_type?: string;     // "Front", "Rear", "Front & Rear"
  abs_type?: string;          // "With ABS", "Without ABS"
  bolt_pattern?: string;      // "4x100", "5x114.3"
  drive_type?: string;        // "FWD", "RWD", "AWD"
  specifications?: any;       // JSONB field for custom specs
}
```

**Note**: `acr_sku` is auto-generated as `ACR{sku_number}` (e.g., `ACRBR-001`).

### Response

```typescript
{
  data: Array<Part>  // Created part
}
```

### Example

```bash
POST /api/admin/parts
Content-Type: application/json

{
  "sku_number": "BR-001",
  "part_type": "Brake Rotor",
  "position_type": "Front",
  "abs_type": "With ABS",
  "bolt_pattern": "5x114.3",
  "drive_type": "FWD"
}
```

### Error Responses

**Duplicate SKU (409)**:
```json
{
  "error": "A part with this part number already exists"
}
```

**Validation Error (400)**:
```json
{
  "error": "Validation failed",
  "issues": [
    { "field": "part_type", "message": "Required" }
  ]
}
```

---

## `PUT /api/admin/parts`

Update an existing part.

### Request Body

```typescript
{
  id: string;                 // Part UUID (required)
  part_type?: string;
  position_type?: string;
  abs_type?: string;
  bolt_pattern?: string;
  drive_type?: string;
  specifications?: any;
}
```

**Note**: `acr_sku` cannot be updated.

### Response

```typescript
{
  data: Array<Part>  // Updated part
}
```

### Example

```bash
PUT /api/admin/parts
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "part_type": "Brake Rotor",
  "position_type": "Front & Rear"
}
```

### Error Responses

**Part Not Found (404)**:
```json
{
  "error": "Part not found"
}
```

---

## `DELETE /api/admin/parts`

Delete a part (cascades to vehicle_applications and cross_references).

### Request Body

```typescript
{
  id: string  // Part UUID
}
```

### Response

```typescript
{
  data: Array<Part>  // Deleted part
}
```

### Example

```bash
DELETE /api/admin/parts
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

# Admin APIs - Bulk Operations

All bulk operations are **atomic** - either all succeed or all fail (transaction rollback).

## `POST /api/admin/bulk/parts/create`

Create multiple parts in a single transaction.

### Request Body

```typescript
{
  parts: Array<{
    sku_number: string;
    part_type: string;
    position_type?: string;
    abs_type?: string;
    bolt_pattern?: string;
    drive_type?: string;
    specifications?: any;
  }>
}
```

### Response

```typescript
{
  success: true,
  created: number,     // Count of created parts
  data: Array<Part>
}
```

### Example

```bash
POST /api/admin/bulk/parts/create
Content-Type: application/json

{
  "parts": [
    { "sku_number": "BR-001", "part_type": "Brake Rotor" },
    { "sku_number": "BR-002", "part_type": "Brake Rotor" },
    { "sku_number": "BP-001", "part_type": "Brake Pad" }
  ]
}
```

---

## `PUT /api/admin/bulk/parts/update`

Update multiple parts in a single transaction.

### Request Body

```typescript
{
  parts: Array<{
    id: string;              // Required for update
    part_type?: string;
    position_type?: string;
    abs_type?: string;
    bolt_pattern?: string;
    drive_type?: string;
    specifications?: any;
  }>
}
```

### Response

```typescript
{
  success: true,
  updated: number,
  data: Array<Part>
}
```

---

## `DELETE /api/admin/bulk/parts/delete`

Delete multiple parts in a single transaction.

### Request Body

```typescript
{
  ids: string[]  // Array of part UUIDs
}
```

### Response

```typescript
{
  success: true,
  deleted: number
}
```

---

## `POST /api/admin/bulk/vehicles/create`

Create multiple vehicle applications in a single transaction.

### Request Body

```typescript
{
  vehicles: Array<{
    part_id: string;      // Part UUID
    make: string;
    model: string;
    year_range: string;   // e.g., "2018-2022" or "2020"
  }>
}
```

### Response

```typescript
{
  success: true,
  created: number,
  data: Array<VehicleApplication>
}
```

---

## `PUT /api/admin/bulk/vehicles/update`

Update multiple vehicle applications.

### Request Body

```typescript
{
  vehicles: Array<{
    id: string;           // VehicleApplication UUID
    make?: string;
    model?: string;
    year_range?: string;
  }>
}
```

---

## `DELETE /api/admin/bulk/vehicles/delete`

Delete multiple vehicle applications.

### Request Body

```typescript
{
  ids: string[]  // Array of VehicleApplication UUIDs
}
```

---

## `POST /api/admin/bulk/cross-references/create`

Create multiple cross-references in a single transaction.

### Request Body

```typescript
{
  cross_references: Array<{
    acr_part_id: string;       // ACR part UUID
    competitor_brand: string;  // e.g., "Centric", "Wagner"
    competitor_sku: string;    // e.g., "120.44171"
  }>
}
```

### Response

```typescript
{
  success: true,
  created: number,
  data: Array<CrossReference>
}
```

---

## `PUT /api/admin/bulk/cross-references/update`

Update multiple cross-references.

### Request Body

```typescript
{
  cross_references: Array<{
    id: string;                // CrossReference UUID
    competitor_brand?: string;
    competitor_sku?: string;
  }>
}
```

---

## `DELETE /api/admin/bulk/cross-references/delete`

Delete multiple cross-references.

### Request Body

```typescript
{
  ids: string[]  // Array of CrossReference UUIDs
}
```

---

# Admin APIs - Image Management

## `GET /api/admin/parts/[id]/images`

Get all images for a part, ordered by `display_order`.

### Response

```typescript
{
  data: Array<{
    id: string;
    part_id: string;
    image_url: string;
    display_order: number;
    is_primary: boolean;       // Deprecated (use display_order=0 instead)
    caption: string | null;
    created_at: string;
    updated_at: string;
  }>
}
```

### Example

```bash
GET /api/admin/parts/550e8400-e29b-41d4-a716-446655440000/images
```

---

## `POST /api/admin/parts/[id]/images`

Upload multiple images for a part (max 6 total).

### Request Body

`multipart/form-data`

- `files: File[]` - Array of image files

### Validation

- **Max images**: 6 per part
- **File types**: `image/*`
- **Max file size**: 5MB per file

### Response

```typescript
{
  success: true,
  images: Array<PartImage>,
  count: number
}
```

### Example

```bash
POST /api/admin/parts/550e8400-e29b-41d4-a716-446655440000/images
Content-Type: multipart/form-data

files: [image1.jpg, image2.jpg, image3.jpg]
```

### Error Responses

**Max Capacity (400)**:
```json
{
  "error": "Maximum of 6 images per part"
}
```

**Remaining Slots (400)**:
```json
{
  "error": "Can only upload 2 more image(s). Maximum 6 images per part."
}
```

---

## `PUT /api/admin/parts/[id]/images/reorder`

Reorder images by providing new sequence.

### Request Body

```typescript
{
  image_ids: string[]  // Array of image UUIDs in desired order
}
```

**Important**: First image becomes primary (`display_order = 0`).

### Response

```typescript
{
  success: true
}
```

### Example

```bash
PUT /api/admin/parts/550e8400-e29b-41d4-a716-446655440000/images/reorder
Content-Type: application/json

{
  "image_ids": [
    "image-c-uuid",  // display_order = 0 (PRIMARY)
    "image-a-uuid",  // display_order = 1
    "image-b-uuid"   // display_order = 2
  ]
}
```

---

## `PUT /api/admin/parts/[id]/images/[imageId]/primary`

Set an image as primary (deprecated - use reorder instead).

### Response

```typescript
{
  success: true,
  data: PartImage
}
```

---

## `PUT /api/admin/parts/[id]/images/[imageId]`

Update image caption.

### Request Body

```typescript
{
  caption: string | null
}
```

### Response

```typescript
{
  success: true,
  data: PartImage
}
```

---

## `DELETE /api/admin/parts/[id]/images/[imageId]`

Delete an image (removes from storage and database).

### Response

```typescript
{
  success: true
}
```

### Cleanup Process

1. Fetch image record
2. Extract storage path from `image_url`
3. Delete from Supabase Storage (`acr-part-images` bucket)
4. Delete database record

---

## `GET /api/admin/parts/[id]/360-frames`

Get all 360° frames for a part.

### Response

```typescript
{
  frames: Array<{
    id: string;
    part_id: string;
    frame_number: number;      // 0-indexed
    image_url: string;
    storage_path: string;
    file_size_bytes: number;
    width: number;
    height: number;
    created_at: string;
  }>,
  count: number
}
```

---

## `POST /api/admin/parts/[id]/360-frames`

Upload 360° frames (replaces existing viewer).

### Request Body

`multipart/form-data`

- Multiple files (12-48 frames)

### Configuration

```typescript
{
  minFrames: 12,
  recommendedFrames: 24,
  maxFrames: 48,
  targetDimension: 1200,    // Resize longest edge
  jpegQuality: 85,
  maxFileSize: 10485760     // 10MB per file
}
```

### Image Processing

All frames are optimized with Sharp:
- Resized to 1200x1200 (contain fit with white background)
- Converted to progressive JPEG (quality 85)
- MozJPEG compression

### Response

```typescript
{
  success: true,
  frameCount: number,
  frames: Array<UploadedFrame>,
  warning?: string,    // If frame count suboptimal
  errors?: string[]    // Partial failure details
}
```

### Example

```bash
POST /api/admin/parts/550e8400-e29b-41d4-a716-446655440000/360-frames
Content-Type: multipart/form-data

files: [frame-000.png, frame-001.png, ..., frame-023.png]  # 24 frames
```

### Error Responses

**Too Few Frames (400)**:
```json
{
  "error": "Minimum 12 frames required",
  "currentCount": 8
}
```

**Too Many Frames (400)**:
```json
{
  "error": "Maximum 48 frames allowed",
  "currentCount": 60
}
```

---

## `DELETE /api/admin/parts/[id]/360-frames`

Delete all 360° frames for a part.

### Response

```typescript
{
  success: true
}
```

### Cleanup Process

1. Fetch all frame records
2. Delete all frames from storage
3. Delete all frame records from database
4. Update part: `has_360_viewer = false`, `viewer_360_frame_count = 0`

---

# Admin APIs - Other

## `GET /api/admin/export`

Export catalog data to Excel file (3-sheet format).

### Query Parameters (All Optional)

- `search?: string` - Text search (SKU, description, part type)
- `part_type?: string` - Filter by part type
- `position_type?: string` - Filter by position
- `abs_type?: string` - Filter by ABS type
- `drive_type?: string` - Filter by drive type
- `bolt_pattern?: string` - Filter by bolt pattern

**If no filters**: Exports entire catalog
**If filters**: Exports only matching parts and their relationships

### Response

**Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Filename**: `acr-catalog-export-{YYYY-MM-DD}.xlsx` or `acr-filtered-export-{YYYY-MM-DD}.xlsx`

**Custom Headers**:
```
X-Export-Parts: 9600
X-Export-Vehicles: 18000
X-Export-CrossRefs: 12000
X-Export-Total: 39600
```

### Excel Structure

3 sheets:
1. **Parts** - All part data with hidden ID column
2. **Vehicle Applications** - All vehicle apps with hidden part_id column
3. **Cross References** - All cross-refs with hidden acr_part_id column

### Examples

**Export All**:
```bash
GET /api/admin/export
# Downloads: acr-catalog-export-2025-10-25.xlsx
```

**Export Filtered**:
```bash
GET /api/admin/export?part_type=Brake%20Rotor&search=civic
# Downloads: acr-filtered-export-2025-10-25.xlsx
```

---

## `GET /api/admin/stats`

Get dashboard statistics.

### Response

```typescript
{
  success: true,
  data: {
    totalParts: number;
    totalVehicles: number;
    totalCrossReferences: number;
  }
}
```

### Example

```bash
GET /api/admin/stats
# Response: { success: true, data: { totalParts: 9600, totalVehicles: 18000, totalCrossReferences: 12000 } }
```

---

## `GET /api/admin/filter-options`

Get filter dropdown options for parts list.

### Response

```typescript
{
  part_types: string[];
  position_types: string[];
  abs_types: string[];
  drive_types: string[];
  bolt_patterns: string[];
}
```

### Example

```bash
GET /api/admin/filter-options
```

---

## `POST /api/admin/auth`

Verify admin password.

### Request Body

```typescript
{
  password: string
}
```

### Response (Success - 200)

```typescript
{
  success: true
}
```

### Response (Invalid - 401)

```typescript
{
  success: false,
  error: "Invalid password"
}
```

### Example

```bash
POST /api/admin/auth
Content-Type: application/json

{
  "password": "your-admin-password"
}
```

---

## `GET /api/admin/settings`

Get all site settings for admin editing.

### Response

```typescript
{
  settings: {
    contact_info: ContactInfo;
    branding: Branding;
  }
}
```

---

## `PUT /api/admin/settings`

Update a specific setting by key.

### Request Body

```typescript
{
  key: "contact_info" | "branding";
  value: ContactInfo | Branding;
}
```

### Response

```typescript
{
  message: string;
  setting: {
    key: string;
    value: any;
    updated_at: string;
  }
}
```

---

## `POST /api/admin/settings/upload-asset`

Upload branding assets (logo, favicon, banner images).

### Request Body

`multipart/form-data`

- `file: File` - The image file
- `type: "logo" | "favicon" | "banner"` - Asset type

### Validation

- **Allowed types**: PNG, JPEG, JPG, WebP, SVG, ICO
- **Max size**: 5MB

### Response

```typescript
{
  message: "Asset uploaded successfully",
  url: string,      // Public URL
  path: string      // Storage path
}
```

### Example

```bash
POST /api/admin/settings/upload-asset
Content-Type: multipart/form-data

file: company-logo.png
type: logo
```

---

## `GET /api/admin/vehicles`

List all vehicle applications.

### Query Parameters

- `limit?: number` - Results per page
- `offset?: number` - Results to skip
- `part_id?: string` - Filter by part UUID

### Response

```typescript
{
  data: Array<VehicleApplication>,
  count: number
}
```

---

## `GET /api/admin/cross-references`

List all cross-references.

### Query Parameters

- `limit?: number` - Results per page
- `offset?: number` - Results to skip
- `part_id?: string` - Filter by ACR part UUID

### Response

```typescript
{
  data: Array<CrossReference>,
  count: number
}
```

---

## Rate Limiting

**Current**: No rate limiting (MVP)

**Recommended**:
- Public APIs: 60 requests/minute per IP
- Admin APIs: 300 requests/minute per session

---

## Authentication

### Public APIs
No authentication required.

### Admin APIs
**MVP**: Client-side password protection via `sessionStorage`
- User authenticates via `/api/admin/auth`
- Session token stored in `sessionStorage`
- HOC (`withAdminAuth`) checks token before rendering

**⚠️ Note**: Admin APIs are not password-protected at the route level. See [AUTHENTICATION.md](features/auth/AUTHENTICATION.md) for details.

---

## CORS

**Allowed Origins**: Same-origin only (Next.js default)

**Headers**:
```
Access-Control-Allow-Origin: [your-domain]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type
```

---

## Caching

### Public APIs
- `/api/public/settings`: 10-minute cache (via TanStack Query)
- `/api/public/vehicle-options`: 5-minute cache
- `/api/public/parts`: No cache (real-time search)

### Admin APIs
No caching (always fresh data).

---

## Error Handling Patterns

### Zod Validation Errors (400)

```json
{
  "error": "Validation failed",
  "issues": [
    { "field": "part_type", "message": "Required" },
    { "field": "sku_number", "message": "Invalid format" }
  ]
}
```

### PostgreSQL Errors

**Unique Constraint Violation (409)**:
```json
{
  "error": "A part with this part number already exists"
}
```

**Foreign Key Violation (400)**:
```json
{
  "error": "Referenced part does not exist"
}
```

### Not Found (404)

```json
{
  "error": "Part not found"
}
```

### Internal Server Error (500)

```json
{
  "error": "Database operation failed",
  "details": { ... }
}
```

---

## Related Documentation

- **[Search System](features/search/SEARCH_SYSTEM.md)** - Detailed search algorithm documentation
- **[Image Management](features/image-management/IMAGE_MANAGEMENT.md)** - Image upload and 360° viewer
- **[Bulk Operations](features/data-management/BULK_OPERATIONS.md)** - Atomic batch operations
- **[Excel Export](features/data-management/EXCEL_EXPORT.md)** - Export system details
- **[Site Settings](features/site-settings/SITE_SETTINGS.md)** - Settings API details
- **[Authentication](features/auth/AUTHENTICATION.md)** - Auth system documentation

---

**Last Updated**: October 25, 2025
