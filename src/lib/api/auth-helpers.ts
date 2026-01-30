/**
 * API Route Protection Helpers
 *
 * Provides helper functions to protect API routes with authentication
 * and role-based access control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'data_manager';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

/**
 * Verify user is authenticated and return user profile
 * Use this in API routes to protect endpoints
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *   if (authResult instanceof NextResponse) return authResult;
 *
 *   const { user } = authResult;
 *   // Continue with authenticated logic...
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'User account is deactivated' },
        { status: 403 }
      );
    }

    return { user: profile as AuthenticatedUser };
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify user is admin
 * Use this in admin-only API routes (settings, user management)
 *
 * @example
 * ```typescript
 * export async function PATCH(request: NextRequest) {
 *   const authResult = await requireAdmin(request);
 *   if (authResult instanceof NextResponse) return authResult;
 *
 *   const { user } = authResult;
 *   // Continue with admin-only logic...
 * }
 * ```
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  if (authResult.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return authResult;
}
