"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { Download } from "lucide-react";
import { createAcrPartsTableColumns } from "./parts-table-config";
import { AcrPagination } from "@/components/acr";
import { SearchTerms } from "./SearchFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { AcrButton, AcrTable } from "@/components/acr";
import { SkeletonAdminPartsList } from "@/components/ui/skeleton";
import { PartSummary } from "@/types";

type PartsListProps = {
  searchTerms: SearchTerms;
  partsData?: PartSummary[];
  partsTotal: number;
  partsLoading: boolean;
  partsError: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  limit: number;
};

export function PartsList(props: PartsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const {
    partsData,
    partsTotal,
    partsLoading,
    partsError,
    currentPage,
    onPageChange,
    limit,
  } = props;

  const currentSearch = searchParams?.toString() || "";
  const totalPages = Math.ceil(partsTotal / limit);
  const acrTableColumns = createAcrPartsTableColumns(t, router, searchParams);

  const handleExport = () => {
    // Build query string from current search params
    const params = new URLSearchParams();

    // Only add non-default search terms to export URL
    Object.entries(props.searchTerms).forEach(([key, value]) => {
      if (value && value !== "__all__" && value !== "") {
        params.set(key, value);
      }
    });

    // Trigger download
    const queryString = params.toString();
    const url = queryString
      ? `/api/admin/export?${queryString}`
      : "/api/admin/export";

    window.location.href = url;
  };

  // Check if any filters are active
  const hasFilters = Object.values(props.searchTerms).some(
    (value) => value && value !== "__all__" && value !== ""
  );

  return (
    <div className="acr-animate-fade-up" style={{ animationDelay: "0.9s" }}>
      <div className="flex items-center justify-between mb-4 lg:mb-4">
        <h2 className="text-base font-semibold text-acr-gray-800 lg:text-lg">
          {t("admin.dashboard.catalogTitle")}
        </h2>
        {/* Keep only Export button - other actions are in QuickActions */}
        <AcrButton variant="secondary" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="hidden sm:inline">
            {hasFilters
              ? `Export Results (${partsTotal})`
              : `Export All (${partsTotal})`}
          </span>
          <span className="sm:hidden">{partsTotal}</span>
        </AcrButton>
      </div>

      {/* Error State */}
      {partsError && !partsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">
              {t("common.error.generic")}
            </p>
            <p className="text-xs text-acr-gray-500">
              {t("common.error.tryAgain")}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Cards View (hidden on desktop) */}
      {!partsError && (
        <div className="lg:hidden space-y-3">
          {/* Mobile Loading State */}
          {partsLoading && <SkeletonAdminPartsList />}

          {/* Mobile Data */}
          {!partsLoading &&
            partsData?.map((part, index) => (
              <div
                key={part.id}
                onClick={() => {
                  router.push(
                    `/admin/parts/${encodeURIComponent(part.acr_sku)}${currentSearch ? `?${currentSearch}` : ""}` as any
                  );
                }}
                className="bg-white rounded-lg border border-acr-gray-200 p-4 hover:border-acr-red-300 hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)] transition-all duration-300 cursor-pointer active:scale-[0.98] acr-animate-fade-up focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2"
                style={{
                  animationDelay: `${0.7 + (index % 12) * 0.05}s`,
                }}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(
                      `/admin/parts/${encodeURIComponent(part.acr_sku)}${currentSearch ? `?${currentSearch}` : ""}` as any
                    );
                  }
                }}
              >
                {/* Header - SKU and Part Type */}
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-acr-red-50 text-acr-red-700 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                    {part.acr_sku}
                  </span>
                  <span className="text-xs text-acr-gray-600 font-medium">
                    {part.part_type}
                  </span>
                </div>

                {/* Stats and Specs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-acr-gray-600">
                    <span className="flex items-center gap-1">
                      <strong className="text-acr-gray-900 font-semibold">
                        {part.vehicle_count || 0}
                      </strong>
                      <span>{t("admin.parts.vehicles")}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <strong className="text-acr-gray-900 font-semibold">
                        {part.cross_reference_count || 0}
                      </strong>
                      <span>{t("admin.parts.references")}</span>
                    </span>
                  </div>

                  {/* Chevron indicator */}
                  <div className="shrink-0">
                    <svg
                      className="w-5 h-5 text-acr-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Specifications - if exist */}
                {(part.position_type ||
                  part.abs_type ||
                  part.drive_type ||
                  part.bolt_pattern) && (
                  <div className="mt-2 pt-2 border-t border-acr-gray-100">
                    <div className="text-xs text-acr-gray-500">
                      {[
                        part.position_type,
                        part.abs_type,
                        part.drive_type,
                        part.bolt_pattern,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden lg:block">
        <AcrTable
          data={partsData || []}
          columns={acrTableColumns}
          isLoading={partsLoading}
          rowClassName="group hover:bg-gradient-to-r hover:from-acr-red-50/30 hover:to-transparent hover:shadow-sm transition-all duration-200 cursor-pointer"
          onRowClick={(part: PartSummary) => {
            router.push(
              `/admin/parts/${encodeURIComponent(part.acr_sku)}${currentSearch ? `?${currentSearch}` : ""}` as any
            );
          }}
          emptyMessage={
            <div className="text-center py-8">
              <p className="text-acr-gray-500 mb-2">
                {t("common.error.generic")}
              </p>
              <p className="text-xs text-acr-gray-400">
                {t("common.error.tryAgain")}
              </p>
            </div>
          }
          className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden shadow-sm"
        />
      </div>

      {/* Pagination */}
      {!partsLoading && !partsError && (
        <div className="mt-6">
          <AcrPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={partsTotal}
            limit={limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
