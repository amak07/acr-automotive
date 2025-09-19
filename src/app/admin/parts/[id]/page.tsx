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
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import {
  UpdatePartsParams,
  useUpdatePartById,
} from "@/hooks/useUpdatePartById";
import { useToast } from "@/hooks/use-toast";
import { useFilterOptions } from "@/hooks/useFilterOptions";

export interface PartUpdateForm {
  part_type: string;
  position_type: string;
  abs_type: string;
  drive_type: string;
  bolt_pattern: string;
  specifications: string;
}

export default function PartDetailsPage() {
  const params = useParams();
  const { t } = useLocale();
  const id = params.id as string;

  const { data, error, isLoading } = useGetPartById({
    id: id,
  });

  const { data: filterOptions, isLoading: filterOptionsLoading } = useFilterOptions();

  const updateMutation = useUpdatePartById();
  const { toast } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<PartUpdateForm>({
    mode: "onBlur",
    defaultValues: {
      part_type: "__unspecified_part_type__",
      position_type: "__unspecified_position_type__",
      abs_type: "__unspecified_abs_type__",
      drive_type: "__unspecified_drive_type__",
      bolt_pattern: "__unspecified_bolt_pattern__",
      specifications: "",
    },
  });

  // this is needed to reset the default form values when the data actually loads after init.
  useEffect(() => {
    if (data && !isLoading && filterOptions && !filterOptionsLoading) {
      const formValues = {
        part_type: data.part_type ?? "__unspecified_part_type__",
        position_type: data.position_type ?? "__unspecified_position_type__",
        abs_type: data.abs_type ?? "__unspecified_abs_type__",
        drive_type: data.drive_type ?? "__unspecified_drive_type__",
        bolt_pattern: data.bolt_pattern ?? "__unspecified_bolt_pattern__",
        specifications: data.specifications ?? "",
      };

      // Use setTimeout to ensure this happens after other state updates
      setTimeout(() => {
        reset(formValues, { keepDirty: false, keepDefaultValues: false });
      }, 0);
    }
  }, [data, isLoading, filterOptions, filterOptionsLoading, reset]);

  const onSubmit = async (updatedData: PartUpdateForm) => {
    try {
      // Convert __unspecified__ back to undefined for API validation
      const partToUpdate: UpdatePartsParams = {
        part_type: updatedData.part_type.startsWith("__unspecified_") ? undefined : updatedData.part_type,
        position_type: updatedData.position_type.startsWith("__unspecified_") ? undefined : updatedData.position_type,
        abs_type: updatedData.abs_type.startsWith("__unspecified_") ? undefined : updatedData.abs_type,
        drive_type: updatedData.drive_type.startsWith("__unspecified_") ? undefined : updatedData.drive_type,
        bolt_pattern: updatedData.bolt_pattern.startsWith("__unspecified_") ? undefined : updatedData.bolt_pattern,
        specifications: updatedData.specifications || undefined,
        id,
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

        {data && !isLoading && filterOptions && !filterOptionsLoading && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <PartDetailsHeader
              acrSku={data.acr_sku}
              partType={data.part_type}
              vehicleCount={data.vehicle_count || 0}
              crossReferenceCount={data.cross_reference_count || 0}
              positionType={data.position_type || undefined}
              absType={data.abs_type || undefined}
              driveType={data.drive_type || undefined}
              boltPattern={data.bolt_pattern || undefined}
              isSaving={updateMutation.isPending}
            />

            <PartMetadata
              createdAt={data.created_at || undefined}
              updatedAt={data.updated_at || undefined}
            />

            <PartBasicInfo data={data} control={control} filterOptions={filterOptions} />

            <PartApplications
              vehicleCount={data.vehicle_count || 0}
              partId={id}
            />

            <PartCrossReferences
              crossReferenceCount={data.cross_reference_count || 0}
              partId={id}
            />

            <PartDetailsActions />
          </form>
        )}
      </main>
    </div>
  );
}
