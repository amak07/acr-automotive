# TESTING.md - ACR Automotive Testing Strategy

> **Philosophy**: Test the critical business logic and core features that directly impact Humberto's business. Focus on clean, simple tests that catch real problems without over-engineering.

## 🎯 Testing Priorities (ACR Automotive Specific)

### **CRITICAL - Must Test (MVP)**

1. **Excel parsing accuracy** - Ensure data imports correctly without corruption
2. **Cross-reference lookup** - Competitor SKU → Humberto's part mapping works perfectly
3. **Vehicle search logic** - Make → Model → Year → Part filtering is accurate
4. **Database schema integrity** - Schema changes break tests, forcing updates
5. **Search performance** - Core search functions return results quickly

### **IMPORTANT - Test When Built**

1. **Data validation** - Invalid Excel data is properly rejected
2. **Image upload workflow** - Admin can successfully upload and link images
3. **Translation system** - i18n keys work correctly for English/Spanish
4. **Error handling** - Graceful failure when searches return no results

### **SKIP FOR MVP**

1. ❌ **UI component behavior** - Complex form interactions, animations
2. ❌ **Authentication flows** - Mock auth for MVP, test real auth post-MVP
3. ❌ **Performance edge cases** - Large dataset handling (can test later)
4. ❌ **Browser compatibility** - Focus on tablet support only

## 🧪 Testing Approach by Business Function

### **1. Excel Data Processing (Critical)**

**Focus**: Data accuracy and integrity - this is the heart of Humberto's business

```typescript
// ✅ Test these - business critical
parseExcelFile(), validateExcelData(), importToDatabase();

// ✅ Test these - data integrity
extractPartCategories(), mapVehicleApplications(), createCrossReferences();

// ❌ Skip these for now - file handling
uploadProgress(), fileValidation(), errorLogging();
```

**Key Test Cases**:

```typescript
// Data parsing accuracy
it("should correctly parse all Excel columns A-N");
it("should extract ACR SKU and competitor SKU correctly");
it("should handle missing competitor SKUs gracefully");
it("should reject invalid part types");

// Cross-reference integrity
it("should create correct cross-reference mappings");
it("should handle duplicate competitor SKUs");
it("should link parts to correct vehicle applications");
```

### **2. Search Functionality (Critical)**

**Focus**: Accurate part lookup - core user value

```typescript
// ✅ Test these - core business logic
searchBySKU(), searchByVehicle(), fuzzySkuMatching();

// ✅ Test these - search accuracy
findExactMatches(), findCrossReferences(), handleTypos();

// ❌ Skip these for now - UI behavior
searchSuggestions(), autocomplete(), searchHistory();
```

**Key Test Cases**:

```typescript
// SKU cross-reference search
it("should find Humberto part when searching competitor SKU");
it("should handle exact ACR SKU matches");
it("should return fuzzy matches for typos");
it("should return no results for invalid SKUs");

// Vehicle search
it("should filter parts by make, model, year");
it("should return all compatible parts for vehicle");
it("should handle missing vehicle applications");
```

### **3. Database Operations (Important)**

**Focus**: Data consistency and relationships

```typescript
// ✅ Test these - data relationships
createPart(), createVehicleApplication(), createCrossReference();

// ✅ Test these - data integrity
handleDuplicateSkus(), validatePartTypes(), enforceRequiredFields();

// ❌ Skip these for now - basic CRUD
updatePart(), deletePart(), softDeletes();
```

## 📁 Test Organization (Simplified)

```
src/
├── lib/
│   ├── excel/
│   │   └── __tests__/
│   │       ├── parser.test.ts           # Excel parsing logic
│   │       └── importer.test.ts         # Database import logic
│   ├── search/
│   │   └── __tests__/
│   │       ├── sku-search.test.ts       # Cross-reference search
│   │       └── vehicle-search.test.ts   # Vehicle-based search
│   └── supabase/
│       └── __tests__/
│           └── database.test.ts         # Database operations
├── app/api/
│   ├── search/
│   │   └── __tests__/
│   │       ├── sku.test.ts              # SKU search API
│   │       └── vehicle.test.ts          # Vehicle search API
│   └── admin/
│       └── __tests__/
│           └── upload.test.ts           # Excel upload API
└── __tests__/
    ├── test-utils.ts                    # Shared test utilities
    ├── factories.ts                     # Type-safe data factories
    └── setup.ts                        # Test environment setup
```

## 🏗️ Type-Safe Test Factories (Schema Protection)

### **Problem**: Schema changes break functionality silently

### **Solution**: Type-safe factories that force test updates

```typescript
// src/__tests__/factories.ts
import { Database } from "@/types/supabase";

type Part = Database["public"]["Tables"]["parts"]["Row"];
type VehicleApplication =
  Database["public"]["Tables"]["vehicle_applications"]["Row"];

// ✅ These MUST match current Supabase schema
export const PartFactory = (overrides: Partial<Part> = {}): Part => ({
  id: crypto.randomUUID(),
  acr_sku: "ACR512342",
  competitor_sku: "TM512342",
  part_type: "MAZA",
  position: "TRASERA",
  abs_type: "C/ABS",
  bolt_pattern: "5",
  drive_type: "4X2",
  specifications: "28 ESTRIAS",
  image_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  // TypeScript ERROR if schema adds required field
  ...overrides,
});

export const VehicleApplicationFactory = (
  overrides: Partial<VehicleApplication> = {}
): VehicleApplication => ({
  id: crypto.randomUUID(),
  part_id: crypto.randomUUID(),
  make: "ACURA",
  model: "MDX",
  year_range: "2007-2013",
  created_at: new Date().toISOString(),
  ...overrides,
});
```

### **Workflow for Schema Changes**:

1. **Update schema** in Supabase
2. **Run** `npx supabase gen types typescript --local > types/supabase.ts`
3. **Tests fail** with TypeScript errors in factories
4. **Update factories** to include new fields
5. **Add tests** for new functionality
6. **Deploy changes**

## 🔧 Test Setup & Configuration

### **Jest Configuration** (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/components/ui/**", // Skip shadcn/ui components
  ],
  coverageThreshold: {
    global: {
      functions: 80, // Higher for business logic
      lines: 70,
      branches: 60,
    },
  },
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### **Test Environment** (`jest.setup.js`)

```javascript
import "@testing-library/jest-dom";

// Mock Supabase for tests
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";

// Global test utilities
global.testPart = PartFactory();
global.testVehicleApp = VehicleApplicationFactory();
```

## 🚀 Test Execution Strategy

### **Development Workflow**

```bash
# Run tests for current feature
npm test -- --testPathPattern=excel

# Run tests with coverage (pre-commit)
npm run test:coverage

# Run specific business logic tests
npm test -- search vehicle excel

# Full test suite (CI/CD)
npm run test:ci
```

### **Database Testing (Supabase Local)**

```bash
# Start local Supabase for testing
npx supabase start

# Run tests against local database
npm test -- --testPathPattern=database

# Reset test database
npx supabase db reset --local
```

## 📊 Core Business Logic Tests

### **Excel Parsing Tests** (Highest Priority)

```typescript
// lib/excel/__tests__/parser.test.ts

describe("Excel Parser", () => {
  it("should parse valid Excel file with all columns", async () => {
    const mockExcelData = [
      [
        10,
        "ACR512342",
        null,
        "TM512342",
        "MAZA",
        "TRASERA",
        "C/ABS",
        5,
        "4X2",
        "28 ESTRIAS",
        "ACURA",
        "MDX",
        "2007-2013",
        "https://image.url",
      ],
    ];

    const result = await ExcelParser.parseExcelFile(mockExcelBuffer);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].acr_sku).toBe("ACR512342");
    expect(result.data[0].competitor_sku).toBe("TM512342");
  });

  it("should reject Excel with missing required fields", async () => {
    const invalidData = [
      [10, "", null, "TM512342", "", "", "", "", "", "", "", "", "", ""], // Missing ACR SKU and part type
    ];

    const result = await ExcelParser.parseExcelFile(mockExcelBuffer);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("ACR SKU is required");
  });

  it("should handle 2336 rows without performance issues", async () => {
    const largeDataSet = Array(2336).fill(validRowData);

    const startTime = Date.now();
    const result = await ExcelParser.parseExcelFile(largeExcelBuffer);
    const endTime = Date.now();

    expect(result.success).toBe(true);
    expect(endTime - startTime).toBeLessThan(5000); // Under 5 seconds
  });
});
```

### **Cross-Reference Search Tests** (Business Critical)

```typescript
// lib/search/__tests__/sku-search.test.ts

describe("SKU Cross-Reference Search", () => {
  beforeEach(async () => {
    // Set up test data
    await createTestPart({
      acr_sku: "ACR512342",
      competitor_sku: "TM512342",
      part_type: "MAZA",
    });
  });

  it("should find ACR part when searching competitor SKU", async () => {
    const result = await searchBySKU("TM512342");

    expect(result).toHaveLength(1);
    expect(result[0].acr_sku).toBe("ACR512342");
    expect(result[0].match_type).toBe("cross_reference");
  });

  it("should find ACR part when searching ACR SKU", async () => {
    const result = await searchBySKU("ACR512342");

    expect(result).toHaveLength(1);
    expect(result[0].acr_sku).toBe("ACR512342");
    expect(result[0].match_type).toBe("exact_acr");
  });

  it("should handle typos with fuzzy matching", async () => {
    const result = await searchBySKU("ACR51234"); // Missing last digit

    expect(result).toHaveLength(1);
    expect(result[0].acr_sku).toBe("ACR512342");
    expect(result[0].match_type).toBe("fuzzy");
  });

  it("should return empty array for invalid SKUs", async () => {
    const result = await searchBySKU("INVALID123");

    expect(result).toHaveLength(0);
  });
});
```

### **Vehicle Search Tests** (Core Feature)

```typescript
// lib/search/__tests__/vehicle-search.test.ts

describe("Vehicle Search", () => {
  beforeEach(async () => {
    const part = await createTestPart({ part_type: "MAZA" });
    await createTestVehicleApplication({
      part_id: part.id,
      make: "ACURA",
      model: "MDX",
      year_range: "2007-2013",
    });
  });

  it("should find parts for specific vehicle", async () => {
    const result = await searchByVehicle("ACURA", "MDX", "2007-2013");

    expect(result).toHaveLength(1);
    expect(result[0].part_type).toBe("MAZA");
  });

  it("should filter by part type", async () => {
    await createTestPart({ part_type: "BALERO" }); // Different part type

    const result = await searchByVehicle("ACURA", "MDX", "2007-2013", "MAZA");

    expect(result).toHaveLength(1);
    expect(result[0].part_type).toBe("MAZA");
  });

  it("should return empty for non-existent vehicle", async () => {
    const result = await searchByVehicle("NONEXISTENT", "MODEL", "2020");

    expect(result).toHaveLength(0);
  });
});
```

## 📈 Testing Metrics & Goals

### **Coverage Targets** (Business-Focused)

- **Excel parsing**: 95%+ (business critical)
- **Search functions**: 90%+ (core user value)
- **Database operations**: 80%+ (data integrity)
- **API routes**: 70%+ (integration points)
- **UI components**: 50%+ (basic functionality only)

### **Performance Benchmarks**

```typescript
// Performance tests for core functions
it("should parse 2336 Excel rows under 5 seconds", () => {
  // Test actual file size
});

it("should return search results under 300ms", async () => {
  const startTime = Date.now();
  await searchBySKU("ACR512342");
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(300);
});
```

## 🛡️ Critical Test Cases (Never Skip)

### **Data Integrity**

```typescript
// Excel parsing accuracy
it("should preserve all data during Excel import");
it("should reject incomplete or corrupted data");
it("should maintain part-vehicle relationships");

// Cross-reference accuracy
it("should correctly map competitor SKUs to ACR parts");
it("should handle multiple cross-references per part");
it("should prevent duplicate cross-references");

// Search accuracy
it("should return exact matches before fuzzy matches");
it("should never return parts for wrong vehicles");
it("should handle case-insensitive searches");
```

### **Error Handling**

```typescript
// Excel import errors
it("should block import when any validation errors exist");
it("should provide clear error messages for bad data");
it("should handle malformed Excel files gracefully");

// Search errors
it("should handle empty search queries");
it("should return appropriate messages for no results");
it("should handle database connection errors");
```

## 🔄 Test Maintenance Strategy

### **When to Update Tests**

- ✅ **Schema changes** - Always update type-safe factories
- ✅ **Business logic changes** - Update search and parsing tests
- ✅ **API changes** - Update contract tests
- ❌ **UI tweaks** - Don't test unless core workflow breaks
- ❌ **Performance optimizations** - Don't test implementation details

### **When to Delete Tests**

- 🗑️ **Feature removed** - Delete related tests
- 🗑️ **Business logic changed** - Rewrite completely
- 🗑️ **Test becomes flaky** - Fix root cause or delete

### **Red Flags** (Time to Simplify)

- 🚩 Tests take >30s to run locally
- 🚩 Tests fail due to environment issues
- 🚩 More test code than business logic
- 🚩 Tests require complex mocking to work

## 🎬 Testing Implementation Phases

### **Phase 1: Foundation Testing** (Week 1)

- [x] Jest + React Testing Library setup
- [x] Type-safe test factories for schema protection
- [ ] Excel parser tests (data integrity focus)
- [ ] Database operation tests (relationship integrity)

### **Phase 2: Business Logic Testing** (Week 2)

- [ ] SKU cross-reference search tests
- [ ] Vehicle search functionality tests
- [ ] Search performance benchmarks
- [ ] API endpoint contract tests

### **Phase 3: Integration Testing** (Week 3)

- [ ] End-to-end Excel upload workflow
- [ ] Search accuracy validation with real data
- [ ] Admin image upload tests
- [ ] Production deployment validation

## 🚨 TypeScript Testing Requirements

### **ALWAYS Run Both Tests AND TypeScript Checking**

```bash
# Critical workflow - both must pass
npm run type-check && npm test

# Pre-commit verification
npm run test:full  # Combines type-check + test
```

### **Type Safety in Tests**

```typescript
// ✅ GOOD: Properly typed test data
const testPart: Part = PartFactory({
  acr_sku: "ACR512342",
  competitor_sku: "TM512342",
});

// ❌ BAD: Untyped test data
const testPart = {
  acr_sku: "ACR512342",
  // Missing required fields - will break at runtime
};
```

---

## 💡 Key Testing Principles for ACR Automotive

1. **Test business value, not implementation** - Focus on what matters to Humberto's customers
2. **Excel data accuracy is paramount** - Any parsing errors directly impact business
3. **Cross-reference integrity is critical** - Wrong part recommendations hurt credibility
4. **Search performance matters** - Counter staff need fast results
5. **Type safety prevents regression** - Schema changes must break tests appropriately
6. **Keep tests simple and fast** - Easy to run, easy to maintain

**Remember**: We're testing an auto parts catalog, not a complex SaaS. Focus on data accuracy, search reliability, and user workflow success.

---

## 📋 Testing Task Checklist

### **Current Testing Status** (Week 1)

- [ ] **Jest configuration** - Set up with proper TypeScript and Supabase mocking
- [ ] **Type-safe factories** - Create factories for parts, vehicle_applications, cross_references
- [ ] **Excel parser tests** - Test parsing accuracy, validation, error handling
- [ ] **Database operation tests** - Test CRUD operations and relationships
- [ ] **Search function tests** - Test SKU and vehicle search logic

### **Testing Workflow**

- [ ] Write test first (TDD for business logic)
- [ ] Implement feature
- [ ] `npm run type-check` passes ✅
- [ ] `npm test` passes ✅
- [ ] Commit code

**When in doubt**: If it handles parts data, cross-references, or search results - test it. Everything else can wait.

---

_This testing strategy focuses on the core business value of ACR Automotive: accurate parts data and reliable cross-reference search functionality._
