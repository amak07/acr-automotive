"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrButton,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
} from "@/components/acr";
import { Link2, Plus, Edit, Trash2 } from "lucide-react";

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

  return (
    <AcrCard variant="default" padding="none" className="mb-6">
      <AcrCardHeader className="px-4 pt-6 lg:px-6">
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

          <AcrButton variant="primary" size="default" type="button">
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
              <AcrButton variant="primary" size="default" type="button">
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
                        <AcrButton variant="secondary" size="sm" type="button">
                          <Edit className="w-3 h-3" />
                        </AcrButton>
                        <AcrButton variant="secondary" size="sm" type="button">
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
                              >
                                <Edit className="w-3 h-3" />
                              </AcrButton>
                              <AcrButton
                                variant="secondary"
                                size="sm"
                                type="button"
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
    </AcrCard>
  );
}
