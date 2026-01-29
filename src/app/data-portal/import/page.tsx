'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { AcrButton } from '@/components/acr/Button';
import { AcrSpinner } from '@/components/acr/Spinner';
import { AcrLanguageToggle } from '@/components/acr/LanguageToggle';
import { AcrLogo } from '@/components/ui/AcrLogo';
import { ImportWizard } from '@/components/features/admin/import/ImportWizard';
import { ArrowLeft, LogOut } from 'lucide-react';

/**
 * Data Manager Import Page
 *
 * Simplified import interface for data managers.
 * No admin navigation - just import functionality with simple header.
 */
export default function DataManagerImportPage() {
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
    router.push('/login?redirect=/data-portal/import');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 to-acr-gray-100">
      {/* Header - matches admin header style */}
      <header className="relative before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-acr-red-500 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Back to Portal */}
            <AcrButton
              variant="secondary"
              size="sm"
              onClick={() => router.push('/data-portal')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.actions.back')}</span>
            </AcrButton>
            <AcrLogo className="h-14 md:h-12 lg:h-14" />
            <h1 className="acr-brand-heading-xl text-acr-gray-800 truncate hidden md:block">
              {t('portal.import.title')}
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
      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
        <ImportWizard />
      </main>
    </div>
  );
}
