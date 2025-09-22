"use client";

import { useEffect, useState } from "react";
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
  ConfirmDialog
} from "@/components/acr";
import {
  useUpdateCrossReference,
  mapCrossReferenceErrors,
  UpdateCrossReferenceParams
} from "@/hooks";
import { updateCrossRefSchema } from "@/app/api/admin/cross-references/zod-schemas";

interface CrossReference {
  id: string;
  acr_part_id: string;
  competitor_sku: string;
  competitor_brand: string | null;
  created_at: string;
  updated_at: string;
}

interface EditCrossReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossReference: CrossReference | null;
}

export function EditCrossReferenceModal({
  isOpen,
  onClose,
  crossReference
}: EditCrossReferenceModalProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const updateMutation = useUpdateCrossReference();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid, isDirty }
  } = useForm<UpdateCrossReferenceParams>({
    resolver: zodResolver(updateCrossRefSchema),
    mode: "onBlur",
    defaultValues: {
      id: "",
      competitor_sku: "",
      competitor_brand: ""
    }
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Reset form when cross reference changes
  useEffect(() => {
    if (crossReference && isOpen) {
      reset({
        id: crossReference.id,
        competitor_sku: crossReference.competitor_sku,
        competitor_brand: crossReference.competitor_brand || ""
      });
    }
  }, [crossReference, isOpen, reset]);

  const onSubmit = async (data: UpdateCrossReferenceParams) => {
    try {
      await updateMutation.mutateAsync(data);

      toast({
        title: t("common.success"),
        description: `${data.competitor_sku}${data.competitor_brand ? ` (${data.competitor_brand})` : ''} updated successfully`,
        variant: "success" as any,
      });

      onClose();
    } catch (error: any) {
      // Map API errors to form fields
      const fieldErrors = mapCrossReferenceErrors(error);

      Object.entries(fieldErrors).forEach(([field, message]) => {
        setError(field as keyof UpdateCrossReferenceParams, {
          type: "server",
          message
        });
      });

      toast({
        title: t("common.error.title"),
        description: error.error || "Failed to update cross reference",
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

  if (!crossReference) return null;

  return (
    <AcrModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("modals.editCrossReference.title")}
      description={t("modals.editCrossReference.description")}
      size="md"
      showCloseButton={true}
      data-testid="edit-cross-reference-modal"
    >
      <form id="edit-cross-reference-form" onSubmit={handleSubmit(onSubmit)}>
        <AcrModalBody>
          <div className="grid grid-cols-1 gap-4">
            {/* Competitor SKU Field */}
            <div>
              <AcrLabel required>
                {t("forms.labels.competitorSku")}
              </AcrLabel>
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
              <AcrLabel>
                {t("forms.labels.competitorBrand")}
              </AcrLabel>
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
          disabled={updateMutation.isPending}
        >
          {t("common.actions.cancel")}
        </AcrButton>
        <AcrButton
          type="submit"
          form="edit-cross-reference-form"
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