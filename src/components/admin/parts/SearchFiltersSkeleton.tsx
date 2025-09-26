import { Skeleton } from "@/components/ui/skeleton";

export function SearchFiltersSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg border border-acr-gray-200 shadow-sm mb-6 lg:p-6">
      {/* Mobile: Stacked Layout */}
      <div className="lg:hidden space-y-4">
        {/* Search Input Skeleton */}
        <div className="relative">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Filter Dropdowns Skeleton */}
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3 md:grid-cols-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>

      {/* Desktop: Two-row Layout */}
      <div className="hidden lg:block space-y-4">
        {/* Top Row: Search + Part Type */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Input */}
          </div>
          <div className="w-1/3 space-y-2">
            <Skeleton className="h-4 w-20 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Select */}
          </div>
        </div>

        {/* Bottom Row: 4 filters */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Select */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-8 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Select */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Select */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" /> {/* Label */}
            <Skeleton className="h-12 w-full rounded-lg" /> {/* Select */}
          </div>
        </div>
      </div>
    </div>
  );
}