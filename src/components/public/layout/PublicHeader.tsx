"use client";

import { useState } from "react";
import Link from "next/link";
import { AcrLogo } from "@/components/ui/AcrLogo";
import { useLocale } from "@/contexts/LocaleContext";
import { Menu, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { locale, setLocale, t } = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={cn("border-b border-acr-gray-300 transition-colors", isMobileMenuOpen ? "bg-acr-gray-50" : "bg-white")}>
      <div className="px-4 py-3 max-w-md mx-auto lg:max-w-6xl lg:px-8 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <AcrLogo className="h-7 lg:h-8 flex-shrink-0" />
            <h1 className="text-lg lg:text-xl font-semibold text-acr-gray-800 truncate">
              {t("public.header.title")}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0">
            {/* Admin Link */}
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-acr-gray-600 hover:text-acr-blue-600 hover:bg-acr-gray-50 rounded-md transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              {t("public.header.admin")}
            </Link>

            {/* Language Toggle */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-acr-gray-200">
            <div className="space-y-3">
              {/* Admin Link */}
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-acr-gray-600 hover:text-acr-blue-600 hover:bg-acr-gray-50 rounded-md transition-all duration-200"
              >
                <Shield className="w-4 h-4" />
                {t("public.header.admin")}
              </Link>

              {/* Language Selection - Footer */}
              <div className="pt-3 mt-3 border-t border-acr-gray-200">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-acr-gray-700">
                      {t("admin.header.languageToggle")}
                    </span>
                  </div>
                  <div className="flex items-center bg-acr-gray-50 rounded-lg p-1 border w-fit">
                    <button
                      onClick={() => {
                        setLocale("en");
                        closeMobileMenu();
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        locale === "en"
                          ? "bg-white text-acr-blue-600 shadow-sm"
                          : "text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => {
                        setLocale("es");
                        closeMobileMenu();
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        locale === "es"
                          ? "bg-white text-acr-red-600 shadow-sm"
                          : "text-acr-gray-600 hover:text-acr-gray-800 hover:bg-acr-gray-100"
                      }`}
                    >
                      ES
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}