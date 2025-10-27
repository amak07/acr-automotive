"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AcrButton } from "@/components/acr";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: AdminPaginationProps) {
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

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Mobile-first pagination */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between w-full max-w-xs gap-4">
          <AcrButton
            onClick={handlePrevious}
            disabled={currentPage === 1}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
          >
            ← Prev
          </AcrButton>
          
          <div className="flex items-center gap-1">
            {getPageNumbers(true).map((page) => (
              <AcrButton
                key={page}
                onClick={() => onPageChange(page)}
                variant={page === currentPage ? "primary" : "secondary"}
                size="sm"
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
            size="sm"
            className="flex items-center gap-1"
          >
            Next →
          </AcrButton>
        </div>
        
        <div className="text-xs text-acr-gray-500 text-center mt-2">
          {t("admin.parts.pagination")
            .replace("{{start}}", ((currentPage - 1) * limit + 1).toString())
            .replace("{{end}}", Math.min(currentPage * limit, total).toString())
            .replace("{{total}}", total.toString())}
        </div>
      </div>

      {/* Desktop pagination */}
      <div className="hidden lg:block">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrevious}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
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
              <PaginationNext
                onClick={handleNext}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="text-sm text-acr-gray-500 text-center mt-3">
          {t("admin.parts.pagination")
            .replace("{{start}}", ((currentPage - 1) * limit + 1).toString())
            .replace("{{end}}", Math.min(currentPage * limit, total).toString())
            .replace("{{total}}", total.toString())}
        </div>
      </div>
    </div>
  );
}