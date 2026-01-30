'use client';

import { useState, useEffect } from 'react';
import { AcrButton } from '@/components/acr/Button';
import { AcrCard, AcrCardHeader, AcrCardContent } from '@/components/acr/Card';
import { AcrSpinner } from '@/components/acr/Spinner';
import { ConfirmDialog } from '@/components/acr/ConfirmDialog';
import { InlineError } from '@/components/ui/error-states';
import { InviteUserModal } from './InviteUserModal';
import { EditUserModal } from './EditUserModal';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserPlus,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
  Edit,
  UserX,
  UserCheck,
  Calendar,
  Mail,
  Crown,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStaggerClass } from '@/lib/animations';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'data_manager';
  is_active: boolean;
  is_owner: boolean;
  created_at: string;
  last_login_at: string | null;
}

/**
 * UserManagementContent - Admin user management interface
 *
 * Displays list of all users with role-based badges, status indicators,
 * and management actions. Follows ACR design patterns with professional
 * styling and smooth animations.
 */
export function UserManagementContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
  const [reactivatingUserId, setReactivatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const { t } = useLocale();
  const { user: currentUser } = useAuth();

  // Check if current user is an owner
  const currentUserProfile = users.find((u) => u.id === currentUser?.id);
  const isCurrentUserOwner = currentUserProfile?.is_owner ?? false;

  // Filter out owners from list unless viewer is also an owner
  const visibleUsers = isCurrentUserOwner
    ? users
    : users.filter((u) => !u.is_owner);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateClick = (user: UserProfile) => {
    setUserToDeactivate(user);
  };

  const handleDeactivateConfirm = async () => {
    if (!userToDeactivate) return;

    try {
      setDeactivatingUserId(userToDeactivate.id);
      setUserToDeactivate(null);

      const response = await fetch(`/api/auth/users/${userToDeactivate.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }

      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admin.users.deactivateError'));
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setReactivatingUserId(userId);

      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate user');
      }

      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admin.users.reactivateError'));
    } finally {
      setReactivatingUserId(null);
    }
  };

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUserId(userToDelete.id);
      setUserToDelete(null);

      const response = await fetch(`/api/auth/users/${userToDelete.id}?permanent=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admin.users.deleteError'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('admin.users.never');
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <AcrSpinner size="lg" color="primary" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
        <InlineError
          title={t('admin.users.errorTitle')}
          message={error}
          onRetry={fetchUsers}
        />
      </main>
    );
  }

  return (
    <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between acr-animate-fade-up">
        <div>
          <h1 className="acr-brand-heading-2xl text-acr-gray-900">
            {t('admin.users.title')}
          </h1>
          <p className="text-acr-gray-600 acr-body mt-2">
            {t('admin.users.description')}
          </p>
        </div>
        <AcrButton
          variant="primary"
          className="flex items-center gap-2 h-11"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          {t('admin.users.addUser')}
        </AcrButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <AcrCard
          padding="compact"
          className={cn('acr-animate-fade-up', getStaggerClass(0))}
        >
          <AcrCardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-acr-red-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-acr-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-acr-gray-900">
                {visibleUsers.filter((u) => u.role === 'admin' && u.is_active).length}
              </div>
              <div className="text-sm text-acr-gray-600">{t('admin.users.activeAdmins')}</div>
            </div>
          </AcrCardContent>
        </AcrCard>

        <AcrCard
          padding="compact"
          className={cn('acr-animate-fade-up', getStaggerClass(1))}
        >
          <AcrCardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-acr-gray-900">
                {visibleUsers.filter((u) => u.role === 'data_manager' && u.is_active).length}
              </div>
              <div className="text-sm text-acr-gray-600">{t('admin.users.dataManagers')}</div>
            </div>
          </AcrCardContent>
        </AcrCard>

        <AcrCard
          padding="compact"
          className={cn('acr-animate-fade-up', getStaggerClass(2))}
        >
          <AcrCardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-acr-gray-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-acr-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-acr-gray-900">
                {visibleUsers.filter((u) => !u.is_active).length}
              </div>
              <div className="text-sm text-acr-gray-600">{t('admin.users.inactiveUsers')}</div>
            </div>
          </AcrCardContent>
        </AcrCard>
      </div>

      {/* Users List */}
      <AcrCard
        className={cn('acr-animate-fade-up', getStaggerClass(3))}
        padding="none"
      >
        <AcrCardHeader className="px-6 py-4 border-b border-acr-gray-200">
          <h2 className="acr-brand-heading-lg text-acr-gray-900">{t('admin.users.allUsers')}</h2>
        </AcrCardHeader>
        <AcrCardContent className="p-0">
          <div className="divide-y divide-acr-gray-200">
            {visibleUsers.map((user) => (
              <div
                key={user.id}
                className="p-6 transition-colors duration-150"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* User Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-acr-gray-900">
                            {user.full_name || t('admin.users.noName')}
                          </h3>
                          {/* Role Badge */}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {user.role === 'admin' ? (
                              <>
                                <Shield className="w-3 h-3" />
                                {t('admin.users.roleAdmin')}
                              </>
                            ) : (
                              <>
                                <Briefcase className="w-3 h-3" />
                                {t('admin.users.roleDataManager')}
                              </>
                            )}
                          </span>
                          {/* Owner Badge */}
                          {user.is_owner && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <Crown className="w-3 h-3" />
                              {t('admin.users.owner')}
                            </span>
                          )}
                          {/* Status Badge */}
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              {t('admin.users.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" />
                              {t('admin.users.inactive')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-acr-gray-600 mt-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-acr-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{t('admin.users.joined')} {formatDate(user.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t('admin.users.lastLogin')} {formatDate(user.last_login_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {user.is_active && (
                      <AcrButton
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">{t('admin.users.edit')}</span>
                      </AcrButton>
                    )}
                    {/* Don't show deactivate/reactivate for current user or owners */}
                    {user.id !== currentUser?.id && !user.is_owner && (
                      user.is_active ? (
                        <AcrButton
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1.5"
                          onClick={() => handleDeactivateClick(user)}
                          disabled={deactivatingUserId === user.id}
                        >
                          {deactivatingUserId === user.id ? (
                            <AcrSpinner size="xs" color="white" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden lg:inline">{t('admin.users.deactivate')}</span>
                        </AcrButton>
                      ) : (
                        <>
                          <AcrButton
                            variant="primary"
                            size="sm"
                            className="flex items-center gap-1.5"
                            onClick={() => handleReactivate(user.id)}
                            disabled={reactivatingUserId === user.id}
                          >
                            {reactivatingUserId === user.id ? (
                              <AcrSpinner size="xs" color="white" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden lg:inline">{t('admin.users.reactivate')}</span>
                          </AcrButton>
                          <AcrButton
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-1.5"
                            onClick={() => handleDeleteClick(user)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              <AcrSpinner size="xs" color="white" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden lg:inline">{t('admin.users.delete')}</span>
                          </AcrButton>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AcrCardContent>
      </AcrCard>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateConfirm}
        title={t('admin.users.confirmDeactivateTitle')}
        description={t('admin.users.confirmDeactivate').replace(
          '{name}',
          userToDeactivate?.full_name || userToDeactivate?.email || ''
        )}
        confirmText={t('admin.users.deactivate')}
        cancelText={t('admin.users.editModal.cancel')}
        variant="destructive"
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={t('admin.users.confirmDeleteTitle')}
        description={t('admin.users.confirmDelete').replace(
          '{name}',
          userToDelete?.full_name || userToDelete?.email || ''
        )}
        confirmText={t('admin.users.delete')}
        cancelText={t('admin.users.editModal.cancel')}
        variant="destructive"
      />
    </main>
  );
}
