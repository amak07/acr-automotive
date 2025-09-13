"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { MoreVertical, Plus, Loader2 } from "lucide-react";
import { useGetParts } from "@/hooks/useGetParts";
import { createPartsTableColumns } from "./parts-table-config";
import { AdminPagination } from "./AdminPagination";
import { useState } from "react";
import { SearchTerms } from "./SearchFilters";
import { useDebounce } from "use-debounce";

type PartsListProps = {
  searchTerms: SearchTerms;
};

export function PartsList(props: PartsListProps) {
  const { t } = useLocale();
  const {
    searchTerms: {
      abs_type,
      bolt_pattern,
      drive_type,
      part_type,
      position_type,
      search,
    },
  } = props;
  const [debouncedSearchTerm] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);
  const {
    data: response,
    isLoading,
    isError,
  } = useGetParts({
    limit,
    offset: (currentPage - 1) * limit,
    sort_by: "acr_sku",
    sort_order: "asc",
    abs_type,
    bolt_pattern,
    drive_type,
    part_type,
    position_type,
    search: debouncedSearchTerm,
  });
  const data = response?.data;
  const total = response?.count || 0;
  const totalPages = Math.ceil(total / limit);
  const tableColumns = createPartsTableColumns(t);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-acr-gray-800">
          {t("admin.dashboard.catalogTitle")}
        </h2>
        <button className="bg-acr-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-acr-red-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t("admin.parts.newButton")}
        </button>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-acr-red-600" />
            <p className="text-sm text-acr-gray-500">{t("common.loading")}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
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
      {!isLoading && !isError && (
        <div className="lg:hidden space-y-3">
          {data?.map((part) => (
            <div
              key={part.id}
              className="bg-white p-3 rounded-lg border border-acr-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2 items-center">
                  <span className="bg-acr-gray-100 text-acr-gray-800 px-2 py-1 rounded text-xs font-mono font-medium">
                    {part.acr_sku}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    {part.part_type}
                  </span>
                </div>
                <button
                  onClick={() => {
                    console.log("Navigate to part details:", part.id);
                  }}
                  className="text-acr-red-600 hover:text-acr-red-700 text-xs font-medium"
                >
                  {t("common.actions.view")}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-acr-gray-600">
                <div className="flex items-center gap-4">
                  <span>
                    <span className="font-medium text-acr-gray-900">{part.vehicle_count || 0}</span> VA
                  </span>
                  <span>
                    <span className="font-medium text-acr-gray-900">{part.cross_reference_count || 0}</span> CR
                  </span>
                </div>
                {(part.position_type || part.abs_type || part.drive_type || part.bolt_pattern) && (
                  <div className="text-xs text-acr-gray-500 truncate max-w-[120px]">
                    {[part.position_type, part.abs_type, part.drive_type, part.bolt_pattern]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View (hidden on mobile) */}
      {!isLoading && !isError && (
        <div className="hidden lg:block bg-white rounded-lg border border-acr-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-acr-gray-50 border-b border-acr-gray-200">
              <tr>
                {tableColumns.map((item) => (
                  <th
                    key={item.key}
                    className={`py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider ${
                      item.key === "vehicle_count" ||
                      item.key === "cross_reference_count" ||
                      item.key === "data_summary"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {item.label ? t(item.label) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-acr-gray-100 bg-white">
              {data?.map((part) => (
                <tr
                  key={part.id}
                  className="hover:bg-acr-gray-25 transition-colors"
                >
                  {tableColumns.map((column) => (
                    <td key={column.key} className="py-3 px-4">
                      {column.render(
                        part[column.key as keyof typeof part],
                        part
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
