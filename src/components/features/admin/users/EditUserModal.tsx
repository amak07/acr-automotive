'use client';

import { useState } from 'react';
import { AcrButton } from '@/components/acr/Button';
import { AcrInput } from '@/components/acr/Input';
import { AcrSpinner } from '@/components/acr/Spinner';
import { useLocale } from '@/contexts/LocaleContext';
import { X, User } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'data_manager';
  is_active: boolean;
}

interface EditUserModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * EditUserModal - Simple modal for editing user name
 */
export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { t } = useLocale();
  const [fullName, setFullName] = useState(user.full_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('admin.users.editModal.updateError'));
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.editModal.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 acr-animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-acr-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-acr-red-100 flex items-center justify-center">
              <User className="w-5 h-5 text-acr-red-600" />
            </div>
            <div>
              <h2 className="acr-brand-heading-lg text-acr-gray-900">
                {t('admin.users.editModal.title')}
              </h2>
              <p className="text-sm text-acr-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-acr-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-acr-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-acr-gray-700">
              {t('admin.users.editModal.fullName')}
            </label>
            <AcrInput
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('admin.users.editModal.fullNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AcrButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('admin.users.editModal.cancel')}
            </AcrButton>
            <AcrButton
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <AcrSpinner size="xs" color="white" />
                  {t('admin.users.editModal.saving')}
                </span>
              ) : (
                t('admin.users.editModal.save')
              )}
            </AcrButton>
          </div>
        </form>
      </div>
    </div>
  );
}
