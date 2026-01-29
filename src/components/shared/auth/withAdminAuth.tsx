'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Preloader } from '@/components/ui/Preloader';

const GEAR_ANIMATION_SRC = '/animations/gear-loader.lottie';

/**
 * withAdminAuth - Higher-Order Component for protecting admin routes
 *
 * Wraps components to require authentication via Supabase Auth.
 * Redirects unauthenticated users to login page with return URL.
 * Shows branded preloader during auth check.
 *
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   return <div>Admin Content</div>;
 * }
 *
 * export default withAdminAuth(AdminDashboard);
 * ```
 */
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect after loading complete and no user found
      if (!isLoading && !user) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?redirect=${returnUrl}`);
      }
    }, [isLoading, user, router]);

    // Show branded preloader while checking authentication
    if (isLoading) {
      return <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />;
    }

    // Show preloader while redirecting (no user or profile)
    if (!user || !profile) {
      return <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />;
    }

    // Check if user account is active
    if (!profile.is_active) {
      // Redirect to homepage with inactive account
      router.push('/');
      return <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />;
    }

    // User is authenticated and active - render protected component
    return <WrappedComponent {...props} />;
  };
}
