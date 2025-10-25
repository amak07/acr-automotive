# Authentication System

> **MVP authentication** for admin access with password-based protection

## Overview

ACR Automotive uses a lightweight, MVP-level authentication system for protecting admin routes. This system is designed for single-admin deployments and prioritizes simplicity over enterprise-grade security features.

### Current Implementation (MVP)

- **Password-based authentication** via environment variable
- **Session storage persistence** for browser session duration
- **HOC pattern** (`withAdminAuth`) for route protection
- **Modal UI** for password prompt
- **No database** - password stored in environment variable only

### Key Features

- **Single password** shared among all admins
- **Session-based** - authentication lasts until browser tab closes
- **No registration** - password set via environment variable
- **No user management** - single admin user concept
- **Client-side protection** - prevents UI access, not API access

**⚠️ Security Note**: This is an MVP authentication system suitable for single-admin deployments. For production multi-user environments, migrate to Supabase Auth or Auth.js (see [Future Enhancements](#future-enhancements)).

---

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Navigates to /admin/parts                             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  withAdminAuth HOC checks sessionStorage                    │
│  sessionStorage.getItem("admin-authenticated")              │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    === "true"              !== "true"
        │                       │
        ▼                       ▼
┌──────────────┐      ┌────────────────────┐
│ Render       │      │ Show Password      │
│ Admin Page   │      │ Modal              │
└──────────────┘      └──────────┬─────────┘
                                 │
                    User enters password
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ POST /api/admin/auth   │
                    │ { password: "..." }    │
                    └──────────┬─────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
        Password Match                  Password Mismatch
        (200 OK)                        (401 Unauthorized)
              │                                 │
              ▼                                 ▼
    ┌──────────────────────┐        ┌──────────────────┐
    │ sessionStorage.set   │        │ Show error       │
    │ ("admin-authenticated",│       │ "Invalid pass"   │
    │  "true")             │        │ Clear input      │
    └──────────┬───────────┘        └──────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Render Admin Page    │
    └──────────────────────┘
```

---

### Component Structure

```
src/
├── components/admin/auth/
│   ├── withAdminAuth.tsx           # HOC for route protection
│   └── AdminPasswordModal.tsx      # Password prompt UI
├── app/api/admin/auth/
│   └── route.ts                    # Password verification endpoint
└── app/admin/
    ├── parts/page.tsx              # Protected with withAdminAuth()
    ├── settings/page.tsx           # Protected with withAdminAuth()
    └── [...other admin pages]      # All protected
```

---

## API Reference

### `POST /api/admin/auth`

Verify admin password against environment variable.

**Request Body**:
```typescript
{
  password: string;
}
```

**Response (Success - 200)**:
```typescript
{
  success: true
}
```

**Response (Invalid Password - 401)**:
```typescript
{
  success: false,
  error: "Invalid password"
}
```

**Response (Server Error - 500)**:
```typescript
{
  success: false,
  error: "Authentication failed"
}
```

**Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const { password } = await request.json();

  // Get admin password from environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password === adminPassword) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  }
}
```

**Security Considerations**:
- Password is **plain text comparison** (not hashed)
- No rate limiting (vulnerable to brute force)
- No audit logging
- Single password for all admins

---

## Frontend Components

### `withAdminAuth` HOC

Higher-Order Component (HOC) for protecting admin routes.

**Usage**:
```typescript
// src/app/admin/parts/page.tsx
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";

function PartsPage() {
  return <div>Admin Parts Management</div>;
}

export default withAdminAuth(PartsPage);
```

**How It Works**:
```typescript
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
      // Check sessionStorage on mount
      const adminAuth = sessionStorage.getItem("admin-authenticated");

      if (adminAuth === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    }, []);

    // Loading state
    if (isAuthenticated === null) {
      return <LoadingSpinner />;
    }

    // Show password modal
    if (!isAuthenticated && showPasswordModal) {
      return <AdminPasswordModal onSuccess={() => setIsAuthenticated(true)} />;
    }

    // Render protected component
    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    // Fallback redirect
    router.push("/");
    return null;
  };
}
```

**States**:
1. **`null`** - Checking authentication (show loading spinner)
2. **`false`** - Not authenticated (show password modal)
3. **`true`** - Authenticated (render protected component)

---

### `AdminPasswordModal` Component

Modal UI for password entry.

**Props**:
```typescript
interface AdminPasswordModalProps {
  onSuccess: () => void;  // Called after successful authentication
  onCancel: () => void;   // Called when user clicks Cancel
}
```

**Features**:
- **Password visibility toggle** (Eye/EyeOff icon)
- **Auto-focus** on password input
- **Error display** for invalid password
- **Loading state** during verification
- **Cancel button** redirects to homepage

**Example Flow**:
```typescript
<AdminPasswordModal
  onSuccess={() => {
    setIsAuthenticated(true);
    setShowPasswordModal(false);
  }}
  onCancel={() => {
    router.push("/");
  }}
/>
```

**Internal State**:
```typescript
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);  // Toggle visibility
const [isVerifying, setIsVerifying] = useState(false);    // Loading state
const [error, setError] = useState("");                   // Error message
```

**Submit Handler**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsVerifying(true);
  setError("");

  try {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      // Store session
      sessionStorage.setItem("admin-authenticated", "true");
      onSuccess();
    } else {
      setError("Invalid password. Please try again.");
      setPassword("");  // Clear password on error
    }
  } catch (error) {
    setError("Authentication failed. Please try again.");
  } finally {
    setIsVerifying(false);
  }
};
```

---

## Configuration

### Environment Variables

**Required**: `ADMIN_PASSWORD`

```bash
# .env.local (development)
ADMIN_PASSWORD=your-strong-password-here

# .env.production (Vercel)
ADMIN_PASSWORD=your-production-password
```

**Default Value**: `"admin123"` (development only)

**Security Best Practices**:
- Use a strong password (16+ characters, mixed case, numbers, symbols)
- Never commit `.env.local` to version control
- Rotate password periodically
- Use different passwords for development and production

**Vercel Deployment**:
```bash
# Set environment variable in Vercel dashboard
# Settings > Environment Variables
# Name: ADMIN_PASSWORD
# Value: [your password]
# Environment: Production, Preview, Development
```

---

## Session Management

### Session Storage

**Key**: `"admin-authenticated"`
**Value**: `"true"` (when authenticated)

**Lifetime**: Until browser tab closes

```typescript
// Set session (after successful login)
sessionStorage.setItem("admin-authenticated", "true");

// Check session (on page load)
const isAuthenticated = sessionStorage.getItem("admin-authenticated") === "true";

// Clear session (on logout)
sessionStorage.removeItem("admin-authenticated");
```

**Why Session Storage?**
- **Tab-scoped**: Each browser tab has independent auth state
- **Temporary**: Cleared when tab closes (no lingering sessions)
- **Client-side only**: Never sent to server
- **Simple**: No cookies, no JWT, no refresh tokens

**Logout Implementation**:
```typescript
// src/components/admin/settings/SettingsPageContent.tsx
const handleLogout = () => {
  sessionStorage.removeItem("admin-authenticated");
  router.push("/");
};
```

---

## Security Considerations

### Known Limitations (MVP)

1. **No Password Hashing**
   - Password stored in plain text environment variable
   - Comparison is plain text (not bcrypt/argon2)
   - **Risk**: Server compromise exposes password

2. **No Rate Limiting**
   - Unlimited password attempts
   - **Risk**: Brute force attacks possible

3. **No Audit Logging**
   - No record of login attempts (successful or failed)
   - **Risk**: Cannot detect unauthorized access attempts

4. **No Session Expiration**
   - Session lasts until tab closes
   - **Risk**: Long-lived sessions if tab left open

5. **Client-Side Protection Only**
   - API routes not password-protected
   - **Risk**: Direct API access bypasses authentication

6. **Single Password**
   - All admins share one password
   - **Risk**: Cannot revoke individual access

7. **No CSRF Protection**
   - No CSRF tokens
   - **Risk**: Cross-site request forgery possible

---

### Recommended Mitigations (Current MVP)

1. **Strong Password**
   - Minimum 16 characters
   - Mixed case, numbers, symbols
   - Use password manager

2. **Network Security**
   - Deploy with HTTPS only (Vercel handles this)
   - Use Vercel's authentication for dashboard access

3. **Access Control**
   - Limit password sharing to trusted users
   - Rotate password periodically

4. **Monitoring**
   - Monitor Vercel logs for suspicious activity
   - Review API usage patterns

---

## Code Examples

### Example 1: Protect Admin Page

```typescript
// src/app/admin/parts/page.tsx
"use client";

import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";

function PartsManagementPage() {
  return (
    <div>
      <h1>Admin Parts Management</h1>
      {/* Admin-only content */}
    </div>
  );
}

// Wrap component with HOC
export default withAdminAuth(PartsManagementPage);

// Result:
// 1. User navigates to /admin/parts
// 2. withAdminAuth checks sessionStorage
// 3. If not authenticated, shows password modal
// 4. After successful login, renders PartsManagementPage
```

---

### Example 2: Manual Session Check

```typescript
// src/components/admin/SomeComponent.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminOnlyFeature() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("admin-authenticated");

    if (adminAuth !== "true") {
      router.push("/");
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  if (!isAdmin) return null;

  return <div>Admin-only feature</div>;
}
```

---

### Example 3: Logout Implementation

```typescript
// src/components/admin/Header.tsx
import { useRouter } from "next/navigation";
import { AcrButton } from "@/components/acr";

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear session
    sessionStorage.removeItem("admin-authenticated");

    // Redirect to homepage
    router.push("/");
  };

  return (
    <header>
      <h1>Admin Panel</h1>
      <AcrButton onClick={handleLogout} variant="destructive">
        Logout
      </AcrButton>
    </header>
  );
}
```

---

### Example 4: Custom Password Validation

```typescript
// src/app/api/admin/auth/route.ts (enhanced)
export async function POST(request: NextRequest) {
  const { password } = await request.json();

  // Get admin password from environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Optional: Add minimum password length check
  if (!password || password.length < 8) {
    return NextResponse.json(
      { success: false, error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Compare passwords
  if (password === adminPassword) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  }
}
```

---

## Testing

### Manual Testing Checklist

#### Authentication Flow
- [ ] Navigate to `/admin/parts` (or any admin route)
- [ ] Verify password modal appears
- [ ] Enter incorrect password → Verify error message
- [ ] Enter correct password → Verify modal closes and page renders
- [ ] Refresh page → Verify still authenticated (session persists)
- [ ] Close tab and reopen → Verify authentication cleared (session expired)
- [ ] Click "Cancel" on modal → Verify redirect to homepage

#### Logout
- [ ] Login to admin panel
- [ ] Navigate to Settings page
- [ ] Click "Logout" button
- [ ] Verify redirect to homepage
- [ ] Attempt to navigate back to admin page → Verify password modal appears again

#### Protected Routes
- [ ] Verify all admin routes protected:
  - [ ] `/admin/parts`
  - [ ] `/admin/parts/[id]`
  - [ ] `/admin/settings`
- [ ] Verify public routes accessible without authentication:
  - [ ] `/` (homepage)
  - [ ] `/parts/[id]` (public part detail)

---

### Automated Testing

```typescript
// Example test: Authentication endpoint
describe("POST /api/admin/auth", () => {
  it("returns success for correct password", async () => {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
    });

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 401 for incorrect password", async () => {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });

    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid password");
  });

  it("returns 500 for malformed request", async () => {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    expect(response.status).toBe(500);
  });
});
```

---

## Future Enhancements

### Phase 1: Immediate Improvements (Low Effort)

1. **Rate Limiting**
   ```typescript
   // Add to /api/admin/auth
   import rateLimit from "express-rate-limit";

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // Limit each IP to 5 requests per windowMs
     message: "Too many login attempts, please try again later",
   });
   ```

2. **Password Hashing**
   ```typescript
   // Store bcrypt hash in environment variable
   import bcrypt from "bcrypt";

   const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
   ```

3. **Audit Logging**
   ```typescript
   // Log all authentication attempts
   console.log(`[AUTH] Login attempt from ${request.ip} at ${new Date().toISOString()}`);
   ```

---

### Phase 2: Multi-User Support (Medium Effort)

**Migrate to Supabase Auth** for built-in user management:

```typescript
import { createClient } from "@supabase/supabase-js";

// Sign in with email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: "admin@acr-automotive.com",
  password: userPassword,
});

// Check auth state
const { data: { user } } = await supabase.auth.getUser();

if (user?.role === "admin") {
  // Authorized
}
```

**Benefits**:
- User registration/login flows
- Password reset via email
- Role-based access control (RBAC)
- Session management with refresh tokens
- Built-in security (rate limiting, CSRF protection)

---

### Phase 3: Enterprise Auth (High Effort)

**Migrate to Auth.js (NextAuth)** for OAuth providers:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Check if user email is admin
      if (user.email === "admin@acr-automotive.com") {
        session.user.role = "admin";
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
```

**Benefits**:
- OAuth login (Google, GitHub, etc.)
- SSO (Single Sign-On)
- Email verification
- 2FA (Two-Factor Authentication)
- Advanced session management

---

## Migration Path

### From MVP to Supabase Auth

1. **Create auth schema**
   ```sql
   -- Supabase auto-generates this
   -- Just enable auth in Supabase dashboard
   ```

2. **Replace sessionStorage with Supabase session**
   ```typescript
   // Before (MVP)
   sessionStorage.setItem("admin-authenticated", "true");

   // After (Supabase)
   const { data, error } = await supabase.auth.signInWithPassword({
     email: user.email,
     password: user.password,
   });
   ```

3. **Replace withAdminAuth HOC**
   ```typescript
   export function withAdminAuth(WrappedComponent) {
     return function AdminProtectedComponent(props) {
       const { data: { user } } = await supabase.auth.getUser();

       if (!user || user.role !== "admin") {
         router.push("/login");
         return null;
       }

       return <WrappedComponent {...props} />;
     };
   }
   ```

4. **Add admin user via Supabase dashboard**
   - Create user with admin role
   - Set RLS policies for admin access

---

## Related Documentation

### Architecture
- **[Architecture Overview](../../architecture/OVERVIEW.md)** - Auth layer in system architecture

### Other Features
- **[Site Settings](../site-settings/SITE_SETTINGS.md)** - Settings page uses withAdminAuth protection

---

**Last Updated**: October 25, 2025
