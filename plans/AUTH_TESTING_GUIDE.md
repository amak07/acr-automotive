# Authentication Implementation Testing Guide

**Phase 1 Implementation Testing**: Supabase Auth with 2-Role RBAC

---

## Prerequisites

1. **Local Supabase running**: `npm run supabase:start`
2. **Environment variables set**: `.env.local` with Supabase credentials
3. **Database is clean**: Fresh `supabase:reset` or known good state

---

## Step 1: Apply Database Migration

### 1.1 Check Current Migrations

```bash
# See what migrations exist
ls supabase/migrations/

# Expected: You should see 20260127000000_add_user_profiles_and_rbac.sql
```

### 1.2 Apply Migration to Local Database

```bash
# Reset database and apply all migrations
npm run supabase:reset

# OR apply just the new migration
npx supabase migration up
```

### 1.3 Verify Migration Applied

```bash
# Open Supabase Studio
npx supabase studio

# Navigate to Table Editor → Check for:
# - user_profiles table (with id, email, role, is_active columns)
# - user_role enum type (admin, data_manager)

# Navigate to SQL Editor → Run:
SELECT * FROM user_profiles;
# Should return empty (0 rows) initially
```

---

## Step 2: Add Required Environment Variable

Add to `.env.local`:

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NEW: Service role key (from Supabase Studio → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**How to get Service Role Key:**
1. Open Supabase Studio: `npx supabase studio`
2. Go to Settings → API
3. Copy the `service_role` key (secret key)
4. Paste into `.env.local`

**Restart dev server** after adding env variable:
```bash
npm run dev
```

---

## Step 3: Create First Admin User

### Option A: Via Supabase Studio (Recommended)

1. Open Supabase Studio: `npx supabase studio`
2. Go to **Authentication** → **Users**
3. Click **Add User**
4. Fill in:
   - Email: `admin@acr.com`
   - Password: `admin123456` (minimum 8 characters)
   - Auto Confirm User: **YES** ✅
5. Click **Create User**

6. **Update role to admin** (important!):
   - Go to **Table Editor** → `user_profiles`
   - Find the user you just created
   - Edit the row:
     - `role`: Change to `admin`
     - `full_name`: "System Administrator" (optional)
   - Save

### Option B: Via SQL (Alternative)

```sql
-- 1. Create auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
)
VALUES (
  gen_random_uuid(),
  'admin@acr.com',
  crypt('admin123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "System Administrator", "role": "admin"}'::jsonb
);

-- 2. Check user_profiles (should auto-create via trigger)
SELECT * FROM user_profiles WHERE email = 'admin@acr.com';

-- 3. Update role to admin (if not already)
UPDATE user_profiles
SET role = 'admin', full_name = 'System Administrator'
WHERE email = 'admin@acr.com';
```

---

## Step 4: Test Authentication Flow

### 4.1 Test Login Page

1. Open browser: `http://localhost:3000/login`
2. **Verify UI renders correctly:**
   - ✅ ACR logo displays
   - ✅ "Admin Access" heading
   - ✅ Email and Password fields
   - ✅ Show/hide password toggle
   - ✅ Red accent bar at top
   - ✅ Decorative background elements

3. **Test invalid login:**
   - Email: `wrong@email.com`
   - Password: `wrongpassword`
   - Click **Sign In**
   - ✅ Should show error: "Invalid login credentials" or similar

4. **Test valid login:**
   - Email: `admin@acr.com`
   - Password: `admin123456`
   - Click **Sign In**
   - ✅ Should redirect to `/admin` dashboard
   - ✅ Should see admin interface

### 4.2 Test Admin Dashboard Access

1. After login, verify you see:
   - ✅ AppHeader with "Admin" title
   - ✅ 3-dot menu in header
   - ✅ Admin dashboard content

2. **Test 3-dot menu** (click menu icon):
   - ✅ "Public Search" link
   - ✅ "Admin" link
   - ✅ "User Management" link (admin only)
   - ✅ "Settings" link (admin only)
   - ✅ "Documentation" link
   - ✅ "Logout" button (red/danger variant)

3. **Test navigation:**
   - Click "User Management"
   - ✅ Should navigate to `/admin/users`
   - ✅ Should see user list with the admin user you created

### 4.3 Test User Management

1. On `/admin/users` page, verify:
   - ✅ Header: "User Management"
   - ✅ Stats cards showing:
     - Active Admins: 1
     - Data Managers: 0
     - Inactive Users: 0
   - ✅ User list showing admin@acr.com with:
     - Purple "Admin" badge
     - Green "Active" badge
     - Email visible
     - Join date visible

2. **Test Invite User:**
   - Click **Invite User** button
   - ✅ Modal appears: "Invite New User"
   - Fill in:
     - Email: `manager@acr.com`
     - Full Name: "Test Manager"
     - Password: `manager123`
     - Role: Select **Data Manager** (should be default)
   - Click **Invite User**
   - ✅ Modal closes
   - ✅ User list refreshes
   - ✅ New user appears with blue "Data Manager" badge

3. **Test deactivate user** (optional):
   - Click **Deactivate** on the data manager user
   - ✅ Confirmation dialog appears
   - Confirm
   - ✅ User marked as inactive
   - ✅ Red "Inactive" badge appears

### 4.4 Test Data Manager Role

1. **Logout** (click 3-dot menu → Logout)
2. **Login as data manager:**
   - Email: `manager@acr.com`
   - Password: `manager123`
3. **Verify limited access:**
   - ✅ Can access `/admin` dashboard
   - Open 3-dot menu
   - ✅ **Should NOT see** "User Management"
   - ✅ **Should NOT see** "Settings"
   - ✅ Should see "Public Search", "Admin", "Documentation", "Logout"
4. **Test direct access blocked:**
   - Navigate to: `http://localhost:3000/admin/users`
   - ✅ Should redirect to `/admin` OR show "Access Denied" message
   - Navigate to: `http://localhost:3000/admin/settings`
   - ✅ Should redirect to `/admin` OR show "Access Denied" message

### 4.5 Test Logout

1. Click 3-dot menu → **Logout**
2. ✅ Should redirect to homepage `/`
3. Try to access: `http://localhost:3000/admin`
4. ✅ Should redirect to `/login?redirect=/admin`
5. Login again
6. ✅ Should redirect back to `/admin` (return URL works)

---

## Step 5: Test Database RLS Policies

### 5.1 Test Public Read Access (Unauthenticated)

1. Open new incognito window (or logout)
2. Navigate to homepage: `http://localhost:3000`
3. **Test public search:**
   - ✅ Should be able to search for parts
   - ✅ Results should display (public read access works)

### 5.2 Test Authenticated Write Access

Login as admin or data_manager, then test:

1. **Parts management:**
   - Navigate to `/admin` dashboard
   - ✅ Should see parts list
   - Try to edit a part (if UI exists)
   - ✅ Should work (authenticated write access)

2. **Settings access (admin-only):**
   - Login as **admin**
   - Navigate to `/admin/settings`
   - ✅ Should be able to modify settings
   - Logout, login as **data_manager**
   - Try to access `/admin/settings`
   - ✅ Should be blocked (no access)

---

## Step 6: Test API Routes Directly

### 6.1 Test Login Endpoint

```bash
# Test login with correct credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acr.com","password":"admin123456"}'

# Expected: 200 OK with user, profile, session data
```

### 6.2 Test Session Endpoint

```bash
# Get current session (requires auth cookie - use browser dev tools)
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: your-session-cookie"

# Expected: 200 OK with user and profile data
```

### 6.3 Test User Management (Admin Only)

```bash
# List users (requires admin auth)
curl -X GET http://localhost:3000/api/auth/users \
  -H "Cookie: admin-session-cookie"

# Expected: 200 OK with users array
```

---

## Step 7: Test Middleware Protection

### 7.1 Test Unauthenticated Access

1. **Logout completely**
2. Try to access these URLs directly:
   - `/admin` → ✅ Redirect to `/login?redirect=/admin`
   - `/admin/users` → ✅ Redirect to `/login?redirect=/admin/users`
   - `/admin/settings` → ✅ Redirect to `/login?redirect=/admin/settings`

### 7.2 Test Authenticated Access

1. **Login as admin**
2. Navigate to protected routes:
   - `/admin` → ✅ Allowed
   - `/admin/users` → ✅ Allowed (admin only)
   - `/admin/settings` → ✅ Allowed (admin only)

3. **Login as data_manager**
4. Navigate to protected routes:
   - `/admin` → ✅ Allowed
   - `/admin/users` → ❌ Blocked (redirect or access denied)
   - `/admin/settings` → ❌ Blocked (redirect or access denied)

---

## Test Checklist Summary

### ✅ Database
- [ ] Migration applied successfully
- [ ] `user_profiles` table exists
- [ ] Helper functions created (`is_admin()`, `is_authenticated_user()`)
- [ ] RLS policies updated on all tables

### ✅ Authentication
- [ ] Login page renders correctly
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Logout clears session and redirects
- [ ] Session persists across page reloads
- [ ] Redirect after login works (`?redirect` param)

### ✅ User Management
- [ ] User list displays correctly
- [ ] Stats cards show correct counts
- [ ] Invite user modal works
- [ ] New user appears in list
- [ ] Role badges display correctly (purple for admin, blue for data_manager)
- [ ] Status badges display correctly (green for active, red for inactive)
- [ ] Deactivate user works

### ✅ Role-Based Access Control
- [ ] Admin sees "User Management" in menu
- [ ] Admin sees "Settings" in menu
- [ ] Data Manager does NOT see "User Management"
- [ ] Data Manager does NOT see "Settings"
- [ ] Admin can access `/admin/users`
- [ ] Data Manager cannot access `/admin/users`
- [ ] Admin can access `/admin/settings`
- [ ] Data Manager cannot access `/admin/settings`

### ✅ Middleware & Route Protection
- [ ] Unauthenticated users redirected to login
- [ ] Return URL works after login
- [ ] Protected routes require authentication

### ✅ Public Access
- [ ] Unauthenticated users can search parts (public read)
- [ ] Homepage accessible without login

---

## Common Issues & Troubleshooting

### Issue: "SUPABASE_SERVICE_ROLE_KEY not configured"

**Solution:** Add service role key to `.env.local` and restart dev server

### Issue: "User profile not found" after login

**Solution:** Check that the `on_auth_user_created` trigger is working:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually create profile if missing
INSERT INTO user_profiles (id, email, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@acr.com'),
  'admin@acr.com',
  'admin'
);
```

### Issue: Login redirect loop

**Solution:** Clear browser cookies and local storage:
```js
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### Issue: "Cannot read properties of null (reading 'role')"

**Solution:** User profile might not be active or role is null:
```sql
-- Check user profile
SELECT * FROM user_profiles WHERE email = 'admin@acr.com';

-- Fix if needed
UPDATE user_profiles
SET role = 'admin', is_active = true
WHERE email = 'admin@acr.com';
```

---

## Next Steps After Manual Testing

If manual testing passes, consider:

1. **Create automated tests** (Step 8 below)
2. **Deploy to staging** (Remote TEST database)
3. **Document known issues**
4. **Create more test users** (different roles, inactive users)

---

## Optional: Step 8 - Automated Testing Setup

### 8.1 Unit Tests (Jest + React Testing Library)

```bash
# Install testing dependencies (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Example test** for `useAuth` hook:

```typescript
// src/contexts/__tests__/AuthContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

describe('useAuth', () => {
  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('should update user after signIn', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.signIn('admin@acr.com', 'admin123456');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.profile).not.toBeNull();
  });
});
```

### 8.2 E2E Tests (Playwright)

```bash
# Install Playwright
npx playwright install
```

**Example E2E test**:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login as admin and access user management', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login');

    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@acr.com');
    await page.fill('input[type="password"]', 'admin123456');

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin');

    // Verify we're on admin page
    expect(page.url()).toContain('/admin');

    // Open menu and click User Management
    await page.click('[aria-label="Menu"]');
    await page.click('text=User Management');

    // Verify we're on user management page
    await page.waitForURL('**/admin/users');
    expect(await page.textContent('h1')).toBe('User Management');
  });
});
```

---

## Summary

**Recommended Testing Flow:**
1. ✅ Apply migration to local database
2. ✅ Add service role key to `.env.local`
3. ✅ Create first admin user via Supabase Studio
4. ✅ Manual testing with browser (30-60 minutes)
5. ⏭️ Automated tests (optional, after manual testing passes)

This comprehensive testing ensures your Supabase Auth implementation works correctly before deploying to production!
