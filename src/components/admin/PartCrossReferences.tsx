"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks/use-toast";
import {
  AcrButton,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
} from "@/components/acr";
import { Link2, Plus, Edit, Trash2 } from "lucide-react";
import { EditCrossReferenceModal } from "./EditCrossReferenceModal";
import { AddCrossReferenceModal } from "./AddCrossReferenceModal";
import { useDeleteCrossReference } from "@/hooks/useDeleteCrossReference";

interface CrossReference {
  id: string;
  acr_part_id: string;
  competitor_sku: string;
  competitor_brand: string | null;
  created_at: string;
  updated_at: string;
}

interface PartCrossReferencesProps {
  crossReferenceCount?: number;
  partId: string;
  crossReferences?: CrossReference[];
}

export function PartCrossReferences({
  crossReferenceCount = 0,
  partId,
  crossReferences = [],
}: PartCrossReferencesProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const deleteMutation = useDeleteCrossReference();

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    crossReference: CrossReference | null;
  }>({
    isOpen: false,
    crossReference: null,
  });

  const [addModal, setAddModal] = useState(false);

  const handleEdit = (crossReference: CrossReference) => {
    setEditModal({
      isOpen: true,
      crossReference,
    });
  };

  const handleCloseModal = () => {
    setEditModal({
      isOpen: false,
      crossReference: null,
    });
  };

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleCloseAddModal = () => {
    setAddModal(false);
  };

  const handleDelete = async (crossReference: CrossReference) => {
    if (window.confirm(`Are you sure you want to delete the cross reference ${crossReference.competitor_sku}${crossReference.competitor_brand ? ` (${crossReference.competitor_brand})` : ''}?`)) {
      try {
        await deleteMutation.mutateAsync({ id: crossReference.id });

        toast({
          title: t("common.success"),
          description: `${crossReference.competitor_sku}${crossReference.competitor_brand ? ` (${crossReference.competitor_brand})` : ''} deleted successfully`,
          variant: "success" as any,
        });
      } catch (error: any) {
        toast({
          title: t("common.error.title"),
          description: error.error || "Failed to delete cross reference",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AcrCard variant="default" padding="none" className="mb-6" data-testid="part-cross-references-section">
      <AcrCardHeader className="px-4 pt-6 lg:px-6" data-testid="part-cross-references-header">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-acr-gray-900">
              {t("admin.parts.crossReferences")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {crossReferenceCount}
            </span>
          </div>
          <AcrButton
            variant="primary"
            size="default"
            className="w-full"
            type="button"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4" />
            Add Reference
          </AcrButton>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-acr-gray-900">
              {t("admin.parts.crossReferences")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {crossReferenceCount} {t("admin.parts.references")}
            </span>
          </div>

          <AcrButton variant="primary" size="default" type="button" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Add Reference
          </AcrButton>
        </div>
      </AcrCardHeader>

      <AcrCardContent className="px-4 pb-6 lg:px-6">
        {crossReferenceCount === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-12 border-2 border-dashed border-acr-gray-200 rounded-lg">
            <div className="text-center">
              <Link2 className="w-12 h-12 text-acr-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-acr-gray-900 mb-2">
                {t("partDetails.empty.noCrossReferences")}
              </h3>
              <p className="text-sm text-acr-gray-500 mb-4">
                {t("partDetails.empty.crossReferencesDescription")}
              </p>
              <AcrButton variant="primary" size="default" type="button" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                {t("partDetails.empty.addFirstReference")}
              </AcrButton>
            </div>
          </div>
        ) : (
          // Data table
          <div className="space-y-4">
            {/* Mobile view - Card layout */}
            <div className="block lg:hidden space-y-3">
              {crossReferences.map((ref) => {
                const brandCode =
                  ref.competitor_brand?.charAt(0).toUpperCase() || "U";
                return (
                  <div
                    key={ref.id}
                    className="border border-acr-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center text-white ${
                            brandCode === "T"
                              ? "bg-orange-500"
                              : brandCode === "M"
                              ? "bg-purple-500"
                              : brandCode === "S"
                              ? "bg-green-500"
                              : brandCode === "B"
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {brandCode}
                        </span>
                        <span className="font-medium text-acr-gray-900">
                          {ref.competitor_sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => handleEdit(ref)}
                        >
                          <Edit className="w-3 h-3" />
                        </AcrButton>
                        <AcrButton
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => handleDelete(ref)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </AcrButton>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-acr-gray-500">
                          {t("partDetails.crossRefs.mobile.brand")}
                        </span>{" "}
                        {ref.competitor_brand || t("common.notSpecified")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop view - Table layout */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-acr-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.crossRefs.table.competitorSku")}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.crossRefs.table.brand")}
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.crossRefs.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-acr-gray-100">
                    {crossReferences.map((ref) => {
                      const brandCode =
                        ref.competitor_brand?.charAt(0).toUpperCase() || "U";
                      return (
                        <tr key={ref.id} className="hover:bg-acr-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-acr-gray-900">
                            {ref.competitor_sku}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center text-white ${
                                  brandCode === "T"
                                    ? "bg-orange-500"
                                    : brandCode === "M"
                                    ? "bg-purple-500"
                                    : brandCode === "S"
                                    ? "bg-green-500"
                                    : brandCode === "B"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                                }`}
                              >
                                {brandCode}
                              </span>
                              <span className="text-sm font-medium text-acr-gray-900">
                                {ref.competitor_brand ||
                                  t("common.notSpecified")}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <AcrButton
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => handleEdit(ref)}
                              >
                                <Edit className="w-3 h-3" />
                              </AcrButton>
                              <AcrButton
                                variant="secondary"
                                size="sm"
                                type="button"
                                onClick={() => handleDelete(ref)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </AcrButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </AcrCardContent>

      {/* Edit Modal */}
      <EditCrossReferenceModal
        isOpen={editModal.isOpen}
        onClose={handleCloseModal}
        crossReference={editModal.crossReference}
      />

      {/* Add Modal */}
      <AddCrossReferenceModal
        isOpen={addModal}
        onClose={handleCloseAddModal}
        partId={partId}
      />
    </AcrCard>
  );
}
