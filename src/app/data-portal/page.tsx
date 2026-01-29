'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { AcrCard, AcrCardContent } from '@/components/acr/Card';
import { AcrButton } from '@/components/acr/Button';
import { AcrSpinner } from '@/components/acr/Spinner';
import { AcrLanguageToggle } from '@/components/acr/LanguageToggle';
import { AcrLogo } from '@/components/ui/AcrLogo';
import { Upload, Download, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStaggerClass } from '@/lib/animations';

/**
 * DataPortal - Simple interface for data managers
 *
 * Provides two actions: Import (upload Excel) and Export (download Excel)
 * No navigation, no dashboard - just the essentials.
 */
export default function DataPortalPage() {
  const router = useRouter();
  const { user, profile, isLoading, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-acr-gray-50 flex items-center justify-center">
        <AcrSpinner size="lg" color="primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    router.push('/login?redirect=/data-portal');
    return null;
  }

  return (
    <div className="min-h-screen bg-acr-gray-50">
      {/* Header - matches admin header style */}
      <header className="relative before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-acr-red-500 bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            <AcrLogo className="h-14 md:h-12 lg:h-14" />
            <h1 className="acr-brand-heading-xl text-acr-gray-800 truncate hidden md:block">
              {t('portal.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <AcrLanguageToggle
              locale={locale}
              onLocaleChange={setLocale}
              size="sm"
            />
            {/* Logout */}
            <AcrButton
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin.settings.logout')}</span>
            </AcrButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome */}
        <div className="text-center mb-10 acr-animate-fade-up">
          <h2 className="acr-brand-heading-2xl text-acr-gray-900 mb-2">
            {t('portal.welcome')}, {profile.full_name || profile.email.split('@')[0]}
          </h2>
          <p className="text-acr-gray-600">
            {t('portal.description')}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Card */}
          <AcrCard
            className={cn(
              'cursor-pointer hover:shadow-lg transition-shadow duration-200 acr-animate-fade-up',
              getStaggerClass(0)
            )}
            onClick={() => router.push('/data-portal/import')}
          >
            <AcrCardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-acr-red-100 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-acr-red-600" />
              </div>
              <h3 className="acr-brand-heading-lg text-acr-gray-900 mb-2">
                {t('portal.import.title')}
              </h3>
              <p className="text-acr-gray-600 text-sm">
                {t('portal.import.description')}
              </p>
            </AcrCardContent>
          </AcrCard>

          {/* Export Card */}
          <AcrCard
            className={cn(
              'cursor-pointer hover:shadow-lg transition-shadow duration-200 acr-animate-fade-up',
              getStaggerClass(1)
            )}
            onClick={() => window.location.href = '/api/admin/export'}
          >
            <AcrCardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="acr-brand-heading-lg text-acr-gray-900 mb-2">
                {t('portal.export.title')}
              </h3>
              <p className="text-acr-gray-600 text-sm">
                {t('portal.export.description')}
              </p>
            </AcrCardContent>
          </AcrCard>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-acr-gray-500 mt-8 acr-animate-fade-up">
          {t('portal.helpText')}
        </p>
      </main>
    </div>
  );
}
