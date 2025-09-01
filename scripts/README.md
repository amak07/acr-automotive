# Test Scripts

## PRECIOS Import Pipeline Test

Tests the complete Excel → Database workflow with real PRECIOS data using isolated test schema.

### Setup Required:

**First time setup** - Run test schema SQL in Supabase:
1. Go to Supabase SQL Editor
2. Copy and run contents of `src/lib/supabase/test-schema.sql`
3. This creates isolated `test` schema separate from production

### Usage:

```bash
# Run the full E2E test (default)
npx tsx scripts/test-precios-import.ts

# Clear test schema tables only
npx tsx scripts/test-precios-import.ts cleanup
```

### What the test does:

1. **Test Schema Verification** - Ensures test schema is accessible
2. **Excel Loading** - Loads real PRECIOS Excel file (105KB)
3. **Excel Parsing** - Uses streamlined PreciosParser with console logging
4. **Database Import** - Complete import pipeline with duplicate handling
5. **Data Verification** - Confirms successful import

### Actual Results:

- **865 parts imported** to `test.parts` table
- **9,400 cross-references imported** to `test.cross_references` table
- **Duplicate handling and long SKU filtering** (>50 chars)
- **Processing time <200ms**

### Safety Features:

- ✅ **Test Schema Isolation** - Uses `test` schema, never affects production
- ✅ **Automatic Cleanup** - Clears test tables before each run
- ✅ **Duplicate Handling** - Gracefully handles data entry errors
- ✅ **Long SKU Filtering** - Skips problematic data until Excel normalization