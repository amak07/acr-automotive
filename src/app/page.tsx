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

export default function HomePage() {
  const [searchTerms, setSearchTerms] = useState<PublicSearchTerms>({
    make: "",
    model: "",
    year: "",
    sku_term: "",
    limit: 15,
    offset: 0,
  });

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
        <PublicSearchFilters
          searchTerms={searchTerms}
          setSearchTerms={setSearchTerms}
        />
        <div className="mt-8">
          <PublicPartsList
            partsData={data?.data || []}
            partsCount={data?.count || 0}
            isDataLoading={isLoading}
            currentPage={currentPage}
            limit={searchTerms.limit}
          />

          {/* Pagination */}
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
