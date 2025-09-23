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

            {/* Admin Access - Hidden on small mobile, visible on larger screens */}
            <Link
              href="/admin"
              className="hidden sm:block text-sm text-acr-gray-600 hover:text-acr-red-600 transition-colors"
            >
              {t("public.header.admin")}
            </Link>

            {/* Mobile Admin Access - Icon only on very small screens */}
            <Link
              href="/admin"
              className="sm:hidden text-acr-gray-600 hover:text-acr-red-600 transition-colors p-2 min-h-[32px] flex items-center"
              title={t("public.header.admin")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}