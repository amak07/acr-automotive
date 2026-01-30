/**
 * Next.js Middleware for Authentication and Role-Based Access
 *
 * Protects admin routes and handles role-based redirects:
 * - Admin users: Full access to /admin/* and /data-portal/*
 * - Data Managers: Access only to /data-portal/*
 */

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update session and get user profile
  const { supabaseResponse, user, profile } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const isAdminRoute = pathname.startsWith('/admin');
  const isDataPortalRoute = pathname.startsWith('/data-portal');
  const isDocsRoute = pathname.startsWith('/docs');
  const isProtectedPath = isAdminRoute || isDataPortalRoute || isDocsRoute;

  if (isProtectedPath) {
    // Not authenticated - redirect to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // User is deactivated - redirect to home
    if (profile && !profile.is_active) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Role-based access control
    if (profile) {
      const isDataManager = profile.role === 'data_manager';

      // Data managers can ONLY access /data-portal/*
      // Redirect them away from /admin/* routes
      if (isDataManager && isAdminRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/data-portal';
        return NextResponse.redirect(url);
      }

      // Admins have full access - no redirects needed
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     * - api routes (handled by API route protection)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
};
