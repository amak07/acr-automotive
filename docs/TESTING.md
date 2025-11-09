# Testing Guide

## Running Tests

```bash
npm test
```

That's it. This automatically:
1. ✅ Starts local Docker Postgres (if not running)
2. ✅ Resets database to clean state
3. ✅ Runs migrations and seeds realistic test data (865 parts from production-like snapshot)
4. ✅ Executes all tests (type-check, unit, integration)
5. ✅ Generates clear Pass/Fail report

**Example Output:**
```
🧪 ACR AUTOMOTIVE TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Preparing test environment...
🐳 Checking Docker container...
   ✅ Container started and healthy
📦 Running migrations...
   ✅ Applied 009_add_sku_normalization.sql
🌱 Seeding test data...
   ✅ Seeded 865 parts (realistic snapshot from remote Test DB)

📝 TypeScript Validation...
🧩 Unit Tests...
🔗 Integration Tests...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL TESTS PASSED

Import Service:        ✅ PASS
Export Service:        ✅ PASS (covered in unit tests)
Validation Engine:     ✅ PASS
Atomic Transactions:   ✅ PASS

Total: 6/6 test suites passed (28.3s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Manual Database Management

If you need to manage the test database manually:

```bash
# Start test database
npm run db:test:start

# Reset to clean state
npm run db:test:reset

# Stop database
npm run db:test:stop
```

## Architecture

### Automated Tests (`npm test`)
- **Database:** Local Docker Postgres (localhost:5433)
- **Speed:** Fast, no network latency
- **Isolation:** Your remote Supabase is never touched
- **Offline:** Works without internet

### Local Development (`npm run dev`)
- **Database:** Remote Supabase (.env.local)
- **Features:** Full Auth, RLS, Storage
- **Use for:** Manual testing and development

## Prerequisites

- **Docker Desktop** must be installed and running
- That's it!

## Troubleshooting

### "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop application

### Tests failing with connection errors
**Solution:**
```bash
npm run db:test:start  # Ensure database is running
npm test               # Try again
```

### Database state is messy
**Solution:**
```bash
npm run db:test:reset  # Reset to clean state
npm test               # Tests will pass with fresh data
```

## What Gets Tested

| Test Suite | What It Tests | Duration |
|------------|---------------|----------|
| Type Check | TypeScript validation | ~2s |
| Jest Unit Tests | Business logic (DiffEngine, ValidationEngine, etc.) | ~8s |
| Fixture Validation | All error codes E1-E20, W1-W10 | ~3s |
| Import Pipeline | Full import workflow + rollback | ~7s |
| Atomic Tests | Transaction isolation + constraints | ~4s |
| **Public Search RPC** | **Vehicle search, SKU normalization, performance** | **~3s** |
| **Public Search API** | **Image enrichment, pagination, validation** | **~1s** |

**Total:** ~30 seconds for complete test suite

### Test Coverage Breakdown

**Core Business Logic** (73 tests):
- ValidationEngine: 13 tests
- DiffEngine: 30+ tests
- ExcelExportService: 30+ tests

**UI Components** (123 tests):
- Import Wizard: 31 tests
- Upload Step: 36 tests
- Validation Step: 56 tests

**Public Search** (35 tests):
- RPC Functions: 25 tests (vehicle search, SKU normalization, performance)
- API Layer: 10 tests (enrichment, pagination, validation)

**Integration Tests**:
- Full import pipeline
- Atomic transaction tests
- Database constraint tests

**Total Test Count:** ~235 tests

## Development Workflow

### Daily Development
```bash
# Morning: Ensure Docker is running
npm run db:test:start  # Optional - test runner starts it automatically

# Work on features
npm run dev  # Uses remote Supabase

# Before commits
npm test     # Run full test suite
```

### When You Make Changes

**Schema changes** (schema.sql or migrations):
```bash
npm run db:test:reset  # Apply new schema
npm test               # Verify tests pass
```

**Seed data changes** (fixtures/seed-data.sql):
```bash
npm run db:test:reset  # Load new seed data
npm test               # Verify tests pass
```

**Need to refresh seed data from remote Test DB?**
```bash
npm run db:export-snapshot  # Export realistic subset from remote
# This updates fixtures/seed-data.sql with latest data
npm run db:test:reset       # Load fresh seed
npm test                    # Verify all tests pass
```

## Advanced Testing

### API Route Testing (Excluded from npm test)

API route tests require a running dev server and are NOT included in `npm test` (which uses local Docker DB). To test API endpoints:

```bash
# Terminal 1: Start dev server with remote Supabase
npm run dev

# Terminal 2: Run API tests manually
tsx scripts/test/test-api-import-routes.ts
tsx scripts/test/test-bulk-operations.ts
tsx scripts/test/test-export-api.ts
```

**Why excluded?** API tests require:
- Next.js dev server running
- HTTP endpoints accessible
- Remote Supabase authentication

Local Docker testing focuses on:
- ✅ Direct service testing (faster, more reliable)
- ✅ Database operations
- ✅ Business logic validation

### Regenerating Test Data

```bash
# Generate baseline export from seeded database
npm run test:generate-baseline

# Export fresh seed data from remote Test DB
npm run db:export-snapshot
```

## Testing Philosophy

### Snapshot-Based Testing
We use snapshot-based test data restoration for speed and consistency:
- **Golden baseline:** 865 parts exported from production
- **Fast resets:** ~2s to restore database state between test runs
- **Reproducible:** Same data every test run, no flakiness

### Fixture-Driven Validation
All validation rules are tested via Excel fixtures:
- **Error fixtures:** Test each error code (E2-E8) with specific scenarios
- **Warning fixtures:** Test each warning code (W1-W10) with data changes
- **Happy path fixtures:** Valid data scenarios for positive testing

### Service-Layer Focus
Tests target business logic directly for speed and reliability:
- ✅ **ValidationEngine, DiffEngine, ImportService** - Core business logic
- ✅ **Database operations** - Direct Supabase client calls
- ✅ **Excel parsing/export** - File format validation
- ⚠️ **API routes** - Require manual testing (dev server dependency)

### One Command Philosophy
**`npm test` does everything:**
- No need to remember multiple test scripts
- Automatic database lifecycle management
- Clear Pass/Fail reporting by service
- Simpler mental model for developers and AI coding agents

---

## Testing Tech Stack

### Test Framework & Tooling
- **Jest** - Unit test runner with built-in coverage reporting
- **@testing-library/react** - UI component testing with accessibility best practices
- **@testing-library/jest-dom** - Enhanced DOM assertions
- **@testing-library/user-event** - User interaction simulation

### Database & Infrastructure
- **Docker Postgres 15** - Local test database (isolated from production)
- **pg** - PostgreSQL client for migrations and seeding
- **Supabase client** - Integration tests using direct database access

### Data & Fixtures
- **ExcelJS** - Generate test fixtures programmatically
- **fixture-loader** - Load Excel fixtures as File objects for parsing tests
- **seedDbState()** - Mock database state for validation tests (no DB required)

### Code Coverage
- **Jest built-in coverage** - `--coverage` flag enabled
- **Target:** >80% coverage for business logic (ValidationEngine, DiffEngine)
- See [UNIT_TEST_COVERAGE.md](./testing/UNIT_TEST_COVERAGE.md) for detailed metrics

---

## Known Limitations

### 1. API Route Tests Not Included in `npm test`
API tests (`test-api-*.ts`) are excluded from the automated test suite because they require:
- ✗ Next.js dev server running (`npm run dev`)
- ✗ HTTP endpoints accessible at localhost:3000
- ✗ Remote Supabase authentication

**Workaround:** Run API tests manually when needed:
```bash
# Terminal 1
npm run dev

# Terminal 2
tsx scripts/test/test-api-import-routes.ts
tsx scripts/test/test-bulk-operations.ts
tsx scripts/test/test-export-api.ts
```

### 2. Docker Required for Local Testing
All automated tests use local Docker Postgres for speed and isolation:
- ✅ **Pros:** Fast, consistent, offline testing
- ✅ **Pros:** No network latency, no Supabase rate limits
- ❌ **Cons:** Requires Docker Desktop installed and running
- ❌ **Cons:** Won't work in CI/CD environments without Docker support (e.g., Vercel builds)

**Solution for CI/CD:** Use GitHub Actions (supports Docker) - see Future Enhancements below.

### 3. UI Component Tests Use Mocked i18n
UI component tests mock the `useLocale` hook to return translation keys directly:
```typescript
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}));
```
This means tests verify translation **keys** are used, not actual translated text.

### 4. Manual Testing Still Required
Automated tests cover core business logic, but manual testing is needed for:
- End-to-end user workflows (see [UX_TESTING_GUIDE.md](./testing/UX_TESTING_GUIDE.md))
- Visual design and responsive behavior
- Browser compatibility across Chrome/Firefox/Safari
- Accessibility with screen readers

---

## Future Enhancements

### CI/CD Integration
**Current Status:** Tests run locally only (Docker required)

**Planned Improvement:**
- **GitHub Actions workflow** - Run full test suite on push/PR
  - Use GitHub-hosted runners with Docker support
  - Automatic test result comments on pull requests
  - Block merges if tests fail
- **Vercel build integration** - Type checking only (no Docker in Vercel)
  - Run `tsc --noEmit` during Vercel builds
  - Ensure TypeScript errors block deployments
- **Test result reporting** - Save coverage reports as artifacts

**Estimated Effort:** 4-6 hours
**Priority:** Medium
**Blocker:** None - can implement anytime

### Additional Test Coverage
**Planned Additions:**
- **API endpoint integration tests** - Eliminate manual API testing
  - Mock Next.js server environment
  - Test all API routes automatically
- **End-to-end browser tests** - Playwright or Cypress
  - Test complete user workflows in real browser
  - Visual regression testing
- **Performance testing** - Benchmark import/export with large datasets
  - 10,000+ parts import time tracking
  - Memory usage profiling

**Estimated Effort:** 12-16 hours
**Priority:** Low
**Blocker:** Manual testing currently sufficient

### Test Infrastructure Improvements
- **Parallel test execution** - Speed up test suite (currently ~28s)
- **Watch mode improvements** - Better developer experience
- **Test data versioning** - Track golden baseline changes over time

---

## More Documentation

- **[LOCAL_DATABASE_SETUP.md](./testing/LOCAL_DATABASE_SETUP.md)** - Detailed Docker database documentation
- **[UNIT_TEST_COVERAGE.md](./testing/UNIT_TEST_COVERAGE.md)** - Test coverage metrics
- **[UX_TESTING_GUIDE.md](./testing/UX_TESTING_GUIDE.md)** - Manual UI testing procedures
- **[TEST_DATA_MANAGEMENT.md](./testing/TEST_DATA_MANAGEMENT.md)** - Fixture management and generation
- **[TESTING_GUIDE.md](./testing/TESTING_GUIDE.md)** - Quick reference for test commands

---

**Questions?** See [LOCAL_DATABASE_SETUP.md](./testing/LOCAL_DATABASE_SETUP.md) for troubleshooting or [PLANNING.md](./PLANNING.md) for architecture details.
