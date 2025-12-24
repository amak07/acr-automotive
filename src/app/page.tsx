"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Route } from "next";
import { useMemo, Suspense } from "react";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import {
  PublicSearchFilters,
  PublicSearchTerms,
} from "@/components/features/public/search/PublicSearchFilters";
import { PublicPartsList } from "@/components/features/public/parts/PublicPartsList";
import { BannerCarousel } from "@/components/features/public/BannerCarousel";
import { AcrPagination } from "@/components/acr";
import { usePublicParts } from "@/hooks";
import { useLocale } from "@/contexts/LocaleContext";
import { useSettings } from "@/contexts/SettingsContext";
import { CardError } from "@/components/ui/error-states";
import { Preloader } from "@/components/ui/Preloader";
import { DEFAULT_PUBLIC_SEARCH_TERMS } from "./constants";

// Path to dotLottie animation in public folder
const GEAR_ANIMATION_SRC = "/animations/gear-loader.lottie";

function HomePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { settings, isLoading: settingsLoading } = useSettings();

  // Read search terms from URL
  const searchTerms = useMemo<PublicSearchTerms>(
    () => ({
      make: searchParams?.get("make") || "",
      model: searchParams?.get("model") || "",
      year: searchParams?.get("year") || "",
      sku_term: searchParams?.get("sku") || "",
      limit: DEFAULT_PUBLIC_SEARCH_TERMS.limit,
      offset: parseInt(searchParams?.get("offset") || "0"),
    }),
    [searchParams]
  );

  const { data, isLoading: partsLoading, error } = usePublicParts(searchTerms);

  // Pagination calculations
  const currentPage = Math.floor(searchTerms.offset / searchTerms.limit) + 1;
  const totalPages = Math.ceil((data?.count || 0) / searchTerms.limit);

  // Combined loading state for initial page load
  // Only show preloader on initial load (no data yet)
  const isInitialLoad = settingsLoading || (partsLoading && !data);

  // Update URL when filters or page changes
  const updateURL = (updates: Partial<PublicSearchTerms>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "" && value !== 0) {
        params.set(key === "sku_term" ? "sku" : key, value.toString());
      } else {
        params.delete(key === "sku_term" ? "sku" : key);
      }
    });

    // Reset offset if filters changed (not pagination)
    if (
      !("offset" in updates) &&
      params.toString() !== searchParams?.toString()
    ) {
      params.delete("offset");
    }

    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  const setSearchTerms = (terms: PublicSearchTerms) => {
    updateURL(terms);
  };

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * searchTerms.limit;
    // Scroll to top first (instant), then update URL
    // This prevents the janky double-scroll effect
    window.scrollTo({ top: 0, behavior: "instant" });
    updateURL({ offset: newOffset });
  };

  return (
    <>
      {/* Full-page preloader - shows during initial load */}
      <Preloader isLoading={isInitialLoad} animationSrc={GEAR_ANIMATION_SRC} />

      <main className="mx-auto mt-1">
        {/* Banner Carousel - Full width */}
        {settings?.branding?.banners &&
          settings.branding.banners.length > 0 && (
            <BannerCarousel banners={settings.branding.banners} />
          )}

        {/* Search and Parts List - Contained width */}
        <div className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
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
              isDataLoading={partsLoading}
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
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Preloader isLoading={true} animationSrc={GEAR_ANIMATION_SRC} />
      }
    >
      <div className="min-h-screen acr-page-bg-pattern">
        <AppHeader variant="public" />
        <HomePageContent />
      </div>
    </Suspense>
  );
}
