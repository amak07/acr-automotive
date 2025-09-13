"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrLogo } from "@/components/ui/AcrLogo";

export function AdminHeader() {
  const { locale, setLocale, isDevMode, t } = useLocale();

  return (
    <header className="bg-white border-b border-acr-gray-200">
      <div className="px-4 py-4 max-w-md mx-auto lg:max-w-6xl lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcrLogo className="h-8" />
            <h1 className="text-xl font-semibold text-acr-gray-800">
              {t("admin.header.title")}
            </h1>
          </div>

          {/* Language Toggle - Only in Development */}
          {isDevMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-acr-gray-500">DEV</span>
              <button
                onClick={() => setLocale(locale === "en" ? "es" : "en")}
                className="px-2 py-1 text-sm font-medium bg-acr-gray-100 hover:bg-acr-gray-200 rounded transition-colors"
                title={t("admin.header.languageToggle")}
              >
                {locale.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
