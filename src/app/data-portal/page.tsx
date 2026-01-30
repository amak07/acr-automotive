'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { AcrCard, AcrCardContent } from '@/components/acr/Card';
import { AcrSpinner } from '@/components/acr/Spinner';
import { AppHeader } from '@/components/shared/layout/AppHeader';
import { Upload, Download } from 'lucide-react';
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
  const { user, profile, isLoading } = useAuth();
  const { t } = useLocale();

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
      <AppHeader variant="data-portal" />

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
