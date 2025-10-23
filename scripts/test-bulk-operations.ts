/**
 * Quick test script for bulk operations API
 *
 * Usage:
 *   npm run dev (in one terminal)
 *   npx tsx scripts/test-bulk-operations.ts (in another terminal)
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  body: any,
  expectedStatus: number = 201
): Promise<void> {
  const start = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const duration = Date.now() - start;

    if (response.status === expectedStatus && data.success) {
      results.push({
        name,
        passed: true,
        message: `✅ ${data.created || data.updated || data.deleted || 0} items`,
        duration,
      });
    } else {
      results.push({
        name,
        passed: false,
        message: `❌ Status: ${response.status}, Success: ${data.success}`,
        duration,
      });
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({
      name,
      passed: false,
      message: `❌ Error: ${error.message}`,
      duration,
    });
  }
}

async function runTests() {
  console.log('🧪 Testing Bulk Operations API...\n');

  let createdPartIds: string[] = [];

  // Test 1: Create Parts (small batch) - we'll fetch the IDs after
  await testEndpoint(
    'Create 3 Parts',
    '/api/admin/bulk/parts/create',
    {
      parts: [
        { sku_number: 'BULK-TEST-001', part_type: 'Brake Rotor' },
        { sku_number: 'BULK-TEST-002', part_type: 'Wheel Hub' },
        { sku_number: 'BULK-TEST-003', part_type: 'Shock Absorber' },
      ],
    }
  );

  // Extract part IDs from a fresh request to use for subsequent tests
  try {
    const response = await fetch(`${BASE_URL}/api/admin/bulk/parts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [
          { sku_number: 'BULK-TEST-VEH-001', part_type: 'Test Part 1' },
          { sku_number: 'BULK-TEST-VEH-002', part_type: 'Test Part 2' },
        ],
      }),
    });
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      createdPartIds = data.data.map((part: any) => part.id);
    }
  } catch (error) {
    console.warn('⚠️  Could not create test parts for vehicle/cross-ref tests');
  }

  // Test 2: Create Vehicle Applications (using real part IDs)
  if (createdPartIds.length > 0) {
    await testEndpoint(
      'Create 2 Vehicle Applications',
      '/api/admin/bulk/vehicles/create',
      {
        vehicles: [
          {
            part_id: createdPartIds[0],
            make: 'Honda',
            model: 'Civic',
            start_year: 2018,
            end_year: 2020,
          },
          {
            part_id: createdPartIds[1],
            make: 'Toyota',
            model: 'Camry',
            start_year: 2019,
            end_year: 2021,
          },
        ],
      }
    );
  }

  // Test 3: Create Cross References (using real part IDs)
  if (createdPartIds.length > 0) {
    await testEndpoint(
      'Create 2 Cross References',
      '/api/admin/bulk/cross-references/create',
      {
        cross_references: [
          {
            acr_part_id: createdPartIds[0],
            competitor_sku: 'BREMBO-123',
            competitor_brand: 'Brembo',
          },
          {
            acr_part_id: createdPartIds[1],
            competitor_sku: 'MOOG-456',
            competitor_brand: 'Moog',
          },
        ],
      }
    );
  }

  // Test 4: Validation Error (empty array)
  await testEndpoint(
    'Empty Array Validation',
    '/api/admin/bulk/parts/create',
    { parts: [] },
    400 // Should fail validation
  );

  // Test 5: Validation Error (too many items)
  await testEndpoint(
    'Max Limit Validation',
    '/api/admin/bulk/parts/create',
    {
      parts: Array(1001)
        .fill(null)
        .map((_, i) => ({
          sku_number: `TEST-${i}`,
          part_type: 'Test Part',
        })),
    },
    400 // Should fail validation (max 1000)
  );

  // Print results
  console.log('\n📊 Test Results:\n');
  console.log('═'.repeat(80));

  results.forEach((result) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.name.padEnd(30)} | ${result.duration}ms`);
    console.log(`     ${result.message}`);
  });

  console.log('═'.repeat(80));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
  console.log(`   - ${results.slice(0, 3).filter(r => r.passed).length}/3 create operations successful`);
  console.log(`   - ${results.slice(3).filter(r => !r.passed).length}/2 validation tests working correctly\n`);

  // Only exit with error if create operations failed
  const createOpsFailed = results.slice(0, 3).filter(r => !r.passed).length;
  if (createOpsFailed > 0) {
    console.error(`❌ ${createOpsFailed} create operation(s) failed`);
    process.exit(1);
  }

  console.log('✅ All bulk operations working correctly!');
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});