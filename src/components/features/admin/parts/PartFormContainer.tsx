import { useLocale } from "@/contexts/LocaleContext";
import { useFilterOptions } from "@/hooks";
import { PartWithDetails } from "@/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AppHeader } from "@/components/shared/layout/AppHeader";
import { SkeletonPartForm } from "@/components/ui/skeleton";
import { PartBasicInfo } from "../part-details/PartBasicInfo";
import { PartDetailsActions } from "../part-details/PartDetailsActions";
import { PartDetailsSidebar } from "../part-details/PartDetailsSidebar";
import { MobileCompletionBar } from "../part-details/MobileCompletionBar";
import { PartApplications } from "../vehicle-apps/PartApplications";
import { PartCrossReferences } from "../cross-refs/PartCrossReferences";
import { PartMediaManager } from "./PartMediaManager";
import { Info, Image, MapPin, Link2 } from "lucide-react";

export interface PartFormData {
  part_type: string;
  position_type: string;
  abs_type: string;
  drive_type: string;
  bolt_pattern: string;
  specifications: string;
  sku_number?: string; // Only for create mode
}

type PartEditTab = "basicInfo" | "media" | "applications" | "crossReferences";

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

  // Mobile tab navigation state
  const [activeTab, setActiveTab] = useState<PartEditTab>("basicInfo");

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

  // Calculate completion status
  const completionStatus = {
    basicInfo: mode === "create" ? !!partData : true, // Always true for edit mode
    media:
      mode === "edit" && partData
        ? !!(partData.has_product_images || partData.has_360_viewer)
        : false,
    applications: (partData?.vehicle_count || 0) > 0,
    crossReferences: (partData?.cross_reference_count || 0) > 0,
  };

  return (
    <div
      className="min-h-screen bg-acr-gray-100"
      data-testid="part-form-container"
    >
      <AppHeader variant="admin" />

      <main className="px-4 py-6 mx-auto lg:max-w-7xl lg:px-8">
        {children}

        {/* Mobile: Compact completion indicator at top */}
        {mode === "edit" && (
          <div className="lg:hidden mb-4">
            <MobileCompletionBar completionStatus={completionStatus} />
          </div>
        )}

        {/* Mobile: Tab navigation (hidden on desktop) - matches public search pattern */}
        {mode === "edit" && (
          <div className="lg:hidden mb-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Thin red accent line */}
              <div className="h-0.5 bg-acr-red-500" />

              {/* Tab triggers - solid button style like PublicSearchFilters */}
              <div className="inline-flex w-full items-center justify-start gap-1 rounded-lg border border-acr-gray-300 bg-acr-gray-50 p-1">
                {/* Basic Info Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("basicInfo")}
                  className={`
                    inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5
                    text-xs font-medium transition-all duration-200
                    ${
                      activeTab === "basicInfo"
                        ? "bg-white text-acr-red-600 shadow-sm font-semibold"
                        : "bg-transparent text-acr-gray-700"
                    }
                  `}
                >
                  <Info className="w-4 h-4 mr-1.5" />
                  {t("partDetails.tabs.basicInfo")}
                </button>

                {/* Media Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("media")}
                  className={`
                    inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5
                    text-xs font-medium transition-all duration-200
                    ${
                      activeTab === "media"
                        ? "bg-white text-acr-red-600 shadow-sm font-semibold"
                        : "bg-transparent text-acr-gray-700"
                    }
                  `}
                >
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="w-4 h-4 mr-1.5" />
                  {t("partDetails.tabs.media")}
                </button>

                {/* Applications Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("applications")}
                  className={`
                    inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5
                    text-xs font-medium transition-all duration-200
                    ${
                      activeTab === "applications"
                        ? "bg-white text-acr-red-600 shadow-sm font-semibold"
                        : "bg-transparent text-acr-gray-700"
                    }
                  `}
                >
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {t("partDetails.tabs.applications")}
                </button>

                {/* Cross References Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab("crossReferences")}
                  className={`
                    inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-2.5
                    text-xs font-medium transition-all duration-200
                    ${
                      activeTab === "crossReferences"
                        ? "bg-white text-acr-red-600 shadow-sm font-semibold"
                        : "bg-transparent text-acr-gray-700"
                    }
                  `}
                >
                  <Link2 className="w-4 h-4 mr-1.5" />
                  {t("partDetails.tabs.crossReferences")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Two-column layout with sticky sidebar */}
        {/* Mobile: Stacked layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Main content area - 8 columns on desktop */}
          <div className="lg:col-span-8 mb-6 lg:mb-0">
            <form
              onSubmit={handleSubmit(onSubmit)}
              data-testid="part-form"
              id="part-form"
              className="space-y-6"
            >
              {/* Basic Info Section */}
              {/* Desktop: Always visible | Mobile (edit): Only when activeTab === "basicInfo" | Mobile (create): Always visible */}
              <div
                className={
                  mode === "edit"
                    ? `lg:block ${activeTab === "basicInfo" ? "block" : "hidden"}`
                    : "block"
                }
              >
                <PartBasicInfo
                  data={partData || {}}
                  control={control}
                  filterOptions={filterOptions}
                  isCreateMode={mode === "create"}
                />
              </div>

              {/* Only show applications, images, and cross-references in edit mode - they need existing part_id */}
              {mode === "edit" && partData && (
                <>
                  {/* Media Section */}
                  {/* Desktop: Always visible | Mobile: Only when activeTab === "media" */}
                  <div
                    className={`lg:block ${activeTab === "media" ? "block" : "hidden"}`}
                  >
                    <PartMediaManager partSku={partData.acr_sku || ""} />
                  </div>

                  {/* Applications Section */}
                  {/* Desktop: Always visible | Mobile: Only when activeTab === "applications" */}
                  <div
                    className={`lg:block ${activeTab === "applications" ? "block" : "hidden"}`}
                  >
                    <PartApplications
                      vehicleCount={partData.vehicle_count || 0}
                      partId={partData.id || ""}
                      vehicleApplications={partData.vehicle_applications || []}
                    />
                  </div>

                  {/* Cross References Section */}
                  {/* Desktop: Always visible | Mobile: Only when activeTab === "crossReferences" */}
                  <div
                    className={`lg:block ${activeTab === "crossReferences" ? "block" : "hidden"}`}
                  >
                    <PartCrossReferences
                      crossReferenceCount={partData.cross_reference_count || 0}
                      partId={partData.id || ""}
                      crossReferences={partData.cross_references || []}
                    />
                  </div>
                </>
              )}

              {/* Mobile: Show actions at bottom of form */}
              <div className="lg:hidden">
                <PartDetailsActions
                  isDirty={isDirty}
                  isSaving={isSubmitting}
                  mode={mode}
                />
              </div>
            </form>
          </div>

          {/* Sidebar - 4 columns on desktop, hidden on mobile (shown inline above) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-6">
              <PartDetailsSidebar
                acrSku={partData?.acr_sku}
                partType={partData?.part_type}
                vehicleCount={partData?.vehicle_count || 0}
                crossReferenceCount={partData?.cross_reference_count || 0}
                isSaving={isSubmitting}
                isDirty={isDirty}
                isLoading={isLoading}
                completionStatus={completionStatus}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
