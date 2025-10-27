"use client";

import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/contexts/LocaleContext";
import {
  DatabasePartRow,
  DatabaseVehicleAppRow,
  DatabaseCrossRefRow,
} from "@/types";
import { Tables } from "@/lib/supabase/types";
import { AcrCard, AcrCardContent } from "@/components/acr/Card";
import { Badge } from "@/components/ui/badge";
import { SkeletonPublicPartDetails } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/error-states";
import { useHomeLink } from "@/hooks";
import { PartImageGallery } from "./PartImageGallery";

type PartImage = Tables<"part_images">;

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
  const router = useRouter();
  const homeLink = useHomeLink();
  const searchParams = useSearchParams();

  // Fetch part images
  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ["part-images-public", part?.id],
    queryFn: async () => {
      if (!part?.id) return [];
      const res = await fetch(`/api/admin/parts/${part.id}/images`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data as PartImage[]) || [];
    },
    enabled: !!part?.id,
  });

  // Fetch 360° viewer frames
  const { data: viewer360Data, isLoading: viewer360Loading } = useQuery({
    queryKey: ["part-360-frames-public", part?.id],
    queryFn: async () => {
      if (!part?.id) return null;
      const res = await fetch(`/api/admin/parts/${part.id}/360-frames`);
      if (!res.ok) return null;
      const json = await res.json();
      return json as { frames: Array<{ frame_number: number; image_url: string }>; count: number };
    },
    enabled: !!part?.id,
  });

  const viewer360Frames = viewer360Data?.frames?.map(f => f.image_url) || [];
  const has360Viewer = (viewer360Data?.count || 0) > 0;
  const isMediaLoading = imagesLoading || viewer360Loading;

  // Preserve search params when going back
  const currentSearch = searchParams?.toString() || '';
  const backLink = homeLink === "/admin" && part?.id
    ? `/admin/parts/${part.id}`
    : `/${currentSearch ? `?${currentSearch}` : ''}`;
  const backText = homeLink === "/admin"
    ? t("public.partDetails.backToAdmin")
    : t("public.partDetails.backToSearch");

  // Handle back navigation with browser history for seamless scroll restoration
  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only use router.back() for public users (not admin)
    if (homeLink === "/admin") return; // Let default Link behavior handle admin navigation

    e.preventDefault();

    // Check if user came from our search page by looking at history state
    // Next.js maintains scroll position automatically when using router.back()
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback: direct navigation if no history (e.g., user landed directly via bookmark)
      router.push(backLink as any);
    }
  };

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
          onClick={handleBackClick}
          className="flex items-center hover:text-acr-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {backText || t("public.partDetails.backToSearch")}
        </Link>
      </div>

      {/* SKU Header - Baleros-Bisa Style */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-acr-gray-900">
          {t("public.partDetails.sku")}: <span className="font-mono">{part.acr_sku}</span>
        </h1>
      </div>

      {/* Main Content - Image Emphasized Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Product Image Gallery - 2/3 width */}
        <AcrCard variant="elevated" padding="none" className="md:col-span-2 overflow-hidden">
          <PartImageGallery
            images={images || []}
            partName={`${part.part_type} ${part.acr_sku}`}
            className="w-full"
            viewer360Frames={viewer360Frames}
            has360Viewer={has360Viewer}
            isLoading={isMediaLoading}
          />
        </AcrCard>

        {/* Part Details - Baleros-Bisa Style - 1/3 width */}
        <AcrCard variant="featured" padding="default" className="md:col-span-1">
          <AcrCardContent>
            {/* Specifications Table */}
            <div className="border border-acr-gray-200 rounded">
              <div className="bg-acr-gray-50 border-b border-acr-gray-200 px-3 py-2">
                <h4 className="text-sm font-semibold text-acr-gray-900 text-center">
                  {t("public.partDetails.specifications")}
                </h4>
              </div>
              <div className="p-3">
                <div className="space-y-1">
                  {/* SKU - First Row */}
                  <div className="text-sm text-acr-gray-900">
                    -{" "}
                    <span className="font-medium">
                      {t("public.partDetails.sku")}:
                    </span>{" "}
                    <span className="font-mono">{part.acr_sku}</span>
                  </div>

                  {/* Brand info */}
                  <div className="text-sm text-acr-gray-900">
                    -{" "}
                    <span className="font-medium">
                      {t("public.partDetails.brand")}:
                    </span>{" "}
                    ACR
                  </div>

                  {/* Part Type/Class */}
                  <div className="text-sm text-acr-gray-900">
                    -{" "}
                    <span className="font-medium">
                      {t("public.partDetails.type")}:
                    </span>{" "}
                    {part.part_type}
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
