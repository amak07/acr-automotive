"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PartSearchResult } from "@/types";
import { useLocale } from "@/contexts/LocaleContext";
import { TranslationKeys } from "@/lib/i18n/translation-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { AcrSpinner } from "@/components/acr/Spinner";
import { getStaggerClass } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Individual part card with image loading state and entrance animation
function PartCard({
  part,
  currentSearch,
  t,
  index,
}: {
  part: PartSearchResult;
  currentSearch: string;
  t: (key: keyof TranslationKeys) => string;
  index: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get stagger class based on index (wraps after 12)
  const staggerClass = getStaggerClass(index);

  return (
    <Link
      href={`/parts/${encodeURIComponent(part.acr_sku)}${currentSearch ? `?${currentSearch}` : ""}`}
      className={cn(
        // Entrance animation with stagger
        "acr-animate-fade-up",
        staggerClass,
        // Card styling - red hover hints with warm glow
        "bg-white border border-acr-gray-300 rounded-xl overflow-hidden",
        "shadow-md transition-all duration-300",
        // Red hover enhancements
        "hover:border-acr-red-300 hover:shadow-lg",
        "hover:shadow-[0_8px_30px_-12px_rgba(237,28,36,0.15)]",
        // Interaction states
        "cursor-pointer active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2",
        "group relative flex flex-col"
      )}
    >
      {/* Image Container - Minimal padding for larger image */}
      <div className="pt-2 px-2 pb-1">
        <div className="relative h-48 overflow-hidden">
          {/* Skeleton shown until image loads */}
          {!imageLoaded && <Skeleton className="absolute inset-0 rounded" />}
          <Image
            src={part.primary_image_url || "/part-placeholder-new.svg"}
            alt={`${part.part_type} ${part.acr_sku}`}
            fill
            style={{ objectFit: "contain" }}
            className={cn(
              "bg-white transition-all duration-300 group-hover:scale-105",
              !imageLoaded && "opacity-0"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Hover Overlay - Enhanced with red accent */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white text-acr-gray-900 px-4 py-2 text-sm font-semibold rounded-lg shadow-lg border border-acr-red-200">
              {t("public.parts.viewDetails")}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body - Clean & Professional */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="text-center">
          {/* SKU - Primary identifier */}
          <h3 className="font-bold text-lg text-acr-gray-900 font-mono tracking-wide mb-2">
            {part.acr_sku}
          </h3>

          {/* Part Type - Clean, no label */}
          <p className="text-sm text-acr-gray-700 font-medium">
            {part.part_type}
          </p>
        </div>

        {/* Footer - Brand badge */}
        <div className="mt-3 pt-3 border-t border-acr-gray-200">
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-acr-red-50 text-acr-red-800 border border-acr-red-200">
              {t("public.parts.brand")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

type PublicPartsListProps = {
  partsData: PartSearchResult[];
  isDataLoading: boolean;
  partsCount: number;
  currentPage: number;
  limit: number;
};

export function PublicPartsList(props: PublicPartsListProps) {
  const { partsData, isDataLoading, partsCount, currentPage, limit } = props;
  const { t } = useLocale();
  const searchParams = useSearchParams();

  // Preserve search params when navigating to part details
  const currentSearch = searchParams?.toString() || "";

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <AcrSpinner size="md" color="primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Parts Count Display */}
      <div className="mb-4 acr-animate-fade-in">
        <p className="text-sm text-acr-gray-600 font-medium">
          {partsCount > 0
            ? partsCount === 1
              ? t("public.parts.showingRangeSingle")
                  .replace(
                    "{{start}}",
                    ((currentPage - 1) * limit + 1).toString()
                  )
                  .replace(
                    "{{end}}",
                    Math.min(currentPage * limit, partsCount).toString()
                  )
                  .replace("{{total}}", partsCount.toString())
              : t("public.parts.showingRange")
                  .replace(
                    "{{start}}",
                    ((currentPage - 1) * limit + 1).toString()
                  )
                  .replace(
                    "{{end}}",
                    Math.min(currentPage * limit, partsCount).toString()
                  )
                  .replace("{{total}}", partsCount.toString())
            : t("public.parts.noResults")}
        </p>
      </div>

      {/* Product Grid - Full width to match search bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {partsData.map((part, index) => (
          <PartCard
            key={part.id}
            part={part}
            currentSearch={currentSearch}
            t={t}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
