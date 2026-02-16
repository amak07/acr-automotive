"use client";

import type { Route } from "next";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { QuickActions } from "@/components/features/admin/dashboard/QuickActions";
import { DashboardCards } from "@/components/features/admin/dashboard/DashboardCards";
import {
  SearchFilters,
  SearchTerms,
} from "@/components/features/admin/parts/SearchFilters";
import { PartsList } from "@/components/features/admin/parts/PartsList";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useGetParts } from "@/hooks";
import { useDebounce } from "use-debounce";
import { useMemo, Suspense, useState, useEffect } from "react";
import { Preloader } from "@/components/ui/Preloader";
import { useSettings } from "@/contexts/SettingsContext";
import { useLocale } from "@/contexts/LocaleContext";
import { usePreloader } from "@/contexts/PreloaderContext";

// Path to dotLottie animation in public folder
const GEAR_ANIMATION_SRC = "/animations/gear-loader.lottie";

function AdminPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  // Read state from URL
  const searchTerms = useMemo<SearchTerms>(
    () => ({
      search: searchParams?.get("search") || "",
      part_type: searchParams?.get("part_type") || "__all__",
      position_type: searchParams?.get("position_type") || "__all__",
      abs_type: searchParams?.get("abs_type") || "__all__",
      drive_type: searchParams?.get("drive_type") || "__all__",
      bolt_pattern: searchParams?.get("bolt_pattern") || "__all__",
    }),
    [searchParams]
  );

  const currentPage = parseInt(searchParams?.get("page") || "1");

  // Use 10 items per page on mobile for better UX, 25 on desktop
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth < 1024 ? 10 : 25);
    };

    // Set initial value
    handleResize();

    // Listen for resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [debouncedSearchTerm] = useDebounce(searchTerms.search, 300);

  // Update URL when search terms or page changes
  const updateURL = (updates: Partial<SearchTerms & { page?: number }>) => {
    const params = new URLSearchParams(searchParams?.toString());

    // Update or remove each parameter
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "__all__" && value !== "") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 if filters changed (not page)
    if (
      !("page" in updates) &&
      params.toString() !== searchParams?.toString()
    ) {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
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
    bolt_pattern:
      searchTerms.bolt_pattern === "__all__" ? "" : searchTerms.bolt_pattern,
    drive_type:
      searchTerms.drive_type === "__all__" ? "" : searchTerms.drive_type,
    part_type: searchTerms.part_type === "__all__" ? "" : searchTerms.part_type,
    position_type:
      searchTerms.position_type === "__all__" ? "" : searchTerms.position_type,
    search: debouncedSearchTerm,
  });

  return (
    <main className="px-4 py-5 mx-auto md:px-6 lg:max-w-7xl lg:px-8 lg:py-8 space-y-4 lg:space-y-6">
      <h1 className="acr-brand-heading-2xl text-acr-gray-900 acr-animate-fade-up">
        {t("admin.dashboard.title")}
      </h1>
      <QuickActions />
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
  );
}

function AdminPageWrapper() {
  const { isLoading: settingsLoading } = useSettings();
  const { markPageReady } = usePreloader();
  const searchParams = useSearchParams();

  // Get initial parts data to determine loading state
  const { data: initialPartsData, isLoading: initialPartsLoading } =
    useGetParts({
      limit: 25,
      offset: 0,
      sort_by: "acr_sku",
      sort_order: "asc",
      search: searchParams?.get("search") || "",
      abs_type: searchParams?.get("abs_type") || "",
      bolt_pattern: searchParams?.get("bolt_pattern") || "",
      drive_type: searchParams?.get("drive_type") || "",
      part_type: searchParams?.get("part_type") || "",
      position_type: searchParams?.get("position_type") || "",
    });

  // Combined loading state for initial page load
  const isInitialLoad =
    settingsLoading || (initialPartsLoading && !initialPartsData);

  return (
    <>
      {/* Full-page preloader - shows during initial load, covers everything */}
      <Preloader isLoading={isInitialLoad} animationSrc={GEAR_ANIMATION_SRC} onComplete={markPageReady} />
      <AdminPageContent />
    </>
  );
}

function AdminPage() {
  return (
    <Suspense
      fallback={
        <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />
      }
    >
      <div>
        <AppHeader variant="admin" />
        <AdminPageWrapper />
      </div>
    </Suspense>
  );
}

// Export the wrapped component with admin authentication
export default withAdminAuth(AdminPage);
