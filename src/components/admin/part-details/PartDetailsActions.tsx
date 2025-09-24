"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, ConfirmDialog } from "@/components/acr";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface PartDetailsActionsProps {
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  mode?: 'create' | 'edit';
}

export function PartDetailsActions({ onSave, isSaving = false, isDirty = false, mode = 'edit' }: PartDetailsActionsProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | null>(null);


  // Get contextual button text based on mode
  const getButtonText = () => {
    if (isSaving) {
      return mode === 'create' ? t("common.actions.creating") : t("common.actions.saving");
    }
    return mode === 'create' ? t("common.actions.createPart") : t("partDetails.actions.saveChanges");
  };

  const getShortButtonText = () => {
    return mode === 'create' ? "Create" : "Save";
  };

  const handleBack = () => {
    if (isDirty) {
      setPendingAction('back');
      setShowConfirmDialog(true);
    } else {
      router.push("/admin");
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction === 'back') {
      router.push("/admin");
    }
  };

  return (
    <>
      <div className="border-t border-acr-gray-200 bg-white px-4 py-4 lg:px-6 lg:py-6">
      {/* Mobile Layout - Stacked */}
      <div className="block lg:hidden space-y-3">
        <AcrButton
          variant="primary"
          size="default"
          onClick={onSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2"
          type="submit"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">{getButtonText()}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{getButtonText()}</span>
              <span className="sm:hidden">{getShortButtonText()}</span>
            </>
          )}
        </AcrButton>
        <AcrButton
          variant="secondary"
          size="default"
          onClick={handleBack}
          className="w-full flex items-center justify-center gap-2"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.actions.back")}
        </AcrButton>
      </div>

      {/* Desktop Layout - Original */}
      <div className="hidden lg:flex items-center justify-between">
        <AcrButton
          variant="secondary"
          size="default"
          onClick={handleBack}
          className="flex items-center gap-2"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.actions.back")}
        </AcrButton>

        <AcrButton
          variant="primary"
          size="default"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2"
          type="submit"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {getButtonText()}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {getButtonText()}
            </>
          )}
        </AcrButton>
      </div>
    </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmAction}
        title={t("common.confirm.unsavedChanges.title")}
        description={t("common.confirm.unsavedChanges.description")}
        confirmText={t("common.actions.discard")}
        cancelText={t("common.actions.cancel")}
        variant="warning"
      />
    </>
  );
}