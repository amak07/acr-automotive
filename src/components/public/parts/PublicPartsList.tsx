"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PartSearchResult } from "@/types";
import { useLocale } from "@/contexts/LocaleContext";
import { SkeletonPartsGrid } from "@/components/ui/skeleton";

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
  const currentSearch = searchParams?.toString() || '';

  if (isDataLoading) {
    return <SkeletonPartsGrid count={6} />;
  }

  return (
    <div>
      {/* Parts Count Display */}
      <div className="max-w-3xl mx-auto mb-4">
        <div className="flex justify-start">
          <p className="text-sm text-acr-gray-600 font-medium">
            {partsCount > 0 ? (
              partsCount === 1 ?
                t("public.parts.showingRangeSingle")
                  .replace("{{start}}", ((currentPage - 1) * limit + 1).toString())
                  .replace("{{end}}", Math.min(currentPage * limit, partsCount).toString())
                  .replace("{{total}}", partsCount.toString()) :
                t("public.parts.showingRange")
                  .replace("{{start}}", ((currentPage - 1) * limit + 1).toString())
                  .replace("{{end}}", Math.min(currentPage * limit, partsCount).toString())
                  .replace("{{total}}", partsCount.toString())
            ) : (
              t("public.parts.noResults")
            )}
          </p>
        </div>
      </div>

      {/* Baleros-Bisa Style Product Grid */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partsData.map((part) => (
            <Link
              key={part.id}
              href={`/parts/${part.id}${currentSearch ? `?${currentSearch}` : ''}`}
              className="bg-white border border-acr-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:border-acr-gray-400 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2 group relative flex flex-col"
            >
              {/* Image Container - Baleros-Bisa Style */}
              <div className="relative overflow-hidden p-4 h-48">
                <Image
                  src={part.primary_image_url || "/part-placeholder-new.svg"}
                  alt={`${part.part_type} ${part.acr_sku}`}
                  fill
                  style={{ objectFit: "contain" }}
                  className="bg-white transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Hover Overlay - Baleros-Bisa Style */}
                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white text-black px-4 py-2 text-sm font-medium rounded shadow-lg">
                    {t("public.parts.viewDetails")}
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
          ))}
        </div>
      </div>
    </div>
  );
}
