'use client';

import { useState } from 'react';
import { AcrModal } from '@/components/acr/AcrModal';
import { AcrButton } from '@/components/acr/Button';
import { AcrInput } from '@/components/acr/Input';
import { AcrLabel } from '@/components/acr/Label';
import { AcrSpinner } from '@/components/acr/Spinner';
import { useLocale } from '@/contexts/LocaleContext';
import {
  UserPlus,
  Mail,
  User,
  Lock,
  Shield,
  Briefcase,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * InviteUserModal - Add new user with role selection
 *
 * Admin-only modal for creating new user accounts.
 * Validates email format and password strength.
 */
export function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'data_manager'>('data_manager');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName || undefined,
          role,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isFormValid =
    email.length > 0 &&
    password.length >= 8 &&
    passwordsMatch &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <AcrModal
      isOpen={true}
      onClose={onClose}
      title={t('admin.users.modal.title')}
      description={t('admin.users.modal.description')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <AcrLabel htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-acr-gray-400" />
            {t('admin.users.modal.email')}
          </AcrLabel>
          <AcrInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            placeholder={t('admin.users.modal.emailPlaceholder')}
            required
            autoFocus
            disabled={isLoading}
          />
          {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
            <p className="text-xs text-acr-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('admin.users.modal.emailInvalid')}
            </p>
          )}
        </div>

        {/* Full Name (Optional) */}
        <div className="space-y-2">
          <AcrLabel htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4 text-acr-gray-400" />
            {t('admin.users.modal.fullName')}{' '}
            <span className="text-acr-gray-400 text-xs">
              ({t('admin.users.modal.fullNameOptional')})
            </span>
          </AcrLabel>
          <AcrInput
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11"
            placeholder="John Doe"
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <AcrLabel htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-acr-gray-400" />
            {t('admin.users.modal.password')}
          </AcrLabel>
          <div className="relative">
            <AcrInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-12"
              placeholder={t('admin.users.modal.passwordPlaceholder')}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-acr-gray-400 hover:text-acr-gray-600',
                'transition-colors duration-150'
              )}
              tabIndex={-1}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {password.length > 0 && password.length < 8 && (
            <p className="text-xs text-acr-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('admin.users.modal.passwordTooShort')}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <AcrLabel htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-acr-gray-400" />
            {t('admin.users.modal.confirmPassword')}
          </AcrLabel>
          <div className="relative">
            <AcrInput
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 pr-12"
              placeholder={t('admin.users.modal.confirmPasswordPlaceholder')}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-acr-gray-400 hover:text-acr-gray-600',
                'transition-colors duration-150'
              )}
              tabIndex={-1}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('admin.users.modal.passwordMismatch')}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <AcrLabel className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-acr-gray-400" />
            {t('admin.users.modal.role')}
          </AcrLabel>

          {/* Data Manager Option */}
          <label
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
              role === 'data_manager'
                ? 'border-blue-500 bg-blue-50'
                : 'border-acr-gray-200 bg-white hover:border-blue-300'
            )}
          >
            <input
              type="radio"
              name="role"
              value="data_manager"
              checked={role === 'data_manager'}
              onChange={(e) => setRole(e.target.value as 'data_manager')}
              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-acr-gray-900">
                  {t('admin.users.modal.dataManagerTitle')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {t('admin.users.modal.recommended')}
                </span>
              </div>
              <p className="text-sm text-acr-gray-600">
                {t('admin.users.modal.dataManagerDesc')}
              </p>
            </div>
          </label>

          {/* Admin Option */}
          <label
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
              role === 'admin'
                ? 'border-purple-500 bg-purple-50'
                : 'border-acr-gray-200 bg-white hover:border-purple-300'
            )}
          >
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === 'admin'}
              onChange={(e) => setRole(e.target.value as 'admin')}
              className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
              disabled={isLoading}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-acr-gray-900">
                  {t('admin.users.modal.adminTitle')}
                </span>
              </div>
              <p className="text-sm text-acr-gray-600">
                {t('admin.users.modal.adminDesc')}
              </p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                {t('admin.users.modal.createError')}
              </p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <AcrButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {t('admin.users.modal.cancel')}
          </AcrButton>
          <AcrButton
            type="submit"
            variant="primary"
            disabled={isLoading || !isFormValid}
            className={cn('flex-1 flex items-center justify-center gap-2')}
          >
            {isLoading ? (
              <>
                <AcrSpinner size="sm" color="white" />
                <span>{t('admin.users.modal.creating')}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{t('admin.users.modal.submit')}</span>
              </>
            )}
          </AcrButton>
        </div>
      </form>
    </AcrModal>
  );
}
