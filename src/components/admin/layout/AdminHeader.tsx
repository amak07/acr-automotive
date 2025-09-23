"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrLogo } from "@/components/ui/AcrLogo";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function AdminHeader() {
  const { locale, setLocale, t } = useLocale();

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

          <div className="flex items-center gap-4">
            {/* View Public Site Link */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-acr-gray-600 hover:text-acr-blue-600 hover:bg-acr-gray-50 rounded-md transition-all duration-200"
            >
              <ExternalLink className="w-4 h-4" />
              {t("admin.header.viewPublic")}
            </Link>

            {/* Language Toggle */}
            <div className="flex items-center bg-acr-gray-50 rounded-lg p-1 border">
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
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
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                locale === "es"
                  ? "bg-white text-acr-blue-600 shadow-sm"
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
