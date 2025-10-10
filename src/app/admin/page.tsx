"use client";

import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { DashboardCards } from "@/components/admin/dashboard/DashboardCards";
import { SearchFilters, SearchTerms } from "@/components/admin/parts/SearchFilters";
import { PartsList } from "@/components/admin/parts/PartsList";
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGetParts } from "@/hooks";
import { useDebounce } from "use-debounce";
import { useMemo } from "react";

function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read state from URL
  const searchTerms = useMemo<SearchTerms>(() => ({
    search: searchParams?.get('search') || '',
    part_type: searchParams?.get('part_type') || '__all__',
    position_type: searchParams?.get('position_type') || '__all__',
    abs_type: searchParams?.get('abs_type') || '__all__',
    drive_type: searchParams?.get('drive_type') || '__all__',
    bolt_pattern: searchParams?.get('bolt_pattern') || '__all__',
  }), [searchParams]);

  const currentPage = parseInt(searchParams?.get('page') || '1');
  const limit = 25;
  const [debouncedSearchTerm] = useDebounce(searchTerms.search, 300);

  // Update URL when search terms or page changes
  const updateURL = (updates: Partial<SearchTerms & { page?: number }>) => {
    const params = new URLSearchParams(searchParams?.toString());

    // Update or remove each parameter
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '__all__' && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 if filters changed (not page)
    if (!('page' in updates) && params.toString() !== searchParams?.toString()) {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setSearchTerms = (terms: SearchTerms) => {
    updateURL(terms);
  };

  const setCurrentPage = (page: number) => {
    updateURL({ page });
  };

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
