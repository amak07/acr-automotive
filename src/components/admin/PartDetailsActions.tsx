"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton } from "@/components/acr";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface PartDetailsActionsProps {
  onSave?: () => void;
  isSaving?: boolean;
}

export function PartDetailsActions({ onSave, isSaving = false }: PartDetailsActionsProps) {
  const { t } = useLocale();
  const router = useRouter();

  const handleBack = () => {
    router.push("/admin");
  };

  return (
    <div className="border-t border-acr-gray-200 bg-white px-4 py-4 lg:px-6 lg:py-6">
      {/* Mobile Layout - Stacked */}
      <div className="block lg:hidden space-y-3">
        <div className="flex gap-3">
          <AcrButton
            variant="secondary"
            size="default"
            className="flex-1"
            type="button"
          >
            {t("common.actions.cancel")}
          </AcrButton>
          <AcrButton
            variant="primary"
            size="default"
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2"
            type="submit"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">{t("common.actions.saving")}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{t("partDetails.actions.saveChanges")}</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </AcrButton>
        </div>
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

        <div className="flex items-center gap-3">
          <AcrButton
            variant="secondary"
            size="default"
            type="button"
          >
            {t("common.actions.cancel")}
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
                {t("common.actions.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("partDetails.actions.saveChanges")}
              </>
            )}
          </AcrButton>
        </div>
      </div>
    </div>
  );
}