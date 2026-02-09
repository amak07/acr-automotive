"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { ChevronDown, ChevronUp, FileText, ArrowRight } from "lucide-react";
import { AcrCard, AcrButton, AcrSpinner } from "@/components/acr";
import { cn } from "@/lib/utils";

interface ImportHistoryPanelProps {
  history: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    rowsImported: number;
    importSummary: {
      adds: number;
      updates: number;
      deletes: number;
    } | null;
    createdAt: string;
  }>;
  isLoading: boolean;
}

export function ImportHistoryPanel({
  history,
  isLoading,
}: ImportHistoryPanelProps) {
  const { locale, t } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render anything if there's no history and we're not loading
  if (history.length === 0 && !isLoading) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === "es" ? "es" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formatDate = (dateString: string): string => {
    try {
      return dateFormatter.format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <section className="acr-animate-fade-up">
      <AcrCard variant="outlined" padding="none">
        {/* Collapsible header — always visible */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            "w-full flex items-center justify-between p-4 cursor-pointer",
            "hover:bg-acr-gray-50 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acr-red-500 focus-visible:ring-inset",
            "min-h-[44px]"
          )}
          aria-expanded={isExpanded}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-acr-gray-900">
            <FileText className="w-4 h-4 text-acr-gray-500" aria-hidden="true" />
            {t("admin.import.history.recentImports")}
            {!isLoading && history.length > 0 && (
              <span className="px-1.5 py-0.5 bg-acr-gray-100 text-acr-gray-600 rounded-full text-xs font-medium">
                {history.length}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-acr-gray-500">
            <span className="hidden sm:inline">
              {isExpanded
                ? t("admin.import.history.hideHistory")
                : t("admin.import.history.showHistory")}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div>
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center gap-3 px-4 py-8 border-t border-acr-gray-200">
                <AcrSpinner size="sm" color="gray" />
              </div>
            )}

            {/* Empty state (loading finished, but no history) */}
            {!isLoading && history.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-t border-acr-gray-200 text-acr-gray-500">
                <FileText className="w-8 h-8 text-acr-gray-300" aria-hidden="true" />
                <p className="text-sm">{t("admin.import.history.noHistory")}</p>
              </div>
            )}

            {/* History items */}
            {!isLoading && history.length > 0 && (
              <div>
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-t border-acr-gray-200 hover:bg-acr-gray-50/50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-acr-gray-900 truncate">
                      {item.fileName}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                      <span className="text-xs text-acr-gray-500">
                        {formatDate(item.createdAt)}
                      </span>
                      {item.importSummary && (
                        <>
                          <span className="text-acr-gray-300" aria-hidden="true">
                            &bull;
                          </span>
                          {item.importSummary.adds > 0 && (
                            <span className="text-xs font-semibold text-green-700">
                              +{item.importSummary.adds} {t("admin.import.history.added")}
                            </span>
                          )}
                          {item.importSummary.updates > 0 && (
                            <span className="text-xs font-semibold text-blue-700">
                              ~{item.importSummary.updates} {t("admin.import.history.updated")}
                            </span>
                          )}
                          {item.importSummary.deletes > 0 && (
                            <span className="text-xs font-semibold text-red-700">
                              -{item.importSummary.deletes} {t("admin.import.history.deleted")}
                            </span>
                          )}
                          {item.importSummary.adds === 0 &&
                            item.importSummary.updates === 0 &&
                            item.importSummary.deletes === 0 && (
                              <span className="text-xs text-acr-gray-400">
                                {t("admin.import.history.noChanges")}
                              </span>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* View Full History link */}
                <div className="border-t border-acr-gray-200 p-3 flex justify-center">
                  <AcrButton variant="link" size="sm" asChild>
                    <Link href="/admin/settings">
                      {t("admin.import.history.viewAll")}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                    </Link>
                  </AcrButton>
                </div>
              </div>
            )}
          </div>
        )}
      </AcrCard>
    </section>
  );
}
