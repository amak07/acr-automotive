import { useLocale } from "@/contexts/LocaleContext";
import { useFilterOptions } from "@/hooks";
import { PartWithDetails } from "@/types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { SkeletonPartForm } from "@/components/ui/skeleton";
import { PartBasicInfo } from "../part-details/PartBasicInfo";
import { PartDetailsActions } from "../part-details/PartDetailsActions";
import { PartApplications } from "../vehicle-apps/PartApplications";
import { PartCrossReferences } from "../cross-refs/PartCrossReferences";
import { PartMediaManager } from "./PartMediaManager";

export interface PartFormData {
  part_type: string;
  position_type: string;
  abs_type: string;
  drive_type: string;
  bolt_pattern: string;
  specifications: string;
  sku_number?: string; // Only for create mode
}

interface PartFormContainerProps {
  mode: "create" | "edit";
  partData?: PartWithDetails;
  onSubmit: (data: PartFormData) => Promise<void>;
  isSubmitting: boolean;
  isLoading?: boolean; // For edit mode data loading
  error?: any; // For edit mode errors
  children?: React.ReactNode; // For mode-specific content
}

export function PartFormContainer({
  mode,
  partData,
  onSubmit,
  isSubmitting,
  isLoading = false,
  error,
  children,
}: PartFormContainerProps) {
  const { t } = useLocale();
  const { data: filterOptions, isLoading: filterOptionsLoading } =
    useFilterOptions();

  // Form management - moved from the page
  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty },
  } = useForm<PartFormData>({
    mode: "onBlur",
    defaultValues: {
      part_type: "__unspecified_part_type__",
      position_type: "__unspecified_position_type__",
      abs_type: "__unspecified_abs_type__",
      drive_type: "__unspecified_drive_type__",
      bolt_pattern: "__unspecified_bolt_pattern__",
      specifications: "",
      sku_number: "", // For create mode
    },
  });

  // Reset form values when data loads (edit mode)
  useEffect(() => {
    if (mode === "edit" && partData && !filterOptionsLoading) {
      const formValues = {
        part_type: partData.part_type ?? "__unspecified_part_type__",
        position_type:
          partData.position_type ?? "__unspecified_position_type__",
        abs_type: partData.abs_type ?? "__unspecified_abs_type__",
        drive_type: partData.drive_type ?? "__unspecified_drive_type__",
        bolt_pattern: partData.bolt_pattern ?? "__unspecified_bolt_pattern__",
        specifications: partData.specifications ?? "",
      };

      setTimeout(() => {
        reset(formValues, { keepDirty: false, keepDefaultValues: false });
      }, 0);
    }
  }, [mode, partData, filterOptionsLoading, reset]);

  // Handle all loading states
  if (filterOptionsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-acr-gray-100">
        <AppHeader variant="admin" />
        <div className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
          {children}
          <SkeletonPartForm />
        </div>
      </div>
    );
  }

  // Handle error states
  if (error) {
    return (
      <div className="min-h-screen bg-acr-gray-100">
        <AppHeader variant="admin" />
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
    <div
      className="min-h-screen bg-acr-gray-100"
      data-testid="part-form-container"
    >
      <AppHeader variant="admin" />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        {children}

        <form
          onSubmit={handleSubmit(onSubmit)}
          data-testid="part-form"
          id="part-form"
        >
          <PartBasicInfo
            data={partData || {}}
            control={control}
            filterOptions={filterOptions}
            isCreateMode={mode === "create"}
          />

          {/* Only show applications, images, and cross-references in edit mode - they need existing part_id */}
          {mode === "edit" && partData && (
            <>
              <PartMediaManager partId={partData.id || ""} />

              <PartApplications
                vehicleCount={partData.vehicle_count || 0}
                partId={partData.id || ""}
                vehicleApplications={partData.vehicle_applications || []}
              />

              <PartCrossReferences
                crossReferenceCount={partData.cross_reference_count || 0}
                partId={partData.id || ""}
                crossReferences={partData.cross_references || []}
              />
            </>
          )}

          <PartDetailsActions
            isDirty={isDirty}
            isSaving={isSubmitting}
            mode={mode}
          />
        </form>
      </main>
    </div>
  );
}
