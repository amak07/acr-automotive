import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-acr-red-100", className)}
      {...props}
    />
  )
}

// Specialized ACR skeleton components
function SkeletonCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-acr-gray-200 rounded-lg", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function SkeletonTableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-acr-gray-50 border-b border-acr-gray-200 px-3 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SkeletonTableContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-3", className)} {...props}>
      {children}
    </div>
  )
}

// Common skeleton patterns
function SkeletonText({
  className,
  width = "full",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4" | "2/3" | "4/5" | string
}) {
  const widthClass = width.includes("/") || width === "full"
    ? `w-${width}`
    : width.includes("px") || width.includes("rem")
    ? ""
    : `w-${width}`

  return (
    <Skeleton
      className={cn("h-4", widthClass, className)}
      style={width.includes("px") || width.includes("rem") ? { width } : undefined}
      {...props}
    />
  )
}

function SkeletonTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-8 w-48", className)}
      {...props}
    />
  )
}

function SkeletonBadge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn("h-6 w-16 rounded-full", className)}
      {...props}
    />
  )
}

// Parts Grid Skeleton Components
function SkeletonPartCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md",
        className
      )}
      {...props}
    >
      {/* Image area */}
      <div className="p-4">
        <Skeleton className="w-full h-40 rounded" />
      </div>

      {/* Content area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="text-center space-y-2">
          {/* SKU skeleton */}
          <Skeleton className="h-6 w-32 mx-auto" />
          {/* Part type skeleton */}
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>

        {/* Footer badge */}
        <div className="mt-3 pt-3 border-t border-acr-gray-200">
          <div className="flex items-center justify-center">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonPartsGrid({
  count = 6,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  count?: number
}) {
  return (
    <div className={cn("max-w-3xl mx-auto", className)} {...props}>
      {/* Count skeleton */}
      <div className="mb-4">
        <SkeletonText width="48" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPartCard key={i} />
        ))}
      </div>
    </div>
  )
}

// Search Filters Skeleton
function SkeletonSearchFilters({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-lg border border-acr-gray-300", className)} {...props}>
      {/* Desktop layout skeleton */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <SkeletonText width="16" className="h-3" />
            <Skeleton className="h-12 rounded-md" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="16" className="h-3" />
            <Skeleton className="h-12 rounded-md" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="12" className="h-3" />
            <Skeleton className="h-12 rounded-md" />
          </div>
          <div className="flex items-end">
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>

        {/* Toggle and SKU search skeleton */}
        <div className="space-y-4">
          <SkeletonText width="40" className="h-4" />
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-md" />
            <Skeleton className="h-12 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Mobile layout skeleton */}
      <div className="md:hidden space-y-4">
        <div className="space-y-2">
          <SkeletonText width="16" className="h-3" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonText width="16" className="h-3" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonText width="12" className="h-3" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />

        <SkeletonText width="40" className="h-4" />
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-md" />
          <Skeleton className="h-12 w-24 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// Admin Page Skeletons
function SkeletonAdminPartDetails({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Breadcrumb skeleton */}
      <SkeletonText width="64" />

      {/* Part details header skeleton */}
      <div className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-acr-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <SkeletonTitle />
                <SkeletonText width="32" />
              </div>
              <div className="flex items-center gap-6 pl-6 border-l border-acr-gray-200">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="space-y-1">
                    <SkeletonText width="8" className="h-5" />
                    <SkeletonText width="16" className="h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="space-y-1">
                    <SkeletonText width="8" className="h-5" />
                    <SkeletonText width="20" className="h-3" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </div>

        {/* Specifications section */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <SkeletonText width="24" className="h-4" />
            <div className="flex-1 h-px bg-acr-gray-200"></div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-md" />
                <div className="space-y-1">
                  <SkeletonText width="20" className="h-4" />
                  <SkeletonText width="16" className="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metadata skeleton */}
      <SkeletonText width="48" />

      {/* Form sections skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic info */}
        <div className="bg-white rounded-lg border border-acr-gray-200 p-6">
          <SkeletonText width="32" className="h-5 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonText width="20" className="h-3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Applications */}
        <div className="bg-white rounded-lg border border-acr-gray-200 p-6">
          <SkeletonText width="36" className="h-5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-acr-gray-100 rounded">
                <div className="space-y-1">
                  <SkeletonText width="32" />
                  <SkeletonText width="24" className="h-3" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross references skeleton */}
      <div className="bg-white rounded-lg border border-acr-gray-200 p-6">
        <SkeletonText width="32" className="h-5 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-acr-gray-100 rounded">
              <div className="space-y-1">
                <SkeletonText width="24" />
                <SkeletonText width="16" className="h-3" />
              </div>
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonAdminPartsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header and filters skeleton */}
      <div className="bg-white rounded-lg border border-acr-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <SkeletonText width="32" className="h-6" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <SkeletonText width="16" className="h-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="16" className="h-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="12" className="h-3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="flex items-end">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-acr-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-acr-gray-50 border-b border-acr-gray-200 px-6 py-3">
          <div className="grid grid-cols-5 gap-4">
            <SkeletonText width="12" className="h-4" />
            <SkeletonText width="16" className="h-4" />
            <SkeletonText width="20" className="h-4" />
            <SkeletonText width="16" className="h-4" />
            <SkeletonText width="12" className="h-4" />
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-acr-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-5 gap-4 items-center">
                <SkeletonText width="20" />
                <SkeletonText width="24" />
                <div className="space-y-1">
                  <SkeletonText width="16" />
                  <SkeletonText width="20" className="h-3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonText width="40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

// Dashboard Skeletons
function SkeletonDashboardCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white rounded-lg border border-acr-gray-200 p-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-md lg:w-10 lg:h-10" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="16" className="h-6 lg:h-8" />
          <SkeletonText width="24" className="h-3 lg:h-4" />
        </div>
      </div>
    </div>
  )
}

function SkeletonDashboardCards({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 lg:gap-6", className)} {...props}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonDashboardCard key={i} />
      ))}
    </div>
  )
}

// Public Page Skeletons
function SkeletonPublicPartDetails({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-w-4xl mx-auto space-y-4", className)} {...props}>
      {/* Breadcrumb skeleton */}
      <SkeletonText width="32" />

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product image skeleton */}
        <div className="md:col-span-1 bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md">
          <div className="p-4">
            <SkeletonText className="aspect-square rounded-lg" />
          </div>
        </div>

        {/* Part details skeleton */}
        <div className="md:col-span-2 bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md">
          <div className="p-4">
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <SkeletonTitle className="mb-2" />
                <SkeletonText width="24" />
              </div>
              <SkeletonBadge />
            </div>

            {/* Specifications table skeleton */}
            <SkeletonCard>
              <SkeletonTableHeader>
                <SkeletonText width="24" className="mx-auto" />
              </SkeletonTableHeader>
              <SkeletonTableContent className="space-y-2">
                <SkeletonText width="full" />
                <SkeletonText width="3/4" />
                <SkeletonText width="1/2" />
                <SkeletonText width="2/3" />
              </SkeletonTableContent>
            </SkeletonCard>
          </div>
        </div>
      </div>

      {/* Applications and References skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Applications skeleton */}
        <div className="bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md">
          <div className="p-4">
            <SkeletonCard>
              <SkeletonTableHeader>
                <SkeletonText width="20" className="mx-auto" />
              </SkeletonTableHeader>
              <SkeletonTableContent className="space-y-2">
                <SkeletonText width="full" />
                <SkeletonText width="4/5" />
              </SkeletonTableContent>
            </SkeletonCard>
          </div>
        </div>

        {/* References skeleton */}
        <div className="bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md">
          <div className="p-4">
            <SkeletonCard>
              <SkeletonTableHeader>
                <SkeletonText width="20" className="mx-auto" />
              </SkeletonTableHeader>
              <SkeletonTableContent className="space-y-2">
                <SkeletonText width="3/4" />
                <SkeletonText width="1/2" />
                <SkeletonText width="2/3" />
              </SkeletonTableContent>
            </SkeletonCard>
          </div>
        </div>
      </div>
    </div>
  )
}

// Part Form Skeleton that matches the actual form layout
function SkeletonPartForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Basic Information Card */}
      <div className="bg-white border border-acr-gray-200 rounded-lg">
        {/* Card Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="w-6 h-6 rounded-full" />
            <SkeletonText width="32" className="h-5" />
          </div>
        </div>

        {/* Card Content */}
        <div className="px-4 pb-6 lg:px-6">
          <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            {/* Left Column - Form Fields (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {/* Form fields skeleton */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonText width="20" className="h-4" />
                    <Skeleton className="h-12 w-full rounded-md border border-acr-gray-400" />
                  </div>
                ))}
              </div>

              {/* Notes section */}
              <div className="space-y-2">
                <SkeletonText width="32" className="h-4" />
                <Skeleton className="h-24 w-full rounded-md border border-acr-gray-400" />
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="lg:col-span-1 space-y-2">
              <SkeletonText width="24" className="h-4" />
              <div className="border-2 border-dashed border-acr-gray-300 rounded-lg p-6">
                <div className="text-center space-y-2">
                  <Skeleton className="w-12 h-12 mx-auto rounded" />
                  <SkeletonText width="48" className="h-4 mx-auto" />
                  <SkeletonText width="32" className="h-3 mx-auto" />
                  <Skeleton className="h-8 w-24 mx-auto rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Applications Card */}
      <div className="bg-white border border-acr-gray-200 rounded-lg">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <SkeletonText width="36" className="h-5" />
              <Skeleton className="w-8 h-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Empty state skeleton */}
          <div className="text-center py-8 space-y-3">
            <Skeleton className="w-12 h-12 mx-auto rounded" />
            <SkeletonText width="40" className="h-4 mx-auto" />
            <SkeletonText width="56" className="h-3 mx-auto" />
            <Skeleton className="h-8 w-36 mx-auto rounded-md" />
          </div>
        </div>
      </div>

      {/* Cross References Card */}
      <div className="bg-white border border-acr-gray-200 rounded-lg">
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <SkeletonText width="32" className="h-5" />
              <Skeleton className="w-8 h-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Empty state skeleton */}
          <div className="text-center py-8 space-y-3">
            <Skeleton className="w-12 h-12 mx-auto rounded" />
            <SkeletonText width="36" className="h-4 mx-auto" />
            <SkeletonText width="48" className="h-3 mx-auto" />
            <Skeleton className="h-8 w-32 mx-auto rounded-md" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTableHeader,
  SkeletonTableContent,
  SkeletonText,
  SkeletonTitle,
  SkeletonBadge,
  SkeletonPartCard,
  SkeletonPartsGrid,
  SkeletonSearchFilters,
  SkeletonAdminPartDetails,
  SkeletonAdminPartsList,
  SkeletonDashboardCard,
  SkeletonDashboardCards,
  SkeletonPublicPartDetails,
  SkeletonPartForm
}
