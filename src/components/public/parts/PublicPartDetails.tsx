"use client";

import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import {
  DatabasePartRow,
  DatabaseVehicleAppRow,
  DatabaseCrossRefRow,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SkeletonCard,
  SkeletonTableHeader,
  SkeletonTableContent,
  SkeletonText,
  SkeletonTitle,
  SkeletonBadge
} from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

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
  const [backLink, setBackLink] = useState<string>("/");
  const [backText, setBackText] = useState<string>("");

  useEffect(() => {
    // Check if we came from admin by looking at the referrer or using a URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const fromAdmin = urlParams.get('from') === 'admin';

    // Also check document referrer as backup
    const referrer = document.referrer;
    const cameFromAdmin = fromAdmin || referrer.includes('/admin/parts/');

    if (cameFromAdmin && part?.id) {
      setBackLink(`/admin/parts/${part.id}`);
      setBackText(t("public.partDetails.backToAdmin"));
    } else {
      setBackLink("/");
      setBackText(t("public.partDetails.backToSearch"));
    }
  }, [part?.id, t]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Breadcrumb skeleton */}
        <SkeletonText width="32" />

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Product image skeleton */}
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <SkeletonText className="aspect-square rounded-lg" />
            </CardContent>
          </Card>

          {/* Part details skeleton */}
          <Card className="md:col-span-2">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>

        {/* Applications and References skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Applications skeleton */}
          <Card>
            <CardContent className="p-4">
              <SkeletonCard>
                <SkeletonTableHeader>
                  <SkeletonText width="20" className="mx-auto" />
                </SkeletonTableHeader>
                <SkeletonTableContent className="space-y-2">
                  <SkeletonText width="full" />
                  <SkeletonText width="4/5" />
                </SkeletonTableContent>
              </SkeletonCard>
            </CardContent>
          </Card>

          {/* References skeleton */}
          <Card>
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">
          <Package className="w-12 h-12 mx-auto mb-2" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {t("public.partDetails.errorTitle")}
        </h3>
        <p className="text-red-600 text-sm mb-4">
          {t("public.partDetails.errorMessage")}
        </p>
        <Link
          href={(backLink || "/") as any}
          className="inline-flex items-center text-acr-blue-600 hover:text-acr-blue-800 underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backText || t("public.partDetails.backToSearch")}
        </Link>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t("public.partDetails.notFound")}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {t("public.partDetails.notFoundMessage")}
        </p>
        <Link
          href={(backLink || "/") as any}
          className="inline-flex items-center text-acr-blue-600 hover:text-acr-blue-800 underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backText || t("public.partDetails.backToSearch")}
        </Link>
      </div>
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
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
              <img
                src="/part-placeholder.webp"
                alt={`${part.part_type} ${part.acr_sku}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Part Details - Baleros-Bisa Style */}
        <Card className="md:col-span-2">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Applications and References - Baleros-Bisa Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
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
                        - {app.make} {app.model} {app.year_range}
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
