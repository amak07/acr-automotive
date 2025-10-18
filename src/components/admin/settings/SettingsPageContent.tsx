"use client";

import { Settings, LogOut, Mail, Palette, ArrowLeft } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useRouter } from "next/navigation";
import { AcrButton, AcrLanguageToggle } from "@/components/acr";
import { ContactInfoSettings } from "./ContactInfoSettings";
import { BrandingSettings } from "./BrandingSettings";

export function SettingsPageContent() {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("admin-authenticated");
    router.push("/");
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center text-sm text-acr-gray-600 hover:text-acr-red-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t("admin.settings.back")}
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-7 h-7 md:w-8 md:h-8 text-acr-red-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-acr-gray-900">
                {t("admin.settings.title")}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Language Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-acr-gray-700">
                  {t("admin.settings.language")}
                </span>
                <AcrLanguageToggle
                  locale={locale}
                  onLocaleChange={setLocale}
                  size="default"
                />
              </div>

              {/* Logout Button */}
              <AcrButton
                variant="destructive"
                onClick={handleLogout}
                className="gap-2 w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                {t("admin.settings.logout")}
              </AcrButton>
            </div>
          </div>
          <p className="text-sm md:text-base text-acr-gray-600">
            {t("admin.settings.description")}
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Contact Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-acr-red-600" />
              <h2 className="text-2xl font-semibold text-acr-gray-900">
                {t("admin.settings.contactInfo.title")}
              </h2>
            </div>
            <ContactInfoSettings />
          </section>

          {/* Branding Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-acr-red-600" />
              <h2 className="text-2xl font-semibold text-acr-gray-900">
                {t("admin.settings.branding.title")}
              </h2>
            </div>
            <BrandingSettings />
          </section>
        </div>
      </div>
    </main>
  );
}
