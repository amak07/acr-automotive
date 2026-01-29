'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/layout/AppHeader';
import { UserManagementContent } from '@/components/features/admin/users/UserManagementContent';
import { withAdminAuth } from '@/components/shared/auth/withAdminAuth';
import { useAuth } from '@/contexts/AuthContext';
import { PageError } from '@/components/ui/error-states';
import { ShieldAlert } from 'lucide-react';

/**
 * User Management Page - Admin-only access
 *
 * Allows administrators to:
 * - View all users with roles and status
 * - Invite new users (email + password)
 * - Change user roles (admin ↔ data_manager)
 * - Deactivate users (soft delete)
 *
 * Data Managers are automatically redirected to main dashboard.
 */
function UsersPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin');
    }
  }, [isAdmin, router]);

  // Show access denied if not admin (before redirect completes)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-acr-gray-50 acr-page-bg-pattern">
        <AppHeader variant="admin" />
        <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
          <PageError
            title="Access Denied"
            message="User management is only available to administrators."
            icon={<ShieldAlert className="w-12 h-12 mx-auto" />}
            className="max-w-md mx-auto acr-animate-fade-up"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-acr-gray-50 acr-page-bg-pattern">
      <AppHeader variant="admin" />
      <UserManagementContent />
    </div>
  );
}

export default withAdminAuth(UsersPage);
