"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import {
  PublicSearchFilters,
  PublicSearchTerms,
} from "@/components/public/search/PublicSearchFilters";
import { PublicPartsList } from "@/components/public/parts/PublicPartsList";
import { AdminPagination } from "@/components/admin/layout/AdminPagination";
import { usePublicParts } from "@/hooks";
import { useLocale } from "@/contexts/LocaleContext";
import { DEFAULT_PUBLIC_SEARCH_TERMS } from "./constants";

export default function HomePage() {
  const [searchTerms, setSearchTerms] = useState<PublicSearchTerms>({
    ...DEFAULT_PUBLIC_SEARCH_TERMS,
  });
  const { t } = useLocale();

  const { data, isLoading, error } = usePublicParts(searchTerms);

  // Pagination calculations
  const currentPage = Math.floor(searchTerms.offset / searchTerms.limit) + 1;
  const totalPages = Math.ceil((data?.count || 0) / searchTerms.limit);

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * searchTerms.limit;
    setSearchTerms((prev) => ({
      ...prev,
      offset: newOffset,
    }));
  };

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <PublicHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        <PublicSearchFilters setSearchTerms={setSearchTerms} />

        {/* Error State for Parts Search */}
        {error && (
          <div className="mt-8">
            <div className="bg-white p-6 rounded-lg border border-red-300 shadow-md">
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  {t("public.parts.errorTitle")}
                </h3>
                <p className="text-red-600 text-sm">
                  {t("public.parts.errorMessage")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <PublicPartsList
            partsData={data?.data || []}
            partsCount={data?.count || 0}
            isDataLoading={isLoading}
            currentPage={currentPage}
            limit={searchTerms.limit}
          />
          {data && data.count > searchTerms.limit && (
            <div className="mt-8">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={data.count}
                limit={searchTerms.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
