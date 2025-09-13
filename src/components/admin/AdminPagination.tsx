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
} from "../ui/pagination";

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
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-acr-gray-700 bg-white border border-acr-gray-300 rounded-lg hover:bg-acr-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers(true).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 text-sm font-medium rounded-lg ${
                  page === currentPage
                    ? "bg-acr-red-600 text-white"
                    : "text-acr-gray-700 bg-white border border-acr-gray-300 hover:bg-acr-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-acr-gray-700 bg-white border border-acr-gray-300 rounded-lg hover:bg-acr-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
        
        <div className="text-xs text-acr-gray-500 text-center mt-2">
          Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)} of {total} parts
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
          Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)} of {total} parts
        </div>
      </div>
    </div>
  );
}