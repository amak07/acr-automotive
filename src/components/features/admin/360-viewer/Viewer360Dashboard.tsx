"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { useGetParts } from "@/hooks/api/admin/parts";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { PartSummary } from "@/types";
import {
  RotateCw,
  ExternalLink,
  Settings,
  CheckCircle,
  Info,
  Search,
  X,
} from "lucide-react";
import { AcrCard } from "@/components/acr";
import { AcrPagination } from "@/components/acr/Pagination";
import { AcrSpinner } from "@/components/acr/Spinner";
import { Part360Viewer } from "@/components/features/public/parts/Part360Viewer";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "yes" | "no";

/** Hover preview: fetch frames and render Part360Viewer */
function Viewer360HoverPreview({ sku }: { sku: string }) {
  const { data, isLoading } = useQuery<{
    frames: Array<{ image_url: string }>;
    count: number;
  }>({
    queryKey: ["part-360-frames", sku],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/parts/${encodeURIComponent(sku)}/360-frames`
      );
      if (!res.ok) throw new Error("Failed to fetch 360 frames");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const frameUrls = data?.frames?.map((f) => f.image_url) ?? [];

  if (isLoading) {
    return (
      <div className="w-[250px] h-[250px] flex items-center justify-center bg-white rounded-xl border border-acr-gray-200 shadow-xl">
        <AcrSpinner size="md" color="primary" />
      </div>
    );
  }

  if (frameUrls.length === 0) return null;

  return (
    <div className="w-[250px] h-[250px] rounded-xl border border-acr-gray-200 shadow-xl overflow-hidden bg-white">
      <Part360Viewer
        frameUrls={frameUrls}
        transparent
        className="w-full h-full"
      />
    </div>
  );
}

export function Viewer360Dashboard() {
  const { t } = useLocale();

  // Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Hover preview state
  const [hoveredSku, setHoveredSku] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Responsive page size (matching admin pattern)
  useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth < 1024 ? 10 : 25);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset page on search/filter change (render-time adjustment per React docs)
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  const [prevFilter, setPrevFilter] = useState(filterMode);
  if (debouncedSearch !== prevSearch || filterMode !== prevFilter) {
    setPrevSearch(debouncedSearch);
    setPrevFilter(filterMode);
    setCurrentPage(1);
  }

  const offset = (currentPage - 1) * limit;

  // Fetch parts via existing admin API
  const { data, isLoading } = useGetParts({
    search: debouncedSearch,
    has_360: filterMode,
    limit,
    offset,
    sort_by: "acr_sku",
    sort_order: "asc",
    // Pass empty strings for unused filters
    abs_type: "",
    bolt_pattern: "",
    drive_type: "",
    part_type: "",
    position_type: "",
  });

  const parts = (data?.data as PartSummary[]) ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Count parts with 360 viewer (from current page — shown as page context)
  const partsWithViewer = parts.filter((p) => p.has_360_viewer).length;

  // Hover handlers with delay to prevent flicker
  const handleMouseEnter = useCallback(
    (sku: string, has360: boolean) => {
      if (!has360) return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setHoveredSku(sku), 300);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    setHoveredSku(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 acr-animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <RotateCw className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="acr-brand-heading-2xl text-acr-gray-900">
              {t("admin.viewer360.title")}
            </h1>
          </div>
        </div>
        <p className="text-acr-gray-600 mt-1">
          {t("admin.viewer360.description")}
        </p>
      </div>

      {/* How it works card */}
      <AcrCard
        className={cn(
          "mb-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",
          "acr-animate-fade-up acr-stagger-1"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-blue-900 mb-3 text-base">
              {t("admin.viewer360.howItWorks")}
            </h2>
            <ol className="space-y-2">
              {[1, 2, 3].map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-3 text-sm text-blue-800"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {step}
                  </span>
                  <span>
                    {t(
                      `admin.viewer360.step${step}` as "admin.viewer360.step1"
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </AcrCard>

      {/* Search + filter bar */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center gap-3 mb-6",
          "acr-animate-fade-up acr-stagger-2"
        )}
      >
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-acr-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.viewer360.searchPlaceholder")}
            className={cn(
              "w-full pl-9 pr-9 py-2 rounded-lg border border-acr-gray-200",
              "text-sm text-acr-gray-900 placeholder:text-acr-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400",
              "transition-all duration-200"
            )}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle - 3 way */}
        <div className="flex items-center gap-1 bg-acr-gray-100 rounded-lg p-1 flex-shrink-0">
          {(
            [
              { mode: "all" as FilterMode, label: t("admin.viewer360.filterAll") },
              {
                mode: "yes" as FilterMode,
                label: t("admin.viewer360.filterHas360"),
              },
              {
                mode: "no" as FilterMode,
                label: t("admin.viewer360.filterMissing"),
              },
            ] as const
          ).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                filterMode === mode
                  ? "bg-white text-acr-gray-900 shadow-sm"
                  : "text-acr-gray-500 hover:text-acr-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
          {isLoading ? (
            <AcrSpinner size="xs" color="gray" inline />
          ) : (
            <>
              {totalCount} {t("admin.viewer360.statsLabel")}
            </>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <AcrSpinner size="lg" color="primary" />
        </div>
      )}

      {/* Parts list */}
      {!isLoading && parts.length > 0 && (
        <AcrCard
          className={cn("p-4 lg:p-5", "acr-animate-fade-up acr-stagger-3")}
        >
          <div className="space-y-2">
            {parts.map((part) => (
              <div
                key={part.id}
                className={cn(
                  "relative flex items-center gap-4 p-3 lg:p-4 rounded-xl transition-all duration-300",
                  "border",
                  part.has_360_viewer
                    ? "bg-green-50/50 border-green-200"
                    : "bg-acr-gray-50 border-transparent hover:border-acr-gray-200"
                )}
                onMouseEnter={() =>
                  handleMouseEnter(part.acr_sku, !!part.has_360_viewer)
                }
                onMouseLeave={handleMouseLeave}
              >
                {/* SKU */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-acr-gray-900 text-sm lg:text-base font-mono">
                    {part.acr_sku}
                  </p>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {part.has_360_viewer ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t("admin.viewer360.confirmed")} (
                      {part.viewer_360_frame_count ?? 0}{" "}
                      {t("admin.viewer360.frames")})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-acr-gray-100 text-acr-gray-500 rounded-full text-xs font-medium">
                      {t("admin.viewer360.notUploaded")}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {part.has_360_viewer && (
                    <Link
                      href={`/parts/${part.acr_sku}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                        "bg-acr-gray-100 text-acr-gray-700 hover:bg-acr-gray-200 hover:text-acr-gray-900",
                        "transition-all duration-200"
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {t("admin.viewer360.viewPublicPage")}
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/admin/parts/${part.acr_sku}?tab=360viewer`}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                      "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800",
                      "transition-all duration-200"
                    )}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {t("admin.viewer360.manageFrames")}
                    </span>
                  </Link>
                </div>

                {/* Hover preview (desktop only) */}
                {hoveredSku === part.acr_sku && part.has_360_viewer && (
                  <div
                    ref={previewRef}
                    className="hidden lg:block absolute right-0 top-full mt-2 z-50"
                    onMouseEnter={() => {
                      // Keep preview open when hovering it
                      if (hoverTimeoutRef.current)
                        clearTimeout(hoverTimeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Viewer360HoverPreview sku={part.acr_sku} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </AcrCard>
      )}

      {/* Empty state */}
      {!isLoading && parts.length === 0 && (
        <div
          className={cn(
            "text-center py-16 rounded-xl border-2 border-dashed border-acr-gray-200",
            "acr-animate-fade-up acr-stagger-3"
          )}
        >
          <div className="w-20 h-20 rounded-2xl bg-acr-gray-100 flex items-center justify-center mx-auto mb-4">
            <RotateCw className="h-10 w-10 text-acr-gray-400" />
          </div>
          <p className="text-acr-gray-600 font-medium mb-1">
            {t("admin.viewer360.emptyTitle")}
          </p>
          <p className="text-sm text-acr-gray-400">
            {t("admin.viewer360.emptyDescription")}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          <AcrPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={totalCount}
            limit={limit}
            onPageChange={setCurrentPage}
            paginationTextKey="admin.viewer360.pagination"
          />
        </div>
      )}
    </main>
  );
}
