"use client";

import { useGetPartById } from "@/hooks";
import { useParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { PartDetailsBreadcrumb } from "@/components/features/admin/layout/PartDetailsBreadcrumb";
import { PartDetailsHeader } from "@/components/features/admin/part-details/PartDetailsHeader";
import { PartMetadata } from "@/components/features/admin/part-details/PartMetadata";
import { useUpdatePartById } from "@/hooks";
import { useToast } from "@/hooks";
import { withAdminAuth } from "@/components/shared/auth/withAdminAuth";
import { UpdatePartsParams } from "@/hooks/admin/useUpdatePartById";
import {
  PartFormContainer,
  PartFormData,
} from "@/components/features/admin/parts/PartFormContainer";

function PartDetailsPage() {
  const params = useParams();
  const { t } = useLocale();
  const sku = params.sku as string;

  const { data, error, isLoading } = useGetPartById({
    sku: sku,
  });

  const updateMutation = useUpdatePartById();
  const { toast } = useToast();

  const onSubmit = async (updatedData: PartFormData) => {
    try {
      // Convert __unspecified__ back to undefined for API validation
      const partToUpdate: UpdatePartsParams = {
        part_type: updatedData.part_type.startsWith("__unspecified_")
          ? undefined
          : updatedData.part_type,
        position_type: updatedData.position_type.startsWith("__unspecified_")
          ? undefined
          : updatedData.position_type,
        abs_type: updatedData.abs_type.startsWith("__unspecified_")
          ? undefined
          : updatedData.abs_type,
        drive_type: updatedData.drive_type.startsWith("__unspecified_")
          ? undefined
          : updatedData.drive_type,
        bolt_pattern: updatedData.bolt_pattern.startsWith("__unspecified_")
          ? undefined
          : updatedData.bolt_pattern,
        specifications: updatedData.specifications || undefined,
        id: data?.id || "",
      };

      await updateMutation.mutateAsync(partToUpdate);

      toast({
        title: t("common.success"),
        description: t("partDetails.actions.saveSuccess"),
        variant: "success" as any,
      });
    } catch (error) {
      toast({
        title: t("common.error.title"),
        description: t("partDetails.actions.saveError"),
        variant: "destructive",
      });
    }
  };

  return (
    <PartFormContainer
      mode="edit"
      partData={data}
      onSubmit={onSubmit}
      isSubmitting={updateMutation.isPending}
      isLoading={isLoading}
      error={error}
    >
      <PartDetailsBreadcrumb acrSku={data?.acr_sku} partId={data?.id || ""} />
      <PartDetailsHeader
        acrSku={data?.acr_sku}
        partType={data?.part_type}
        vehicleCount={data?.vehicle_count || 0}
        crossReferenceCount={data?.cross_reference_count || 0}
        positionType={data?.position_type || undefined}
        absType={data?.abs_type || undefined}
        driveType={data?.drive_type || undefined}
        boltPattern={data?.bolt_pattern || undefined}
        isSaving={updateMutation.isPending}
        partId={data?.id}
        isLoading={isLoading}
      />
      <PartMetadata
        createdAt={data?.created_at || undefined}
        updatedAt={data?.updated_at || undefined}
        isLoading={isLoading}
      />
    </PartFormContainer>
  );
}

// Export the wrapped component with admin authentication
export default withAdminAuth(PartDetailsPage);
