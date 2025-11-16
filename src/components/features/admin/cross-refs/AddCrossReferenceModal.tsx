"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks";
import {
  AcrModal,
  AcrModalBody,
  AcrModalFooter,
  AcrButton,
  AcrInput,
  AcrLabel,
  ConfirmDialog,
} from "@/components/acr";
import { useCreateCrossReference } from "@/hooks";
import {
  createCrossRefSchema,
  CreateCrossReferenceParams,
} from "@/lib/schemas";
import { mapCrossReferenceErrors } from "@/hooks";

interface AddCrossReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  partId: string;
}

export function AddCrossReferenceModal({
  isOpen,
  onClose,
  partId,
}: AddCrossReferenceModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const createMutation = useCreateCrossReference();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isDirty },
  } = useForm<CreateCrossReferenceParams>({
    resolver: zodResolver(createCrossRefSchema),
    mode: "onBlur",
    defaultValues: {
      acr_part_id: partId,
      competitor_sku: "",
      competitor_brand: "",
    },
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const onSubmit = async (data: CreateCrossReferenceParams) => {
    try {
      await createMutation.mutateAsync(data);

      toast({
        title: t("common.success"),
        description: `${data.competitor_sku}${data.competitor_brand ? ` (${data.competitor_brand})` : ""} added successfully`,
        variant: "success" as any,
      });

      // Reset the form to clear isDirty state before closing
      reset();
      onClose();
    } catch (error: any) {
      // Map API errors to form fields
      const fieldErrors = mapCrossReferenceErrors(error);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof CreateCrossReferenceParams, {
          type: "server",
          message,
        });
      });

      toast({
        title: t("common.error.title"),
        description: error.error || "Failed to add cross reference",
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

  return (
    <AcrModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("modals.addCrossReference.title")}
      description={t("modals.addCrossReference.description")}
      size="md"
      showCloseButton={true}
      data-testid="add-cross-reference-modal"
    >
      <form id="add-cross-reference-form" onSubmit={handleSubmit(onSubmit)}>
        <AcrModalBody>
          <div className="grid grid-cols-1 gap-4">
            {/* Competitor SKU Field */}
            <div>
              <AcrLabel required>{t("forms.labels.competitorSku")}</AcrLabel>
              <Controller
                name="competitor_sku"
                control={control}
                render={({ field }) => (
                  <AcrInput
                    {...field}
                    placeholder={t("forms.placeholders.competitorSku")}
                    error={errors.competitor_sku?.message}
                    helperText={errors.competitor_sku?.message}
                  />
                )}
              />
            </div>

            {/* Competitor Brand Field */}
            <div>
              <AcrLabel>{t("forms.labels.competitorBrand")}</AcrLabel>
              <Controller
                name="competitor_brand"
                control={control}
                render={({ field }) => (
                  <AcrInput
                    {...field}
                    placeholder={t("forms.placeholders.competitorBrand")}
                    error={errors.competitor_brand?.message}
                    helperText={errors.competitor_brand?.message}
                  />
                )}
              />
            </div>
          </div>
        </AcrModalBody>
      </form>

      <AcrModalFooter>
        <AcrButton
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={createMutation.isPending}
        >
          {t("common.actions.cancel")}
        </AcrButton>
        <AcrButton
          type="submit"
          form="add-cross-reference-form"
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
