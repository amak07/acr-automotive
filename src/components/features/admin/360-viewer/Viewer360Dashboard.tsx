"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  RotateCw,
  ExternalLink,
  Settings,
  CheckCircle,
  Info,
  Filter,
} from "lucide-react";
import { AcrCard } from "@/components/acr";
import { AcrSpinner } from "@/components/acr/Spinner";
import { cn } from "@/lib/utils";
import { getStaggerClass } from "@/lib/animations";

interface Part360Status {
  id: string;
  acr_sku: string;
  has_360_viewer: boolean;
  viewer_360_frame_count: number | null;
}

export function Viewer360Dashboard() {
  const { t } = useLocale();
  const [filterMissing, setFilterMissing] = useState(false);

  const { data: parts, isLoading } = useQuery<Part360Status[]>({
    queryKey: ["parts-360-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id, acr_sku, has_360_viewer, viewer_360_frame_count")
        .order("acr_sku", { ascending: true });

      if (error) throw error;
      return (data as Part360Status[]) ?? [];
    },
  });

  const totalParts = parts?.length ?? 0;
  const partsWithViewer =
    parts?.filter((p) => p.has_360_viewer).length ?? 0;

  const filteredParts = filterMissing
    ? parts?.filter((p) => !p.has_360_viewer) ?? []
    : parts ?? [];

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 acr-animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <RotateCw className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="acr-brand-heading-2xl text-acr-gray-900">
              {t("admin.viewer360.title")}
            </h1>
          </div>
        </div>
        <p className="text-acr-gray-600 mt-1">
          {t("admin.viewer360.description")}
        </p>
      </div>

      {/* How it works card */}
      <AcrCard
        className={cn(
          "mb-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",
          "acr-animate-fade-up acr-stagger-1"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-blue-900 mb-3 text-base">
              {t("admin.viewer360.howItWorks")}
            </h2>
            <ol className="space-y-2">
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </span>
                <span>{t("admin.viewer360.step1")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </span>
                <span>{t("admin.viewer360.step2")}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-blue-800">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </span>
                <span>{t("admin.viewer360.step3")}</span>
              </li>
            </ol>
          </div>
        </div>
      </AcrCard>

      {/* Stats bar + filter toggle */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6",
          "acr-animate-fade-up acr-stagger-2"
        )}
      >
        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
            {isLoading ? (
              <AcrSpinner size="xs" color="gray" inline />
            ) : (
              <>
                {partsWithViewer} / {totalParts}{" "}
                {t("admin.viewer360.statsLabel")}
              </>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-1 bg-acr-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilterMissing(false)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              !filterMissing
                ? "bg-white text-acr-gray-900 shadow-sm"
                : "text-acr-gray-500 hover:text-acr-gray-700"
            )}
          >
            {t("admin.viewer360.filterAll")}
          </button>
          <button
            onClick={() => setFilterMissing(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              filterMissing
                ? "bg-white text-acr-gray-900 shadow-sm"
                : "text-acr-gray-500 hover:text-acr-gray-700"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {t("admin.viewer360.filterMissing")}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <AcrSpinner size="lg" color="primary" />
        </div>
      )}

      {/* Parts list */}
      {!isLoading && filteredParts.length > 0 && (
        <AcrCard
          className={cn("p-4 lg:p-5", "acr-animate-fade-up acr-stagger-3")}
        >
          <div className="space-y-2">
            {filteredParts.map((part, index) => (
              <div
                key={part.id}
                className={cn(
                  "flex items-center gap-4 p-3 lg:p-4 rounded-xl transition-all duration-300",
                  "border",
                  part.has_360_viewer
                    ? "bg-green-50/50 border-green-200"
                    : "bg-acr-gray-50 border-transparent hover:border-acr-gray-200",
                  "acr-animate-fade-up",
                  getStaggerClass(index)
                )}
              >
                {/* SKU */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-acr-gray-900 text-sm lg:text-base font-mono">
                    {part.acr_sku}
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {part.has_360_viewer ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t("admin.viewer360.confirmed")} (
                      {part.viewer_360_frame_count ?? 0}{" "}
                      {t("admin.viewer360.frames")})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-acr-gray-100 text-acr-gray-500 rounded-full text-xs font-medium">
                      {t("admin.viewer360.notUploaded")}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {part.has_360_viewer && (
                    <Link
                      href={`/parts/${part.acr_sku}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                        "bg-acr-gray-100 text-acr-gray-700 hover:bg-acr-gray-200 hover:text-acr-gray-900",
                        "transition-all duration-200"
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {t("admin.viewer360.viewPublicPage")}
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/admin/parts/${part.acr_sku}?tab=360viewer`}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800",
                      "transition-all duration-200"
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {t("admin.viewer360.manageFrames")}
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </AcrCard>
      )}

      {/* Empty state */}
      {!isLoading && filteredParts.length === 0 && (
        <div
          className={cn(
            "text-center py-16 rounded-xl border-2 border-dashed border-acr-gray-200",
            "acr-animate-fade-up acr-stagger-3"
          )}
        >
          <div className="w-20 h-20 rounded-2xl bg-acr-gray-100 flex items-center justify-center mx-auto mb-4">
            <RotateCw className="h-10 w-10 text-acr-gray-400" />
          </div>
          <p className="text-acr-gray-600 font-medium mb-1">
            {t("admin.viewer360.emptyTitle")}
          </p>
          <p className="text-sm text-acr-gray-400">
            {t("admin.viewer360.emptyDescription")}
          </p>
        </div>
      )}
    </main>
  );
}
