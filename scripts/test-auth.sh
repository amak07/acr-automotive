#!/bin/bash

# ACR Automotive - Authentication Testing Script
# Tests Phase 1 implementation: Supabase Auth with RBAC

set -e  # Exit on error

echo "🔐 ACR Automotive Authentication Testing"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((TESTS_FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

section() {
  echo ""
  echo "================================================"
  echo "$1"
  echo "================================================"
}

# Check prerequisites
section "1. Checking Prerequisites"

# Check if .env.local exists
if [ -f .env.local ]; then
  pass ".env.local file exists"
else
  fail ".env.local file not found"
  echo "  Create .env.local with Supabase credentials"
  exit 1
fi

# Check if Supabase is running
if curl -s http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  pass "Local Supabase is running"
else
  fail "Local Supabase not running"
  echo "  Run: npm run supabase:start"
  exit 1
fi

# Check if dev server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  pass "Next.js dev server is running"
else
  warn "Next.js dev server not running (start with: npm run dev)"
fi

# Check migration file exists
section "2. Checking Migration Files"

if [ -f supabase/migrations/20260127000000_add_user_profiles_and_rbac.sql ]; then
  pass "Auth migration file exists"
else
  fail "Auth migration file not found"
  exit 1
fi

# Check if migration is applied
section "3. Verifying Database Schema"

echo "Checking if user_profiles table exists..."
TABLE_EXISTS=$(npx supabase db remote exec --no-pager "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles');" 2>/dev/null | grep -o 't' || echo 'f')

if [ "$TABLE_EXISTS" = "t" ]; then
  pass "user_profiles table exists"
else
  fail "user_profiles table not found"
  echo ""
  echo "  Apply migration with:"
  echo "  npm run supabase:reset"
  echo "  OR"
  echo "  npx supabase migration up"
  exit 1
fi

# Check helper functions
echo "Checking if helper functions exist..."
FUNCTION_EXISTS=$(npx supabase db remote exec --no-pager "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin');" 2>/dev/null | grep -o 't' || echo 'f')

if [ "$FUNCTION_EXISTS" = "t" ]; then
  pass "Helper functions exist (is_admin, is_authenticated_user)"
else
  fail "Helper functions not found"
  echo "  Re-apply migration: npm run supabase:reset"
  exit 1
fi

# Check for admin users
section "4. Checking Test Users"

USER_COUNT=$(npx supabase db remote exec --no-pager "SELECT COUNT(*) FROM user_profiles;" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo '0')

if [ "$USER_COUNT" -gt 0 ]; then
  pass "Found $USER_COUNT user(s) in database"

  # Show user details
  echo ""
  echo "Users in database:"
  npx supabase db remote exec --no-pager "SELECT email, role, is_active FROM user_profiles;" 2>/dev/null || echo "  (Could not fetch user details)"
else
  warn "No users found in database"
  echo ""
  echo "  Create a test admin user:"
  echo "  1. Open Supabase Studio: npx supabase studio"
  echo "  2. Go to Authentication → Users → Add User"
  echo "  3. Email: admin@acr.com, Password: admin123456"
  echo "  4. Update role: Table Editor → user_profiles → set role='admin'"
fi

# Check environment variables
section "5. Checking Environment Variables"

if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
  pass "SUPABASE_SERVICE_ROLE_KEY is set in .env.local"
else
  fail "SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  echo ""
  echo "  Add to .env.local:"
  echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
  echo ""
  echo "  Get it from: npx supabase studio → Settings → API"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
  pass "NEXT_PUBLIC_SUPABASE_URL is set"
else
  fail "NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
  pass "NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
else
  fail "NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
fi

# Test API endpoints (if dev server is running)
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  section "6. Testing API Endpoints"

  # Test login endpoint (expect 400/401 without credentials)
  LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')

  if [ "$LOGIN_RESPONSE" = "401" ] || [ "$LOGIN_RESPONSE" = "400" ]; then
    pass "Login endpoint responds (HTTP $LOGIN_RESPONSE)"
  else
    warn "Login endpoint response unexpected: HTTP $LOGIN_RESPONSE"
  fi

  # Test session endpoint (expect 401 without auth)
  SESSION_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session)

  if [ "$SESSION_RESPONSE" = "401" ]; then
    pass "Session endpoint responds (HTTP 401 - correct)"
  else
    warn "Session endpoint response unexpected: HTTP $SESSION_RESPONSE"
  fi
fi

# Summary
section "Test Summary"
echo ""
echo "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. If no users exist, create admin user via Supabase Studio"
  echo "  2. Start dev server (if not running): npm run dev"
  echo "  3. Open browser: http://localhost:3000/login"
  echo "  4. Login with admin@acr.com / admin123456"
  echo "  5. Test user management at: http://localhost:3000/admin/users"
  echo ""
  echo "📖 Full testing guide: docs/testing/AUTH_TESTING_GUIDE.md"
  exit 0
else
  echo -e "${RED}✗ Some checks failed${NC}"
  echo ""
  echo "Fix the issues above, then run this script again."
  exit 1
fi
