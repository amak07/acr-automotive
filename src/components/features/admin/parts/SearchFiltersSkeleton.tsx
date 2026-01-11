import { Skeleton } from "@/components/ui/skeleton";

export function SearchFiltersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Collapsed State: Search + Filters Button */}
      <div className="flex gap-3 items-center">
        {/* Search Input Skeleton */}
        <Skeleton className="h-12 flex-1 rounded-lg" />
        {/* Filters Button Skeleton */}
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>
    </div>
  );
}
