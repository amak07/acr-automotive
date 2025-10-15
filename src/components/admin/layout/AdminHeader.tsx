"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { ExternalLink, Settings } from "lucide-react";
import { AcrHeader, type AcrHeaderAction } from "@/components/acr";

export function AdminHeader() {
  const { t } = useLocale();

  const actions: AcrHeaderAction[] = [
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
      href: "/admin/settings",
      variant: "default",
    },
  ];

  return (
    <AcrHeader
      title={t("admin.header.title")}
      actions={actions}
      borderVariant="gray-200"
    />
  );
}
