"use client";

import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import {
  DatabasePartRow,
  DatabaseVehicleAppRow,
  DatabaseCrossRefRow,
} from "@/types";
import { AcrCard, AcrCardContent } from "@/components/acr/Card";
import { Badge } from "@/components/ui/badge";
import { SkeletonPublicPartDetails } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/error-states";
import { useHomeLink } from "@/hooks";

type PartWithRelations = DatabasePartRow & {
  vehicle_applications?: DatabaseVehicleAppRow[];
  cross_references?: DatabaseCrossRefRow[];
};

type PublicPartDetailsProps = {
  part?: PartWithRelations | null;
  isLoading: boolean;
  error?: any;
};

export function PublicPartDetails({
  part,
  isLoading,
  error,
}: PublicPartDetailsProps) {
  const { t } = useLocale();
  const homeLink = useHomeLink();
  const searchParams = useSearchParams();

  // Preserve search params when going back
  const currentSearch = searchParams?.toString() || '';
  const backLink = homeLink === "/admin" && part?.id
    ? `/admin/parts/${part.id}`
    : `/${currentSearch ? `?${currentSearch}` : ''}`;
  const backText = homeLink === "/admin"
    ? t("public.partDetails.backToAdmin")
    : t("public.partDetails.backToSearch");

  if (isLoading) {
    return <SkeletonPublicPartDetails />;
  }

  if (error) {
    return (
      <PageError
        title={t("public.partDetails.errorTitle")}
        message={t("public.partDetails.errorMessage")}
        icon={<Package className="w-12 h-12 mx-auto mb-2" />}
        backLink={backLink || "/"}
        backText={backText || t("public.partDetails.backToSearch")}
      />
    );
  }

  if (!part) {
    return (
      <PageError
        title={t("public.partDetails.notFound")}
        message={t("public.partDetails.notFoundMessage")}
        icon={<Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />}
        backLink={backLink || "/"}
        backText={backText || t("public.partDetails.backToSearch")}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-acr-gray-600">
        <Link
          href={(backLink || "/") as any}
          className="flex items-center hover:text-acr-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backText || t("public.partDetails.backToSearch")}
        </Link>
      </div>

      {/* Main Content - Compact Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Image - Smaller */}
        <AcrCard variant="elevated" padding="sm" className="md:col-span-1">
          <AcrCardContent>
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center relative">
              <Image
                src="/part-placeholder.webp"
                alt={`${part.part_type} ${part.acr_sku}`}
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </AcrCardContent>
        </AcrCard>

        {/* Part Details - Baleros-Bisa Style */}
        <AcrCard variant="featured" padding="default" className="md:col-span-2">
          <AcrCardContent>
            {/* Header with SKU and Badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-acr-gray-900 font-mono tracking-wide mb-1">
                  {part.acr_sku}
                </h1>
                <p className="text-sm font-medium text-acr-gray-600 uppercase tracking-wide">
                  {part.part_type}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-acr-red-50 text-acr-red-800 border-acr-red-200 font-semibold"
              >
                {t("public.parts.brand")}
              </Badge>
            </div>

            {/* Specifications Table */}
            <div className="border border-acr-gray-200 rounded">
              <div className="bg-acr-gray-50 border-b border-acr-gray-200 px-3 py-2">
                <h4 className="text-sm font-semibold text-acr-gray-900 text-center">
                  {t("public.partDetails.specifications")}
                </h4>
              </div>
              <div className="p-3">
                <div className="space-y-1">
                  {/* Brand info */}
                  <div className="text-sm text-acr-gray-900">
                    -{" "}
                    <span className="font-medium">
                      {t("public.partDetails.brand")}:
                    </span>{" "}
                    ACR
                  </div>

                  {/* Technical specifications */}
                  {part.position_type && (
                    <div className="text-sm text-acr-gray-900">
                      -{" "}
                      <span className="font-medium">
                        {t("public.partDetails.position")}:
                      </span>{" "}
                      {part.position_type}
                    </div>
                  )}

                  {part.abs_type && (
                    <div className="text-sm text-acr-gray-900">
                      -{" "}
                      <span className="font-medium">
                        {t("public.partDetails.abs")}:
                      </span>{" "}
                      {part.abs_type}
                    </div>
                  )}

                  {part.drive_type && (
                    <div className="text-sm text-acr-gray-900">
                      -{" "}
                      <span className="font-medium">
                        {t("public.partDetails.drive")}:
                      </span>{" "}
                      {part.drive_type}
                    </div>
                  )}

                  {part.bolt_pattern && (
                    <div className="text-sm text-acr-gray-900">
                      -{" "}
                      <span className="font-medium">
                        {t("public.partDetails.bolts")}:
                      </span>{" "}
                      {part.bolt_pattern}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AcrCardContent>
        </AcrCard>
      </div>

      {/* Applications and References - Baleros-Bisa Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AcrCard variant="default">
          <AcrCardContent>
            <div className="border border-acr-gray-200 rounded">
              <div className="bg-acr-gray-50 border-b border-acr-gray-200 px-3 py-2">
                <h4 className="text-sm font-semibold text-acr-gray-900 text-center">
                  {t("public.partDetails.applications")}
                </h4>
              </div>
              <div className="p-3">
                {part.vehicle_applications &&
                part.vehicle_applications.length > 0 ? (
                  <div className="space-y-1">
                    {part.vehicle_applications.map((app) => (
                      <div key={app.id} className="text-sm text-acr-gray-900">
                        - {app.make} {app.model} ({app.start_year}-{app.end_year})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-acr-gray-500 text-center py-2">
                    {t("public.partDetails.applicationsPlaceholder")}
                  </div>
                )}
              </div>
            </div>
          </AcrCardContent>
        </AcrCard>

        <AcrCard variant="default">
          <AcrCardContent>
            <div className="border border-acr-gray-200 rounded">
              <div className="bg-acr-gray-50 border-b border-acr-gray-200 px-3 py-2">
                <h4 className="text-sm font-semibold text-acr-gray-900 text-center">
                  {t("public.partDetails.references")}
                </h4>
              </div>
              <div className="p-3">
                {part.cross_references && part.cross_references.length > 0 ? (
                  <div className="space-y-1">
                    {part.cross_references.map((ref) => (
                      <div
                        key={ref.id}
                        className="text-sm text-acr-gray-900 font-mono"
                      >
                        - {ref.competitor_sku}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-acr-gray-500 text-center py-2">
                    {t("public.partDetails.referencesPlaceholder")}
                  </div>
                )}
              </div>
            </div>
          </AcrCardContent>
        </AcrCard>
      </div>
    </div>
  );
}
