"use client";

import Link from "next/link";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { useLocale } from "@/contexts/LocaleContext";

export function PublicHeader() {
  const { locale, setLocale, t } = useLocale();

  return (
    <header className="bg-white border-b border-acr-gray-300">
      <div className="px-4 py-3 max-w-md mx-auto lg:max-w-6xl lg:px-8 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <AcrLogo className="h-7 lg:h-8 flex-shrink-0" />
            <h1 className="text-lg lg:text-xl font-semibold text-acr-gray-800 truncate">
              {t("public.header.title")}
            </h1>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            {/* Language Toggle - Compact on mobile */}
            <div className="flex items-center bg-acr-gray-50 rounded-lg p-0.5 lg:p-1 border">
              <button
                onClick={() => setLocale("en")}
                className={`px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all duration-200 min-h-[32px] lg:min-h-auto ${
                  locale === "en"
                    ? "bg-white text-acr-blue-600 shadow-sm"
                    : "text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => setLocale("es")}
                className={`px-2 py-1 lg:px-3 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all duration-200 min-h-[32px] lg:min-h-auto ${
                  locale === "es"
                    ? "bg-white text-acr-red-600 shadow-sm"
                    : "text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100"
                }`}
                title="Cambiar a Español"
              >
                ES
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}