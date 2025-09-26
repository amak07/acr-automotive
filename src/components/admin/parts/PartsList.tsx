"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { Plus } from "lucide-react";
import {  createAcrPartsTableColumns } from "./parts-table-config";
import { AcrPagination } from "@/components/acr";
import { SearchTerms } from "./SearchFilters";
import { useRouter } from "next/navigation";
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

  const totalPages = Math.ceil(partsTotal / limit);
  const acrTableColumns = createAcrPartsTableColumns(t, router);

  const handleAddNewPartNavigation = () => {
    router.push("/admin/parts/add-new-part" as any);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-acr-gray-800">
          {t("admin.dashboard.catalogTitle")}
        </h2>
        <AcrButton
          variant="primary"
          size="default"
          onClick={handleAddNewPartNavigation}
        >
          <Plus className="w-4 h-4" />
          {t("admin.parts.newButton")}
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
          {!partsLoading && partsData?.map((part) => (
            <div
              key={part.id}
              onClick={() => {
                router.push(`/admin/parts/${part.id}` as any);
              }}
              className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden hover:shadow-md hover:border-acr-gray-300 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-acr-red-50 text-acr-red-700 px-3 py-1.5 rounded-md text-sm font-mono font-semibold">
                      {part.acr_sku}
                    </span>
                    <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded text-xs font-medium">
                      {part.part_type}
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-acr-gray-900">
                        {part.vehicle_count || 0}
                      </div>
                      <div className="text-xs text-acr-gray-500 uppercase tracking-wider">
                        {t("admin.parts.vehicles")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-acr-gray-900">
                        {part.cross_reference_count || 0}
                      </div>
                      <div className="text-xs text-acr-gray-500 uppercase tracking-wider">
                        {t("admin.parts.references")}
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  {(part.position_type ||
                    part.abs_type ||
                    part.drive_type ||
                    part.bolt_pattern) && (
                    <div className="text-right">
                      <div className="text-xs text-acr-gray-500 leading-relaxed">
                        {[
                          part.position_type,
                          part.abs_type,
                          part.drive_type,
                          part.bolt_pattern,
                        ]
                          .filter(Boolean)
                          .map((spec, index) => (
                            <div key={index}>{spec}</div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area */}
              <div className="bg-acr-gray-50 px-4 py-3 border-t border-acr-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-acr-gray-700">
                    {t("common.actions.view")}
                  </span>
                  <div className="w-5 h-5 rounded-full bg-acr-red-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
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
          emptyMessage={
            <div className="text-center py-8">
              <p className="text-acr-gray-500 mb-2">{t("common.error.generic")}</p>
              <p className="text-xs text-acr-gray-400">{t("common.error.tryAgain")}</p>
            </div>
          }
          className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden shadow-sm"
        />
      </div>

      {/* Pagination */}
      {!partsLoading && !partsError && (
        <AcrPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={partsTotal}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
