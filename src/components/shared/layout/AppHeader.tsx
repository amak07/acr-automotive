"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Shield, Settings, LogOut, Search, BookOpen } from "lucide-react";
import { AcrHeader, type AcrHeaderAction } from "@/components/acr";

interface AppHeaderProps {
  variant?: "public" | "admin";
}

// Helper to safely read sessionStorage (works with SSR)
function getAdminAuthSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("admin-authenticated") === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribeToStorage(callback: () => void): () => void {
  // Listen for storage changes (from other tabs)
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * AppHeader - Unified application header
 *
 * Displays company name from settings with contextual actions.
 * - Public variant: Shows company name, admin/settings links (if authenticated)
 * - Admin variant: Shows company name + " - Admin", view public and settings links
 */
export function AppHeader({ variant = "public" }: AppHeaderProps) {
  const { t, locale, setLocale } = useLocale();
  const { settings } = useSettings();
  const router = useRouter();

  // Use useSyncExternalStore for reading sessionStorage (avoids setState in effect)
  const isAuthenticated = useSyncExternalStore(
    subscribeToStorage,
    getAdminAuthSnapshot,
    getServerSnapshot
  );

  // Get company name from settings, fallback to default
  const companyName = settings?.branding?.company_name || "ACR Automotive";

  // Determine title based on variant
  // Public: show tagline "Professional Parts Catalog"
  // Admin: show "Admin" indicator so users know they're in admin mode
  const title =
    variant === "admin" ? t("admin.header.admin") : t("public.header.title");

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem("admin-authenticated");
    router.push("/");
  };

  // Build unified menu (3-dot menu) containing all navigation
  // Only show menu when authenticated
  const menuActions: AcrHeaderAction[] = [];

  // Add all menu items if authenticated
  if (isAuthenticated) {
    menuActions.push(
      // Public Search
      {
        id: "public-search",
        label: t("admin.header.publicSearch"),
        icon: Search,
        href: "/",
        variant: "default",
      },
      {
        id: "admin",
        label: t("admin.header.admin"),
        icon: Shield,
        href: "/admin",
        variant: "default",
      },
      {
        id: "settings",
        label: t("admin.header.settings"),
        icon: Settings,
        href: "/admin/settings",
        variant: "default",
      },
      {
        id: "documentation",
        label: t("admin.header.documentation"),
        icon: BookOpen,
        href: "/docs",
        variant: "default",
      },
      {
        id: "logout",
        label: t("admin.settings.logout"),
        icon: LogOut,
        onClick: handleLogout,
        variant: "danger",
        asButton: true,
      }
    );
  }

  // Border color based on variant
  const borderVariant = variant === "admin" ? "gray-200" : "gray-300";

  return (
    <AcrHeader
      title={title}
      actions={[]} // No quick-access actions - everything goes in the menu
      utilityActions={menuActions}
      locale={locale}
      onLocaleChange={setLocale}
      languageToggleLabel={t("admin.settings.language")}
      borderVariant={borderVariant}
    />
  );
}
