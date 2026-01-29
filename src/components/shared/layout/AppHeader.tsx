'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Settings, LogOut, Search, BookOpen, Users } from 'lucide-react';
import { AcrHeader, type AcrHeaderAction } from '@/components/acr';

interface AppHeaderProps {
  variant?: 'public' | 'admin';
}

/**
 * AppHeader - Unified application header with role-based navigation
 *
 * Displays company name from settings with contextual actions.
 * - Public variant: Shows company name, admin/settings links (if authenticated)
 * - Admin variant: Shows company name + " - Admin", view public and settings links
 *
 * Menu items are filtered based on user role:
 * - Admin: Full access (users, settings, parts, etc.)
 * - Data Manager: Parts management only (no users, no settings)
 */
export function AppHeader({ variant = 'public' }: AppHeaderProps) {
  const { t, locale, setLocale } = useLocale();
  const { settings } = useSettings();
  const { user, profile, isAdmin, signOut } = useAuth();
  const router = useRouter();

  // Get company name from settings, fallback to default
  const companyName = settings?.branding?.company_name || 'ACR Automotive';

  // Determine title based on variant
  const title =
    variant === 'admin' ? t('admin.header.admin') : t('public.header.title');

  // Logout handler
  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  // Build unified menu (3-dot menu) containing all navigation
  // Only show menu when authenticated
  const menuActions: AcrHeaderAction[] = [];

  // Add menu items if authenticated
  if (user && profile?.is_active) {
    menuActions.push(
      {
        id: 'public-search',
        label: t('admin.header.publicSearch'),
        icon: Search,
        href: '/',
        variant: 'default',
      },
      {
        id: 'admin',
        label: t('admin.header.admin'),
        icon: Shield,
        href: '/admin',
        variant: 'default',
      }
    );

    // Admin-only menu items
    if (isAdmin) {
      menuActions.push(
        {
          id: 'users',
          label: t('admin.header.users'),
          icon: Users,
          href: '/admin/users',
          variant: 'default',
        },
        {
          id: 'settings',
          label: t('admin.header.settings'),
          icon: Settings,
          href: '/admin/settings',
          variant: 'default',
        }
      );
    }

    // Documentation and logout available to all authenticated users
    menuActions.push(
      {
        id: 'documentation',
        label: t('admin.header.documentation'),
        icon: BookOpen,
        href: '/docs',
        variant: 'default',
      },
      {
        id: 'logout',
        label: t('admin.settings.logout'),
        icon: LogOut,
        onClick: handleLogout,
        variant: 'danger',
        asButton: true,
      }
    );
  }

  // Border color based on variant
  const borderVariant = variant === 'admin' ? 'gray-200' : 'gray-300';

  return (
    <AcrHeader
      title={title}
      actions={[]}
      utilityActions={menuActions}
      locale={locale}
      onLocaleChange={setLocale}
      languageToggleLabel={t('admin.settings.language')}
      borderVariant={borderVariant}
    />
  );
}
