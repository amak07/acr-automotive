"use client";

import * as React from "react";
import { useLocale } from "@/contexts/LocaleContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "../ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AcrButton } from "./Button";
import { cn } from "@/lib/utils";

export interface AcrPaginationProps {
  /**
   * Current active page (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Translation key for the pagination info text
   * Should be a string with placeholders: {{start}}, {{end}}, {{total}}
   * @default "admin.parts.pagination"
   */
  paginationTextKey?: string;

  /**
   * Whether to show the pagination info text
   * @default true
   */
  showInfo?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Size variant for mobile buttons
   * @default "sm"
   */
  size?: "sm" | "default" | "lg";
}

/**
 * ACR pagination component
 * Provides consistent pagination UI for both admin and public sections
 */
export const AcrPagination = React.forwardRef<HTMLDivElement, AcrPaginationProps>(
  (
    {
      currentPage,
      totalPages,
      total,
      limit,
      onPageChange,
      paginationTextKey = "admin.parts.pagination",
      showInfo = true,
      className,
      size = "sm",
      ...props
    },
    ref
  ) => {
    const { t } = useLocale();

    const handlePrevious = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    const handleNext = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    // Generate page numbers (responsive: fewer on mobile)
    const getPageNumbers = (isMobile = false) => {
      const pages = [];
      const maxPages = isMobile ? 3 : 5; // Show fewer pages on mobile
      let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
      let endPage = Math.min(totalPages, startPage + maxPages - 1);

      // Adjust start if we're near the end
      if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    // Calculate displayed range
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, total);

    const paginationText = showInfo
      ? t(paginationTextKey as any)
          .replace("{{start}}", startItem.toString())
          .replace("{{end}}", endItem.toString())
          .replace("{{total}}", total.toString())
      : "";

    return (
      <div
        ref={ref}
        className={`flex flex-col items-center gap-3 py-4 ${className || ""}`}
        {...props}
      >
        {/* Mobile-first pagination */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between w-full max-w-xs gap-4">
            <AcrButton
              onClick={handlePrevious}
              disabled={currentPage === 1}
              variant="secondary"
              size={size}
              className="flex items-center gap-1"
            >
              {t("pagination.previousShort")}
            </AcrButton>

            <div className="flex items-center gap-1">
              {getPageNumbers(true).map((page) => (
                <AcrButton
                  key={page}
                  onClick={() => onPageChange(page)}
                  variant={page === currentPage ? "primary" : "secondary"}
                  size={size}
                  className="w-10 h-10 p-0"
                >
                  {page}
                </AcrButton>
              ))}
            </div>

            <AcrButton
              onClick={handleNext}
              disabled={currentPage === totalPages}
              variant="secondary"
              size={size}
              className="flex items-center gap-1"
            >
              {t("pagination.nextShort")}
            </AcrButton>
          </div>

          {showInfo && (
            <div className="acr-caption text-acr-gray-500 text-center mt-2">
              {paginationText}
            </div>
          )}
        </div>

        {/* Desktop pagination */}
        <div className="hidden lg:block">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  onClick={handlePrevious}
                  size="default"
                  className={cn(
                    "gap-1 pl-2.5 cursor-pointer",
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  )}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t("pagination.previous")}</span>
                </PaginationLink>
              </PaginationItem>

              {getPageNumbers(false).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === currentPage}
                    className={`cursor-pointer ${
                      page === currentPage
                        ? "bg-acr-red-600 text-white hover:bg-acr-red-700 hover:text-white border-acr-red-600"
                        : ""
                    }`}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink
                  onClick={handleNext}
                  size="default"
                  className={cn(
                    "gap-1 pr-2.5 cursor-pointer",
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  )}
                  aria-label="Go to next page"
                >
                  <span>{t("pagination.next")}</span>
                  <ChevronRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {showInfo && (
            <div className="acr-body-small text-acr-gray-500 text-center mt-3">
              {paginationText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

AcrPagination.displayName = "AcrPagination";