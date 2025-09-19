"use client";

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
  AcrLabel
} from "@/components/acr";
import {
  useCreateVehicleApplication,
  mapCreateVehicleApplicationErrors,
  CreateVehicleApplicationParams
} from "@/hooks/useCreateVehicleApplication";
import { createVehicleSchema } from "@/app/api/admin/vehicles/zod-schemas";

interface AddVehicleApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
}

export function AddVehicleApplicationModal({
  isOpen,
  onClose,
  partId
}: AddVehicleApplicationModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const createMutation = useCreateVehicleApplication();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid }
  } = useForm<CreateVehicleApplicationParams>({
    resolver: zodResolver(createVehicleSchema),
    mode: "onBlur",
    defaultValues: {
      part_id: partId,
      make: "",
      model: "",
      start_year: 2020,
      end_year: 2025
    }
  });

  const onSubmit = async (data: CreateVehicleApplicationParams) => {
    try {
      await createMutation.mutateAsync(data);

      toast({
        title: t("common.success"),
        description: "Vehicle application added successfully",
        variant: "success" as any,
      });

      handleClose();
    } catch (error: any) {
      // Map API errors to form fields
      const fieldErrors = mapCreateVehicleApplicationErrors(error);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateVehicleApplicationParams, {
          type: "server",
          message
        });
      });

      toast({
        title: t("common.error.title"),
        description: error.error || "Failed to add vehicle application",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AcrModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("modals.addVehicleApplication.title")}
      description={t("modals.addVehicleApplication.description")}
      size="md"
      showCloseButton={true}
    >
      <form id="add-vehicle-application-form" onSubmit={handleSubmit(onSubmit)}>
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
        >
          {t("common.actions.cancel")}
        </AcrButton>
        <AcrButton
          type="submit"
          form="add-vehicle-application-form"
          variant="primary"
          disabled={!isValid || createMutation.isPending}
          className="flex items-center gap-2"
        >
          {createMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("common.actions.saving")}
            </>
          ) : (
            t("common.actions.save")
          )}
        </AcrButton>
      </AcrModalFooter>
    </AcrModal>
  );
}