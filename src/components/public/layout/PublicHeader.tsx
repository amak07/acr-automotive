"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Shield, Settings } from "lucide-react";
import { AcrHeader, type AcrHeaderAction } from "@/components/acr";

export function PublicHeader() {
  const { locale, setLocale, t } = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as admin
    const adminAuth = sessionStorage.getItem("admin-authenticated");
    setIsAuthenticated(adminAuth === "true");
  }, []);

  // Only show admin links if authenticated
  const actions: AcrHeaderAction[] = isAuthenticated
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
          href: "/admin/settings",
          variant: "default",
        },
      ]
    : [];

  return (
    <AcrHeader
      title="" // Remove "Product Catalogue" title
      // No language toggle - accessible via Settings page
      actions={actions}
      borderVariant="gray-300"
    />
  );
}