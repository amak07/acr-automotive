"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton } from "@/components/acr";
import { Save } from "lucide-react";

interface PartDetailsActionsProps {
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  mode?: 'create' | 'edit';
}

export function PartDetailsActions({ onSave, isSaving = false, isDirty = false, mode = 'edit' }: PartDetailsActionsProps) {
  const { t } = useLocale();

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

  return (
    <div className="border-t border-acr-gray-200 bg-white px-4 py-4 lg:px-6 lg:py-6">
      <AcrButton
        variant="primary"
        size="default"
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className="w-full lg:w-auto flex items-center justify-center gap-2"
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
    </div>
  );
}
