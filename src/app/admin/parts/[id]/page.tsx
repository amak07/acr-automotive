"use client";

import { useGetPartById } from "@/hooks/useGetPartById";
import { useParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PartDetailsBreadcrumb } from "@/components/admin/PartDetailsBreadcrumb";
import { PartDetailsHeader } from "@/components/admin/PartDetailsHeader";
import { PartBasicInfo } from "@/components/admin/PartBasicInfo";
import { PartApplications } from "@/components/admin/PartApplications";
import { PartCrossReferences } from "@/components/admin/PartCrossReferences";
import { PartMetadata } from "@/components/admin/PartMetadata";
import { PartDetailsActions } from "@/components/admin/PartDetailsActions";
import { Loader2 } from "lucide-react";

export default function PartDetailsPage() {
  const params = useParams();
  const { t } = useLocale();
  const id = params.id as string;

  const { data, error, isLoading } = useGetPartById({
    id: id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-acr-gray-100">
        <AdminHeader />
        <div className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-acr-red-600" />
              <p className="text-sm text-acr-gray-500">{t("common.loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-acr-gray-100">
        <AdminHeader />
        <div className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">
                {t("common.error.generic")}
              </p>
              <p className="text-xs text-acr-gray-500">
                {t("common.error.tryAgain")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <AdminHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        <PartDetailsBreadcrumb acrSku={data?.acr_sku} partId={id} />

        {data && (
          <>
            <PartDetailsHeader
              acrSku={data.acr_sku}
              partType={data.part_type}
              vehicleCount={data.vehicle_count || 0}
              crossReferenceCount={data.cross_reference_count || 0}
              positionType={data.position_type}
              absType={data.abs_type}
              driveType={data.drive_type}
              boltPattern={data.bolt_pattern}
            />

            <PartMetadata
              createdAt={data.created_at}
              updatedAt={data.updated_at}
            />

            <PartBasicInfo data={data} />

            <PartApplications 
              vehicleCount={data.vehicle_count || 0} 
              partId={id} 
            />

            <PartCrossReferences
              crossReferenceCount={data.cross_reference_count || 0}
              partId={id}
            />

            <PartDetailsActions />
          </>
        )}
      </main>
    </div>
  );
}
