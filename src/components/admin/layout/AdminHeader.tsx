"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { ExternalLink, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { AcrHeader, type AcrHeaderAction } from "@/components/acr";

export function AdminHeader() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("admin-authenticated");
    router.push("/");
  };

  const actions: AcrHeaderAction[] = [
    {
      id: "view-public",
      label: t("admin.header.viewPublic"),
      icon: ExternalLink,
      href: "/",
      variant: "default",
    },
    {
      id: "logout",
      label: "Logout",
      icon: LogOut,
      variant: "danger",
      asButton: true,
      onClick: handleLogout,
      title: "Logout",
    },
  ];

  return (
    <AcrHeader
      title={t("admin.header.title")}
      locale={locale}
      onLocaleChange={setLocale}
      languageToggleLabel={t("admin.header.languageToggle")}
      actions={actions}
      borderVariant="gray-200"
    />
  );
}
