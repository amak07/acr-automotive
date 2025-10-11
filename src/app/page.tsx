"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { useMemo } from "react";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import {
  PublicSearchFilters,
  PublicSearchTerms,
} from "@/components/public/search/PublicSearchFilters";
import { PublicPartsList } from "@/components/public/parts/PublicPartsList";
import { AcrPagination } from "@/components/acr";
import { usePublicParts } from "@/hooks";
import { useLocale } from "@/contexts/LocaleContext";
import { CardError } from "@/components/ui/error-states";
import { DEFAULT_PUBLIC_SEARCH_TERMS } from "./constants";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  // Read search terms from URL
  const searchTerms = useMemo<PublicSearchTerms>(() => ({
    make: searchParams?.get('make') || '',
    model: searchParams?.get('model') || '',
    year: searchParams?.get('year') || '',
    sku_term: searchParams?.get('sku') || '',
    limit: DEFAULT_PUBLIC_SEARCH_TERMS.limit,
    offset: parseInt(searchParams?.get('offset') || '0'),
  }), [searchParams]);

  const { data, isLoading, error } = usePublicParts(searchTerms);

  // Pagination calculations
  const currentPage = Math.floor(searchTerms.offset / searchTerms.limit) + 1;
  const totalPages = Math.ceil((data?.count || 0) / searchTerms.limit);

  // Update URL when filters or page changes
  const updateURL = (updates: Partial<PublicSearchTerms>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '' && value !== 0) {
        params.set(key === 'sku_term' ? 'sku' : key, value.toString());
      } else {
        params.delete(key === 'sku_term' ? 'sku' : key);
      }
    });

    // Reset offset if filters changed (not pagination)
    if (!('offset' in updates) && params.toString() !== searchParams?.toString()) {
      params.delete('offset');
    }

    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  const setSearchTerms = (terms: PublicSearchTerms) => {
    updateURL(terms);
  };

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * searchTerms.limit;
    updateURL({ offset: newOffset });
  };

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <PublicHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        <PublicSearchFilters setSearchTerms={setSearchTerms} />

        {/* Error State for Parts Search */}
        {error && (
          <div className="mt-8">
            <CardError
              title={t("public.parts.errorTitle")}
              message={t("public.parts.errorMessage")}
            />
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
              <AcrPagination
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
