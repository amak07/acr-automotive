"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks/use-toast";
import {
  AcrModal,
  AcrModalBody,
  AcrModalFooter,
  AcrButton,
  AcrInput,
  AcrLabel,
  ConfirmDialog
} from "@/components/acr";
import {
  useUpdateVehicleApplication,
  mapVehicleApplicationErrors,
  UpdateVehicleApplicationParams
} from "@/hooks/useUpdateVehicleApplication";
import { updateVehicleSchema } from "@/app/api/admin/vehicles/zod-schemas";

interface VehicleApplication {
  id: string;
  part_id: string;
  make: string;
  model: string;
  start_year: number;
  end_year: number;
  created_at: string;
  updated_at: string;
}

interface EditVehicleApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: VehicleApplication | null;
}

export function EditVehicleApplicationModal({
  isOpen,
  onClose,
  application
}: EditVehicleApplicationModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const updateMutation = useUpdateVehicleApplication();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isDirty }
  } = useForm<UpdateVehicleApplicationParams>({
    resolver: zodResolver(updateVehicleSchema),
    mode: "onBlur",
    defaultValues: {
      id: "",
      make: "",
      model: "",
      start_year: 2000,
      end_year: 2000
    }
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Reset form when application changes
  useEffect(() => {
    if (application && isOpen) {
      reset({
        id: application.id,
        make: application.make,
        model: application.model,
        start_year: application.start_year,
        end_year: application.end_year
      });
    }
  }, [application, isOpen, reset]);

  const onSubmit = async (data: UpdateVehicleApplicationParams) => {
    try {
      await updateMutation.mutateAsync(data);

      toast({
        title: t("common.success"),
        description: `${data.make} ${data.model} (${data.start_year}-${data.end_year}) updated successfully`,
        variant: "success" as any,
      });

      onClose();
    } catch (error: any) {
      // Map API errors to form fields
      const fieldErrors = mapVehicleApplicationErrors(error);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof UpdateVehicleApplicationParams, {
          type: "server",
          message
        });
      });

      toast({
        title: t("common.error.title"),
        description: error.error || "Failed to update vehicle application",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      reset();
      onClose();
    }
  };

  const handleConfirmClose = () => {
    reset();
    onClose();
  };

  if (!application) return null;

  return (
    <AcrModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("modals.editVehicleApplication.title")}
      description={t("modals.editVehicleApplication.description")}
      size="md"
      showCloseButton={true}
      data-testid="edit-vehicle-application-modal"
    >
      <form id="edit-vehicle-application-form" onSubmit={handleSubmit(onSubmit)}>
        <AcrModalBody>
          <div className="grid grid-cols-1 gap-4">
            {/* Make Field */}
            <div>
              <AcrLabel required>
                {t("forms.labels.brand")}
              </AcrLabel>
              <Controller
                name="make"
                control={control}
                render={({ field }) => (
                  <AcrInput
                    {...field}
                    placeholder={t("forms.placeholders.make")}
                    error={errors.make?.message}
                    helperText={errors.make?.message}
                  />
                )}
              />
            </div>

            {/* Model Field */}
            <div>
              <AcrLabel required>
                {t("forms.labels.model")}
              </AcrLabel>
              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <AcrInput
                    {...field}
                    placeholder={t("forms.placeholders.model")}
                    error={errors.model?.message}
                    helperText={errors.model?.message}
                  />
                )}
              />
            </div>

            {/* Year Range Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <AcrLabel required>{t("forms.labels.startYear")}</AcrLabel>
                <Controller
                  name="start_year"
                  control={control}
                  render={({ field }) => (
                    <AcrInput
                      {...field}
                      type="number"
                      min="1900"
                      max="2030"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder={t("forms.placeholders.startYear")}
                      error={errors.start_year?.message}
                      helperText={errors.start_year?.message}
                    />
                  )}
                />
              </div>

              <div>
                <AcrLabel required>{t("forms.labels.endYear")}</AcrLabel>
                <Controller
                  name="end_year"
                  control={control}
                  render={({ field }) => (
                    <AcrInput
                      {...field}
                      type="number"
                      min="1900"
                      max="2030"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder={t("forms.placeholders.endYear")}
                      error={errors.end_year?.message}
                      helperText={errors.end_year?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </AcrModalBody>
      </form>

      <AcrModalFooter>
        <AcrButton
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={updateMutation.isPending}
        >
          {t("common.actions.cancel")}
        </AcrButton>
        <AcrButton
          type="submit"
          form="edit-vehicle-application-form"
          variant="primary"
          disabled={!isValid || updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("common.actions.saving")}
            </>
          ) : (
            t("common.actions.save")
          )}
        </AcrButton>
      </AcrModalFooter>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmClose}
        title={t("common.confirm.unsavedChanges.title")}
        description={t("common.confirm.unsavedChanges.description")}
        confirmText={t("common.actions.discard")}
        cancelText={t("common.actions.cancel")}
        variant="warning"
      />
    </AcrModal>
  );
}