"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrCard, AcrCardContent } from "@/components/acr/Card";
import { AcrSpinner } from "@/components/acr/Spinner";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import {
  Upload,
  Download,
  BookOpen,
  FileSpreadsheet,
  ImageIcon,
  ImagePlus,
  ArrowRight,
  Sparkles,
  Shield,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaggerClass } from "@/lib/animations";

/**
 * DataPortal - Dashboard interface for data managers
 *
 * Provides quick actions for data management (Import, Export)
 * and links to relevant documentation.
 */
export default function DataPortalPage() {
  const router = useRouter();
  const { user, profile, isLoading, isAdmin } = useAuth();
  const { t, locale } = useLocale();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AcrSpinner size="lg" color="primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    router.push("/login?redirect=/data-portal");
    return null;
  }

  // Get first name for greeting
  const firstName =
    profile.full_name?.split(" ")[0] || profile.email.split("@")[0];

  return (
    <div>
      <AppHeader variant="data-portal" />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:px-6 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10 acr-animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-acr-red-500" />
            <span className="text-sm font-medium text-acr-red-600 uppercase tracking-wide">
              {t("portal.title")}
            </span>
          </div>
          <h1 className="acr-brand-heading-2xl text-acr-gray-900 mb-2">
            {t("portal.welcome")}, {firstName}
          </h1>
          <p className="text-acr-gray-600 text-lg">{t("portal.description")}</p>
        </div>

        {/* Admin Dashboard Banner (admin only) */}
        {isAdmin && (
          <AcrCard
            variant="interactive"
            className={cn(
              "mb-8 cursor-pointer group acr-animate-fade-up",
              "border-acr-gray-200 hover:border-acr-red-300"
            )}
            onClick={() => router.push("/admin")}
            style={{ animationDelay: "0.6s" }}
          >
            <AcrCardContent className="p-4 lg:p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-acr-red-100 flex items-center justify-center shrink-0 group-hover:bg-acr-red-600 transition-colors duration-300">
                  <Shield className="w-5 h-5 text-acr-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-acr-gray-900 text-sm group-hover:text-acr-red-600 transition-colors">
                    {t("portal.adminBanner.title")}
                  </h3>
                  <p className="text-xs text-acr-gray-500">
                    {t("portal.adminBanner.description")}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-acr-gray-400 group-hover:text-acr-red-500 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
              </div>
            </AcrCardContent>
          </AcrCard>
        )}

        {/* Quick Actions Section */}
        <section className="mb-12">
          <h2
            className="acr-brand-heading-lg text-acr-gray-900 mb-4 acr-animate-fade-up"
            style={{ animationDelay: "0.75s" }}
          >
            {t("portal.quickActions")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            {/* Import Card */}
            <AcrCard
              variant="interactive"
              className={cn(
                "cursor-pointer group acr-animate-fade-up",
                getStaggerClass(0)
              )}
              onClick={() => router.push("/data-portal/import")}
            >
              <AcrCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-acr-red-100 to-acr-red-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Upload className="w-5 h-5 text-acr-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-acr-gray-900 text-sm">
                      {t("portal.import.title")}
                    </h3>
                    <p className="text-acr-gray-500 text-xs mt-0.5">
                      {t("portal.import.description")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-acr-gray-400 group-hover:text-acr-red-500 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </AcrCardContent>
            </AcrCard>

            {/* Export Card */}
            <AcrCard
              variant="interactive"
              className={cn(
                "cursor-pointer group acr-animate-fade-up",
                getStaggerClass(1)
              )}
              onClick={() => (window.location.href = `/api/admin/export?locale=${locale}`)}
            >
              <AcrCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-acr-gray-900 text-sm">
                      {t("portal.export.title")}
                    </h3>
                    <p className="text-acr-gray-500 text-xs mt-0.5">
                      {t("portal.export.description")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-acr-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </AcrCardContent>
            </AcrCard>

            {/* Upload Images Card */}
            <AcrCard
              variant="interactive"
              className={cn(
                "cursor-pointer group acr-animate-fade-up",
                getStaggerClass(2)
              )}
              onClick={() => router.push("/data-portal/upload-images")}
            >
              <AcrCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <ImagePlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-acr-gray-900 text-sm">
                      {t("portal.uploadImages.title")}
                    </h3>
                    <p className="text-acr-gray-500 text-xs mt-0.5">
                      {t("portal.uploadImages.description")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-acr-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </AcrCardContent>
            </AcrCard>

            {/* 360° Viewer Card */}
            <AcrCard
              variant="interactive"
              className={cn(
                "cursor-pointer group acr-animate-fade-up",
                getStaggerClass(3)
              )}
              onClick={() => router.push("/data-portal/360-viewer")}
            >
              <AcrCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <RotateCw className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-acr-gray-900 text-sm">
                      {t("portal.viewer360.title")}
                    </h3>
                    <p className="text-acr-gray-500 text-xs mt-0.5">
                      {t("portal.viewer360.description")}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-acr-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </AcrCardContent>
            </AcrCard>
          </div>
        </section>

        {/* Documentation Section */}
        <section>
          <div
            className="flex items-center gap-2 mb-4 acr-animate-fade-up"
            style={{ animationDelay: "0.9s" }}
          >
            <BookOpen className="w-5 h-5 text-acr-gray-500" />
            <h2 className="acr-brand-heading-lg text-acr-gray-900">
              {t("portal.docs.title")}
            </h2>
          </div>
          <p
            className="text-acr-gray-600 mb-6 acr-animate-fade-up"
            style={{ animationDelay: "0.95s" }}
          >
            {t("portal.docs.description")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Importing Data Doc */}
            <Link
              href="/docs/admin-guide/importing-data"
              className={cn(
                "group bg-white rounded-xl border border-acr-gray-200 p-5",
                "hover:border-acr-gray-300 hover:shadow-md transition-all duration-200",
                "acr-animate-fade-up"
              )}
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-acr-gray-900 text-sm mb-1 group-hover:text-acr-red-600 transition-colors">
                    {t("portal.docs.importing")}
                  </h3>
                  <p className="text-xs text-acr-gray-500 leading-relaxed">
                    {t("portal.docs.importingDesc")}
                  </p>
                </div>
              </div>
            </Link>

            {/* Exporting Data Doc */}
            <Link
              href="/docs/admin-guide/exporting-data"
              className={cn(
                "group bg-white rounded-xl border border-acr-gray-200 p-5",
                "hover:border-acr-gray-300 hover:shadow-md transition-all duration-200",
                "acr-animate-fade-up"
              )}
              style={{ animationDelay: "1.05s" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-acr-gray-900 text-sm mb-1 group-hover:text-acr-red-600 transition-colors">
                    {t("portal.docs.exporting")}
                  </h3>
                  <p className="text-xs text-acr-gray-500 leading-relaxed">
                    {t("portal.docs.exportingDesc")}
                  </p>
                </div>
              </div>
            </Link>

            {/* Managing Images Doc */}
            <Link
              href="/docs/admin-guide/managing-images"
              className={cn(
                "group bg-white rounded-xl border border-acr-gray-200 p-5",
                "hover:border-acr-gray-300 hover:shadow-md transition-all duration-200",
                "acr-animate-fade-up"
              )}
              style={{ animationDelay: "1.1s" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-acr-gray-900 text-sm mb-1 group-hover:text-acr-red-600 transition-colors">
                    {t("portal.docs.images")}
                  </h3>
                  <p className="text-xs text-acr-gray-500 leading-relaxed">
                    {t("portal.docs.imagesDesc")}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* View All Docs Link */}
          <div
            className="mt-6 text-center acr-animate-fade-up"
            style={{ animationDelay: "1.15s" }}
          >
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-sm font-medium text-acr-gray-600 hover:text-acr-red-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {t("portal.docs.viewAll")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Help Text */}
        <p
          className="text-center text-sm text-acr-gray-500 mt-12 acr-animate-fade-up"
          style={{ animationDelay: "1.2s" }}
        >
          {t("portal.helpText")}
        </p>
      </main>
    </div>
  );
}
