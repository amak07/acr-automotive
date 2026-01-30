/**
 * Supabase Middleware Client Configuration
 *
 * This client is used specifically for Next.js middleware to handle
 * session refresh on protected routes.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export type UserRole = 'admin' | 'data_manager';

export interface MiddlewareUserProfile {
  id: string;
  role: UserRole;
  is_active: boolean;
}

/**
 * Create Supabase client for Middleware
 * Handles session refresh and cookie management for route protection
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile if authenticated
  let profile: MiddlewareUserProfile | null = null;
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .single();

    profile = data as MiddlewareUserProfile | null;
  }

  // Return response, user, and profile for middleware logic
  return { supabaseResponse, user, profile }
}
