"use client";

import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { DashboardCards } from "@/components/admin/dashboard/DashboardCards";
import { SearchFilters, SearchTerms } from "@/components/admin/parts/SearchFilters";
import { PartsList } from "@/components/admin/parts/PartsList";
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";
import { useState, useEffect } from "react";
import { useGetParts } from "@/hooks";
import { useDebounce } from "use-debounce";

function AdminPage() {
  const [searchTerms, setSearchTerms] = useState<SearchTerms>({
    search: "",
    part_type: "__all__",
    position_type: "__all__",
    abs_type: "__all__",
    drive_type: "__all__",
    bolt_pattern: "__all__",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(25);
  const [debouncedSearchTerm] = useDebounce(searchTerms.search, 300);

  // Reset to first page when search terms change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerms.abs_type,
    searchTerms.bolt_pattern,
    searchTerms.drive_type,
    searchTerms.part_type,
    searchTerms.position_type,
    debouncedSearchTerm,
  ]);

  // Move parts loading state to parent level
  const {
    data: partsResponse,
    isLoading: partsLoading,
    isError: partsError,
  } = useGetParts({
    limit,
    offset: (currentPage - 1) * limit,
    sort_by: "acr_sku",
    sort_order: "asc",
    abs_type: searchTerms.abs_type === "__all__" ? "" : searchTerms.abs_type,
    bolt_pattern: searchTerms.bolt_pattern === "__all__" ? "" : searchTerms.bolt_pattern,
    drive_type: searchTerms.drive_type === "__all__" ? "" : searchTerms.drive_type,
    part_type: searchTerms.part_type === "__all__" ? "" : searchTerms.part_type,
    position_type: searchTerms.position_type === "__all__" ? "" : searchTerms.position_type,
    search: debouncedSearchTerm,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-acr-gray-50 to-acr-gray-100">
      <AdminHeader />

      <main className="px-4 py-8 mx-auto lg:max-w-7xl lg:px-8 space-y-8">
        <DashboardCards />
        <SearchFilters
          searchTerms={searchTerms}
          setSearchTerms={setSearchTerms}
        />
        <PartsList
          searchTerms={searchTerms}
          partsData={partsResponse?.data}
          partsTotal={partsResponse?.count || 0}
          partsLoading={partsLoading}
          partsError={partsError}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          limit={limit}
        />
      </main>
    </div>
  );
}

// Export the wrapped component with admin authentication
export default withAdminAuth(AdminPage);
