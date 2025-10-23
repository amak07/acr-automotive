# Excel Export Service Documentation

> **Phase 8.1 Implementation**: Complete catalog export to Excel with hidden ID columns
> **Status**: ✅ Complete (Oct 23, 2025)
> **Location**: `/api/admin/export`

## Overview

The Excel Export Service provides a complete catalog download in standardized 3-sheet Excel format with hidden ID columns for import matching. Built with ExcelJS for full Excel feature support including column visibility, frozen headers, and proper formatting.

## Architecture

### Technology Stack

```
ExcelJS (v4.4.0) → Excel File Generation
     ↓
ExcelExportService → Data transformation & pagination
     ↓
Supabase Client → Database queries with pagination
     ↓
PostgreSQL → Catalog data (9,593 records)
```

**Why ExcelJS over SheetJS:**
- ✅ **Free hidden columns** - Community edition supports column.hidden property
- ✅ **Full Excel features** - Frozen panes, column widths, cell formatting
- ✅ **Better performance** - Handles large datasets efficiently
- ❌ **SheetJS limitation** - Column properties require Pro version ($$$)

### Export-Import Loop Design

```
1. User clicks "Export" → GET /api/admin/export
2. Server fetches all data with pagination (bypasses 1000-row PostgREST limit)
3. ExcelJS generates 3-sheet workbook with hidden ID columns
4. User downloads: acr-catalog-export-YYYY-MM-DD.xlsx
5. User edits data in Excel (ID columns hidden but present)
6. User uploads file → Phase 8.2 Import Service
7. Import Service matches by ID, applies changes atomically
```

## API Endpoint

### GET /api/admin/export

Download complete catalog in Excel format.

**Request:**
```http
GET /api/admin/export HTTP/1.1
Host: localhost:3000
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="acr-catalog-export-2025-10-23.xlsx"
Content-Length: 1234567
X-Export-Parts: 877
X-Export-Vehicles: 2304
X-Export-CrossRefs: 6412
X-Export-Total: 9593

[Binary Excel file data]
```

**Response Headers:**
- `Content-Type` - Excel MIME type
- `Content-Disposition` - Download with timestamped filename
- `X-Export-Parts` - Number of parts exported
- `X-Export-Vehicles` - Number of vehicle applications exported
- `X-Export-CrossRefs` - Number of cross-references exported
- `X-Export-Total` - Total records exported

**Example (curl):**
```bash
curl http://localhost:3000/api/admin/export > export.xlsx
```

**Example (JavaScript):**
```javascript
const response = await fetch('/api/admin/export');
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `acr-catalog-export-${new Date().toISOString().split('T')[0]}.xlsx`;
a.click();
```

## Excel File Structure

### Sheet 1: Parts (877 rows)

**Columns:**
| Column | Header | Key | Width | Hidden | Description |
|--------|--------|-----|-------|--------|-------------|
| A | _id | id | 36 | ✓ | Part UUID (for update matching) |
| B | _tenant_id | tenant_id | 36 | ✓ | Tenant UUID (NULL for MVP) |
| C | ACR_SKU | acr_sku | 15 | ✗ | ACR part number (visible) |
| D | Part_Type | part_type | 20 | ✗ | Part category (visible) |
| E | Description | description | 40 | ✗ | Part description (visible) |
| F | OEM_Number | oem_number | 20 | ✗ | Original equipment number (visible) |
| G | Notes | notes | 30 | ✗ | Additional notes (visible) |

**Features:**
- Frozen header row (first row stays visible when scrolling)
- Hidden ID columns (columns A & B)
- Sorted by ACR_SKU ascending

### Sheet 2: Vehicle Applications (2,304 rows)

**Columns:**
| Column | Header | Key | Width | Hidden | Description |
|--------|--------|-----|-------|--------|-------------|
| A | _id | id | 36 | ✓ | Vehicle application UUID |
| B | _tenant_id | tenant_id | 36 | ✓ | Tenant UUID (NULL for MVP) |
| C | _part_id | part_id | 36 | ✓ | Foreign key to parts table |
| D | Make | make | 15 | ✗ | Vehicle make (Honda, Toyota, etc.) |
| E | Model | model | 20 | ✗ | Vehicle model (Civic, Camry, etc.) |
| F | Start_Year | start_year | 12 | ✗ | First year of fitment |
| G | End_Year | end_year | 12 | ✗ | Last year of fitment (optional) |
| H | Engine | engine | 20 | ✗ | Engine specification (optional) |
| I | Notes | notes | 30 | ✗ | Additional notes (optional) |

**Features:**
- Frozen header row
- Hidden ID columns (columns A, B, C)
- Sorted by part_id, make, model, start_year

### Sheet 3: Cross References (6,412 rows)

**Columns:**
| Column | Header | Key | Width | Hidden | Description |
|--------|--------|-----|-------|--------|-------------|
| A | _id | id | 36 | ✓ | Cross-reference UUID |
| B | _tenant_id | tenant_id | 36 | ✓ | Tenant UUID (NULL for MVP) |
| C | _part_id | acr_part_id | 36 | ✓ | Foreign key to parts table |
| D | Competitor_Brand | competitor_brand | 20 | ✗ | Competitor brand name |
| E | Competitor_SKU | competitor_sku | 20 | ✗ | Competitor part number |

**Features:**
- Frozen header row
- Hidden ID columns (columns A, B, C)
- Sorted by acr_part_id, competitor_brand, competitor_sku

## ExcelExportService Implementation

### Class Structure

Located in: `src/lib/services/ExcelExportService.ts`

```typescript
export class ExcelExportService {
  // Main export method
  async exportAllData(): Promise<Buffer>

  // Pagination helper (bypasses PostgREST 1000-row limit)
  private async fetchAllRows(tableName: string, orderBy: string): Promise<any[]>

  // Sheet builders
  private addPartsSheet(workbook: ExcelJS.Workbook, parts: any[]): void
  private addVehiclesSheet(workbook: ExcelJS.Workbook, vehicles: any[]): void
  private addCrossRefsSheet(workbook: ExcelJS.Workbook, crossRefs: any[]): void

  // Statistics for response headers
  async getExportStats(): Promise<ExportStats>
}
```

### Pagination Strategy

**Problem**: PostgREST has a server-side max-rows limit (default 1000)

**Solution**: Use `.range(start, end)` to paginate through results

```typescript
private async fetchAllRows(tableName: string, orderBy: string): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let allRows: any[] = [];
  let start = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending: true })
      .range(start, start + PAGE_SIZE - 1); // Fetch 1000 rows at a time

    if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      start += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // Continue if we got a full page
    } else {
      hasMore = false;
    }
  }

  return allRows;
}
```

**Performance:**
- Parts (877 rows): 1 query
- Vehicles (2,304 rows): 3 queries (1000 + 1000 + 304)
- Cross-refs (6,412 rows): 7 queries (1000 × 6 + 412)
- Total: ~11 database queries, executed in parallel with `Promise.all()`

### Hidden Columns Implementation

ExcelJS provides built-in support for hidden columns via the `hidden` property:

```typescript
worksheet.columns = [
  { header: '_id', key: 'id', width: 36, hidden: true },  // Hidden
  { header: '_tenant_id', key: 'tenant_id', width: 36, hidden: true },  // Hidden
  { header: 'ACR_SKU', key: 'acr_sku', width: 15 },  // Visible
  // ... more columns
];
```

**How it works:**
1. ExcelJS sets the `hidden` attribute in the Excel XML
2. Excel respects the attribute and hides columns A & B
3. Columns are still present in the file (data intact)
4. Users can unhide via Excel: Home → Format → Hide & Unhide → Unhide Columns

**Verification:**
```typescript
// Reading with ExcelJS preserves hidden state
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('export.xlsx');
const worksheet = workbook.getWorksheet('Parts');
const idColumn = worksheet.getColumn(1);
console.log(idColumn.hidden); // true
```

### Frozen Headers Implementation

Frozen panes keep the header row visible when scrolling:

```typescript
worksheet.views = [{ state: 'frozen', ySplit: 1 }];
```

**Result:**
- Users can scroll through thousands of rows
- Column headers always visible at top
- Better UX for large datasets

## Performance Characteristics

### Export Time Benchmarks

From `scripts/test-excel-export.ts`:

```
Total Records: 9,593
  - Parts: 877
  - Vehicles: 2,304
  - Cross-Refs: 6,412

Export Duration: 1,768ms - 5,470ms
  - Database queries: ~1,500ms (11 paginated queries)
  - ExcelJS generation: ~200-300ms
  - Buffer conversion: ~10ms
```

**Scaling Estimates:**
- 10k records: ~2-3 seconds
- 50k records: ~8-12 seconds
- 100k records: ~15-25 seconds

### Memory Usage

ExcelJS generates files in memory before writing:

- 9,593 rows: ~2-3 MB memory
- File size: ~500 KB (compressed)
- Buffer overhead: ~2x file size during generation

**Optimization for larger datasets:**
- Use ExcelJS streaming API for >100k rows
- Generate sheets sequentially instead of in parallel
- Write to temp file instead of Buffer

### Database Impact

**Query Pattern:**
```sql
-- 11 queries total, executed in parallel:

-- Parts (1 query)
SELECT * FROM parts ORDER BY acr_sku LIMIT 1000 OFFSET 0;

-- Vehicles (3 queries)
SELECT * FROM vehicle_applications ORDER BY part_id, make, model, start_year LIMIT 1000 OFFSET 0;
SELECT * FROM vehicle_applications ORDER BY part_id, make, model, start_year LIMIT 1000 OFFSET 1000;
SELECT * FROM vehicle_applications ORDER BY part_id, make, model, start_year LIMIT 1000 OFFSET 2000;

-- Cross-refs (7 queries)
SELECT * FROM cross_references ORDER BY acr_part_id, competitor_brand, competitor_sku LIMIT 1000 OFFSET 0;
-- ... 6 more queries with increasing offsets
```

**Index Usage:**
- Full table scans (intentional - exporting all data)
- ORDER BY uses natural row order when possible
- No WHERE clauses (fetching everything)

**Concurrency:**
- Read-only queries (no locks)
- Safe to run during normal operations
- No impact on write operations

## Testing

### Automated Test Suite

Located in: `scripts/test-excel-export.ts`

Run with:
```bash
npm run test:export
```

**Test Coverage (8/8 tests):**

1. ✅ **3 Required Sheets** - Validates Parts, Vehicle Applications, Cross References sheets exist
2. ✅ **Parts Sheet Structure** - Verifies all 7 column headers present
3. ✅ **Hidden Columns** - Confirms _id and _tenant_id are hidden (using ExcelJS reader)
4. ✅ **Parts Row Count** - 877 rows match database count
5. ✅ **Vehicles Sheet Structure** - Verifies all 9 column headers present
6. ✅ **Vehicles Row Count** - 2,304 rows match database count
7. ✅ **Cross-Refs Sheet Structure** - Verifies all 5 column headers present
8. ✅ **Cross-Refs Row Count** - 6,412 rows match database count

**Expected Output:**
```
🧪 Testing Excel Export API...

📥 Downloading Excel file from /api/admin/export...
✅ Downloaded in 1768ms
   Parts: 877
   Vehicles: 2304
   Cross-Refs: 6412
   Total Records: 9593

💾 Saved to: C:\Users\abelm\Projects\acr-automotive\tmp\test-export.xlsx

📊 Analyzing Excel structure...

📋 Test Results:

════════════════════════════════════════════════════════════════════════════════
✅ PASS | 3 Required Sheets              | Found: Parts, Vehicle Applications, Cross References
✅ PASS | Parts Sheet Structure          | Headers: _id, _tenant_id, ACR_SKU, Part_Type, Description, OEM_Number, Notes
✅ PASS | Hidden Columns (_id, _tenant_id) | ✓ Columns properly hidden
✅ PASS | Parts Row Count                | 877 rows (expected 877)
✅ PASS | Vehicle Applications Sheet     | Headers: _id, _tenant_id, _part_id, Make, Model, Start_Year...
✅ PASS | Vehicles Row Count             | 2304 rows (expected 2304)
✅ PASS | Cross References Sheet         | Headers: _id, _tenant_id, _part_id, Competitor_Brand, Competitor_SKU
✅ PASS | Cross-Refs Row Count           | 6412 rows (expected 6412)
════════════════════════════════════════════════════════════════════════════════

📈 Summary: 8/8 tests passed

✅ Excel export working correctly with hidden columns!
```

### Manual Testing

**Browser Test:**
```javascript
// In browser console or React component
const response = await fetch('/api/admin/export');
const blob = await response.blob();

// Check response headers
console.log('Parts:', response.headers.get('X-Export-Parts'));
console.log('Vehicles:', response.headers.get('X-Export-Vehicles'));
console.log('Cross-Refs:', response.headers.get('X-Export-CrossRefs'));

// Download file
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'test-export.xlsx';
a.click();
```

**Open in Excel and verify:**
1. Columns A & B are hidden (right-click column C → Unhide to verify they exist)
2. Header row is frozen (scroll down, headers stay visible)
3. All data matches database records
4. File opens without errors

## Error Handling

### Database Errors

```typescript
// Supabase error during fetch
{
  "success": false,
  "error": "Failed to export catalog data",
  "message": "Failed to fetch parts: connection timeout"
}
```

**HTTP Status**: 500 Internal Server Error

**Common Causes:**
- Database connection timeout
- Invalid query syntax
- Network issues

### Memory Errors

```typescript
// Out of memory (rare, would need >1M rows)
{
  "success": false,
  "error": "Failed to export catalog data",
  "message": "JavaScript heap out of memory"
}
```

**HTTP Status**: 500 Internal Server Error

**Solution**: Implement streaming export for very large datasets

### Browser Download Errors

**Symptom**: File downloads but won't open in Excel

**Causes:**
- Incorrect MIME type
- Corrupted buffer
- Browser extension interference

**Debug:**
```javascript
// Check buffer integrity
const buffer = await response.arrayBuffer();
console.log('File size:', buffer.byteLength); // Should be >100KB

// Verify MIME type
console.log('Content-Type:', response.headers.get('Content-Type'));
// Should be: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## Multi-Tenancy Support

### Current State (MVP - Single Tenant)

All exported data belongs to the default tenant:

```typescript
worksheet.addRow({
  id: part.id,
  tenant_id: part.tenant_id || null,  // Always NULL for MVP
  acr_sku: part.acr_sku,
  // ... other fields
});
```

### Future State (Multi-Tenant SaaS)

**Export will be scoped to authenticated user's tenant:**

```typescript
async exportAllData(tenantId: string): Promise<Buffer> {
  const [parts, vehicles, crossRefs] = await Promise.all([
    this.fetchAllRows('parts', 'acr_sku', tenantId),
    this.fetchAllRows('vehicle_applications', 'part_id, make, model, start_year', tenantId),
    this.fetchAllRows('cross_references', 'acr_part_id, competitor_brand, competitor_sku', tenantId),
  ]);
  // ... rest of export
}

private async fetchAllRows(tableName: string, orderBy: string, tenantId: string): Promise<any[]> {
  // ... pagination loop
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('tenant_id', tenantId)  // Filter by tenant
    .order(orderBy, { ascending: true })
    .range(start, start + PAGE_SIZE - 1);
  // ... rest of method
}
```

**API Route will extract tenant from auth:**

```typescript
export async function GET(request: NextRequest) {
  // Get tenant ID from authenticated session
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = user?.user_metadata?.tenant_id;

  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = new ExcelExportService();
  const buffer = await service.exportAllData(tenantId);
  // ... rest of export
}
```

## Security Considerations

### Current State (MVP)

**No Authentication:**
- Endpoint is publicly accessible
- Anyone can export all catalog data
- Acceptable for single-tenant MVP

**Data Exposure:**
- All catalog data is exported
- UUIDs are visible in hidden columns
- No sensitive customer data (parts catalog is public info)

### Phase 9 (Production Security)

**Required Enhancements:**

1. **Authentication**
   ```typescript
   // Require admin role
   const { data: { user }, error } = await supabase.auth.getUser();
   if (!user || user.role !== 'admin') {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
   }
   ```

2. **Rate Limiting**
   - Max 10 exports per hour per user
   - Prevent abuse/DoS attacks
   - Track export history in database

3. **Audit Logging**
   ```typescript
   await supabase.from('audit_log').insert({
     user_id: user.id,
     action: 'catalog_export',
     timestamp: new Date(),
     record_count: stats.totalRecords,
   });
   ```

4. **Row-Level Security (RLS)**
   - PostgreSQL policies enforce tenant isolation
   - Export only returns user's tenant data
   - No code changes needed (database enforces)

## Future Enhancements

### Streaming Export (for >100k rows)

Replace in-memory buffer with streaming API:

```typescript
async exportAllDataStreaming(): Promise<NodeJS.ReadableStream> {
  const stream = new Stream.Readable();
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream });

  // Add sheets and write rows incrementally
  const partsSheet = workbook.addWorksheet('Parts');

  // Fetch and write in batches
  for await (const batch of this.fetchRowsStreaming('parts')) {
    batch.forEach(part => partsSheet.addRow(part).commit());
  }

  await workbook.commit();
  return stream;
}
```

**Benefits:**
- Constant memory usage (~10MB regardless of dataset size)
- Can export millions of rows
- Faster time-to-first-byte

### Partial Export (Selected Data)

Allow users to export filtered datasets:

```typescript
async exportFiltered(filters: ExportFilters): Promise<Buffer> {
  // Support query parameters
  const { part_type, make, date_range } = filters;

  // Build filtered queries
  let query = supabase.from('parts').select('*');
  if (part_type) query = query.eq('part_type', part_type);
  if (date_range) query = query.gte('created_at', date_range.start);

  // ... rest of export
}
```

**Use Cases:**
- Export only brake parts
- Export only Honda fitments
- Export only recent changes

### Custom Column Selection

Let users choose which columns to export:

```typescript
interface ExportOptions {
  parts: {
    columns: ('acr_sku' | 'part_type' | 'description' | 'oem_number' | 'notes')[];
    includeIds: boolean;
  };
  vehicles: { /* similar */ };
  crossRefs: { /* similar */ };
}
```

**Benefits:**
- Smaller file sizes
- Focused exports for specific tasks
- Better UX for advanced users

### Export Templates

Pre-defined export configurations:

```typescript
const templates = {
  'full-catalog': { /* all data, all columns */ },
  'parts-only': { /* just parts, no relationships */ },
  'inventory-update': { /* parts + stock levels (future feature) */ },
  'pricing-update': { /* parts + pricing (future feature) */ },
};
```

## Troubleshooting

### Issue: File won't open in Excel

**Symptoms:**
- "Excel cannot open the file" error
- File appears corrupted

**Debug Steps:**
1. Check file size: `ls -lh export.xlsx` (should be >100KB)
2. Verify it's a ZIP file: `unzip -l export.xlsx` (should list XML files)
3. Check MIME type in response headers
4. Try opening with LibreOffice/Google Sheets

**Common Causes:**
- Buffer corruption during download
- Browser extension interfering
- Antivirus blocking download

### Issue: Hidden columns are visible

**Symptoms:**
- Can see _id, _tenant_id columns in Excel

**Debug Steps:**
1. Verify using ExcelJS:
   ```typescript
   const wb = new ExcelJS.Workbook();
   await wb.xlsx.readFile('export.xlsx');
   const ws = wb.getWorksheet('Parts');
   console.log(ws.getColumn(1).hidden); // Should be true
   ```

2. Check Excel version (older versions may not support hidden attribute)
3. Manually hide: Right-click column A → Hide

**Cause:**
- Excel 2003 or older doesn't fully support hidden columns
- Excel on web has limited support

### Issue: Wrong number of rows

**Symptoms:**
- Parts: 877 expected, 1000 exported
- Vehicles: 2304 expected, 1000 exported

**Cause:** Pagination not working (PostgREST limit hit)

**Fix:**
1. Check `fetchAllRows()` has `range()` calls
2. Verify `hasMore` logic correctly detects last page
3. Check database logs for query counts

### Issue: Slow export (>30 seconds)

**Symptoms:**
- Export takes very long
- Request times out

**Debug Steps:**
1. Check record counts: `SELECT COUNT(*) FROM parts;`
2. Profile database queries: Check Supabase dashboard
3. Check server logs for pagination timing

**Optimizations:**
- Add database indexes on ORDER BY columns
- Increase PAGE_SIZE from 1000 to 5000
- Use streaming export for very large datasets

## References

### Related Documentation

- [Bulk Operations API](./BULK_OPERATIONS.md) - Create/update/delete operations
- [Database Schema](../../architecture/DATABASE.md) - Table structure
- [Phase 8 Plan](../../technical-plans/data-management/cat1-production-plan.md) - Overall strategy

### Code Locations

- Service: `src/lib/services/ExcelExportService.ts`
- API Route: `src/app/api/admin/export/route.ts`
- Test Suite: `scripts/test-excel-export.ts`
- Test Command: `npm run test:export`

### External Resources

- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [PostgREST Pagination](https://postgrest.org/en/stable/api.html#limits-and-pagination)
- [Excel MIME Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)

---

**Document Version**: 1.0
**Last Updated**: October 23, 2025
**Author**: Claude (Session 15)
**Status**: ✅ Phase 8.1 Complete
