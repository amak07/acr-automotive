/**
 * Test API Routes: Import & Rollback Endpoints
 *
 * Tests all 6 API endpoints:
 * - POST /api/admin/import/validate
 * - POST /api/admin/import/preview
 * - POST /api/admin/import/execute
 * - GET  /api/admin/import/history
 * - GET  /api/admin/rollback/available
 * - POST /api/admin/rollback/execute
 *
 * Prerequisites:
 * - Dev server running: npm run dev
 * - Migration 008 applied to test database
 *
 * Usage:
 *   npm run test:api:import
 */

import * as path from "path";
import * as fs from "fs";

const API_BASE = "http://localhost:3000";
const FIXTURE_PATH = path.join(process.cwd(), "tests", "fixtures", "excel");

// Helper to create FormData for file upload
async function uploadFixture(endpoint: string, filename: string) {
  const filePath = path.join(FIXTURE_PATH, filename);
  const fileBuffer = fs.readFileSync(filePath);
  const file = new File([fileBuffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  return {
    status: response.status,
    data: await response.json(),
  };
}

// Helper for JSON POST requests
async function postJSON(endpoint: string, body: any) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    data: await response.json(),
  };
}

// Helper for GET requests
async function get(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`);

  return {
    status: response.status,
    data: await response.json(),
  };
}

// =====================================================
// Tests
// =====================================================

async function runTests() {
  console.log("🧪 Testing API Routes: Import & Rollback\n");
  console.log("=".repeat(70));
  console.log("");
  console.log("⚠️  Prerequisites:");
  console.log("   1. Dev server running (npm run dev)");
  console.log("   2. Migration 008 applied");
  console.log("");
  console.log("=".repeat(70));
  console.log("");

  let importId: string | undefined;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // TEST 1: Validate Endpoint (Valid File)
    console.log("📝 Test 1: POST /api/admin/import/validate (valid file)\n");
    try {
      const result = await uploadFixture(
        "/api/admin/import/validate",
        "valid-add-new-parts.xlsx"
      );

      if (result.status === 200 && result.data.valid === true) {
        console.log("   ✅ PASS: Valid file accepted");
        console.log(`   Parsed: ${result.data.parsed.parts} parts`);
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Unexpected response");
        console.log(`   Status: ${result.status}`);
        console.log(`   Data:`, result.data);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 2: Validate Endpoint (Invalid File)
    console.log("📝 Test 2: POST /api/admin/import/validate (invalid file)\n");
    try {
      const result = await uploadFixture(
        "/api/admin/import/validate",
        "error-duplicate-skus.xlsx"
      );

      if (result.status === 200 && result.data.valid === false) {
        console.log("   ✅ PASS: Invalid file rejected");
        console.log(`   Errors: ${result.data.errors.length}`);
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Should have caught validation errors");
        console.log(`   Valid: ${result.data.valid}`);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 3: Preview Endpoint
    console.log("📝 Test 3: POST /api/admin/import/preview\n");
    try {
      const result = await uploadFixture(
        "/api/admin/import/preview",
        "valid-add-new-parts.xlsx"
      );

      if (result.status === 200 && result.data.diff) {
        console.log("   ✅ PASS: Preview generated");
        console.log(`   Changes: ${result.data.diff.summary.totalChanges}`);
        console.log(
          `   Parts to add: ${result.data.diff.parts.summary.totalAdds}`
        );
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Unexpected response");
        console.log(`   Status: ${result.status}`);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 4: Execute Endpoint
    console.log("📝 Test 4: POST /api/admin/import/execute\n");
    try {
      const result = await uploadFixture(
        "/api/admin/import/execute",
        "valid-add-new-parts.xlsx"
      );

      if (result.status === 200 && result.data.importId) {
        importId = result.data.importId;
        console.log("   ✅ PASS: Import executed");
        console.log(`   Import ID: ${importId}`);
        console.log(`   Changes: ${result.data.summary.totalChanges}`);
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Unexpected response");
        console.log(`   Status: ${result.status}`);
        console.log(`   Data:`, result.data);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 5: History Endpoint
    console.log("📝 Test 5: GET /api/admin/import/history\n");
    try {
      const result = await get("/api/admin/import/history");

      if (result.status === 200 && Array.isArray(result.data)) {
        console.log("   ✅ PASS: History retrieved");
        console.log(`   Records: ${result.data.length}`);
        if (importId) {
          const found = result.data.find((r: any) => r.id === importId);
          if (found) {
            console.log(`   Found our import: ${found.file_name}`);
          }
        }
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Unexpected response");
        console.log(`   Status: ${result.status}`);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 6: Rollback Available Endpoint
    console.log("📝 Test 6: GET /api/admin/rollback/available\n");
    try {
      const result = await get("/api/admin/rollback/available");

      if (result.status === 200 && Array.isArray(result.data)) {
        console.log("   ✅ PASS: Available rollbacks retrieved");
        console.log(`   Available: ${result.data.length}`);
        testsPassed++;
      } else {
        console.log("   ❌ FAIL: Unexpected response");
        console.log(`   Status: ${result.status}`);
        testsFailed++;
      }
    } catch (error: any) {
      console.log("   ❌ FAIL: Request error");
      console.log(`   Error: ${error.message}`);
      testsFailed++;
    }
    console.log("");

    // TEST 7: Rollback Execute Endpoint
    if (importId) {
      console.log("📝 Test 7: POST /api/admin/rollback/execute\n");
      try {
        const result = await postJSON("/api/admin/rollback/execute", {
          importId,
        });

        if (result.status === 200 && result.data.success) {
          console.log("   ✅ PASS: Rollback executed");
          console.log(`   Restored: ${result.data.restoredCounts.parts} parts`);
          testsPassed++;
        } else {
          console.log("   ❌ FAIL: Unexpected response");
          console.log(`   Status: ${result.status}`);
          console.log(`   Data:`, result.data);
          testsFailed++;
        }
      } catch (error: any) {
        console.log("   ❌ FAIL: Request error");
        console.log(`   Error: ${error.message}`);
        testsFailed++;
      }
      console.log("");
    } else {
      console.log("📝 Test 7: POST /api/admin/rollback/execute\n");
      console.log("   ⏭️  SKIP: No import ID (execute test failed)");
      console.log("");
    }

    // Summary
    console.log("=".repeat(70));
    console.log("📊 Test Summary\n");
    console.log(`   Total Tests: ${testsPassed + testsFailed}`);
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log("");

    if (testsFailed === 0) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log("=".repeat(70));
      console.log("");
      process.exit(0);
    } else {
      console.log("⚠️  SOME TESTS FAILED");
      console.log("=".repeat(70));
      console.log("");
      process.exit(1);
    }
  } catch (error: any) {
    console.log("");
    console.log("💥 TEST ERROR:");
    console.log(error);
    console.log("");
    process.exit(1);
  }
}

runTests();
