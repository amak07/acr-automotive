'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Settings, LogOut, Search, BookOpen, Database } from 'lucide-react';
import { AcrHeader, type AcrHeaderAction } from '@/components/acr';

interface AppHeaderProps {
  variant?: 'public' | 'admin' | 'data-portal';
}

/**
 * AppHeader - Unified application header with role-based navigation
 *
 * Desktop: compact text-only nav links, icon-only logout
 * Mobile/Tablet: full hamburger dropdown with icons + labels
 */
export function AppHeader({ variant = 'public' }: AppHeaderProps) {
  const { t, locale, setLocale } = useLocale();
  const { settings } = useSettings();
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  const companyName = settings?.branding?.company_name || 'ACR Automotive';

  const title =
    variant === 'admin'
      ? t('admin.header.admin')
      : variant === 'data-portal'
        ? t('portal.title')
        : t('public.header.title');

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  // Desktop nav: short text-only labels for compact inline display
  const desktopActions: AcrHeaderAction[] = [];
  // Mobile hamburger: full labels with icons
  const mobileActions: AcrHeaderAction[] = [];
  let logoutAction: AcrHeaderAction | undefined;

  if (user && profile?.is_active) {
    // Search
    desktopActions.push({ id: 'search', label: t('admin.nav.search'), href: '/' });
    mobileActions.push({ id: 'search', label: t('admin.header.publicSearch'), icon: Search, href: '/' });

    if (isAdmin) {
      // Admin dashboard
      desktopActions.push({ id: 'admin', label: t('admin.nav.admin'), href: '/admin' });
      mobileActions.push({ id: 'admin', label: t('admin.header.admin'), icon: Shield, href: '/admin' });

      // Settings (admin only — top-level route)
      desktopActions.push({ id: 'settings', label: t('admin.nav.settings'), href: '/settings' });
      mobileActions.push({ id: 'settings', label: t('admin.header.settings'), icon: Settings, href: '/settings' });

      // Data Portal (admins can access too)
      desktopActions.push({ id: 'portal', label: t('admin.nav.portal'), href: '/data-portal' });
      mobileActions.push({ id: 'portal', label: t('portal.title'), icon: Database, href: '/data-portal' });
    } else {
      // Data Portal (data managers)
      desktopActions.push({ id: 'portal', label: t('admin.nav.portal'), href: '/data-portal' });
      mobileActions.push({ id: 'portal', label: t('portal.title'), icon: Database, href: '/data-portal' });
    }

    // Docs
    desktopActions.push({ id: 'docs', label: t('admin.nav.docs'), href: '/docs' });
    mobileActions.push({ id: 'docs', label: t('admin.header.documentation'), icon: BookOpen, href: '/docs' });

    // Logout
    logoutAction = {
      id: 'logout',
      label: t('admin.settings.logout'),
      icon: LogOut,
      onClick: handleLogout,
      variant: 'danger',
      asButton: true,
    };
    mobileActions.push(logoutAction);
  }

  const borderVariant = variant === 'public' ? 'gray-300' : 'gray-200';
  const userDisplayName = profile?.full_name || profile?.email;

  return (
    <AcrHeader
      title={title}
      actions={desktopActions}
      logoutAction={logoutAction}
      utilityActions={mobileActions}
      userDisplayName={userDisplayName}
      locale={locale}
      onLocaleChange={setLocale}
      languageToggleLabel={t('admin.settings.language')}
      languageLabels={{ en: t('common.language.en'), es: t('common.language.es') }}
      borderVariant={borderVariant}
    />
  );
}
