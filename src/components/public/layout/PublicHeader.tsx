"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { Shield } from "lucide-react";
import { AcrHeader, type AcrHeaderAction } from "@/components/acr";

export function PublicHeader() {
  const { locale, setLocale, t } = useLocale();

  const actions: AcrHeaderAction[] = [
    {
      id: "admin",
      label: t("public.header.admin"),
      icon: Shield,
      href: "/admin",
      variant: "default",
    },
  ];

  return (
    <AcrHeader
      title={t("public.header.title")}
      locale={locale}
      onLocaleChange={setLocale}
      languageToggleLabel={t("admin.header.languageToggle")}
      actions={actions}
      borderVariant="gray-300"
    />
  );
}