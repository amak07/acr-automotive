"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Shield, Settings, ExternalLink } from "lucide-react";
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
  const { t } = useLocale();
  const { settings } = useSettings();

  // Use useSyncExternalStore for reading sessionStorage (avoids setState in effect)
  const isAuthenticated = useSyncExternalStore(
    subscribeToStorage,
    getAdminAuthSnapshot,
    getServerSnapshot
  );

  // Get company name from settings, fallback to default
  const companyName = settings?.branding?.company_name || "ACR Automotive";

  // Determine title based on variant
  const title =
    variant === "admin"
      ? `${companyName} - ${t("admin.header.admin")}`
      : companyName;

  // Determine actions based on variant and auth state
  const actions: AcrHeaderAction[] =
    variant === "admin"
      ? [
          {
            id: "view-public",
            label: t("admin.header.viewPublic"),
            icon: ExternalLink,
            href: "/",
            variant: "default",
          },
          {
            id: "settings",
            label: t("admin.header.settings"),
            icon: Settings,
            href: "/admin/settings?from=admin",
            variant: "default",
          },
        ]
      : isAuthenticated
        ? [
            {
              id: "admin",
              label: t("public.header.admin"),
              icon: Shield,
              href: "/admin",
              variant: "default",
            },
            {
              id: "settings",
              label: t("admin.header.settings"),
              icon: Settings,
              href: "/admin/settings?from=public",
              variant: "default",
            },
          ]
        : [];

  // Border color based on variant
  const borderVariant = variant === "admin" ? "gray-200" : "gray-300";

  return (
    <AcrHeader title={title} actions={actions} borderVariant={borderVariant} />
  );
}
