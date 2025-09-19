"use client";

import { useLocale } from "@/contexts/LocaleContext";
import {
  AcrButton,
  AcrCard,
  AcrCardHeader,
  AcrCardContent,
} from "@/components/acr";
import { Car, Plus, Loader2, Edit, Trash2 } from "lucide-react";

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

interface PartApplicationsProps {
  vehicleCount?: number;
  partId: string;
  vehicleApplications?: VehicleApplication[];
}

export function PartApplications({
  vehicleCount = 0,
  partId,
  vehicleApplications = [],
}: PartApplicationsProps) {
  const { t } = useLocale();

  return (
    <AcrCard variant="default" padding="none" className="mb-6">
      <AcrCardHeader className="px-4 pt-6 lg:px-6">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-acr-gray-900">
              {t("admin.parts.vehicleApplications")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {vehicleCount}
            </span>
          </div>
          <AcrButton
            variant="primary"
            size="default"
            className="w-full"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Application
          </AcrButton>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-acr-gray-900">
              {t("admin.parts.vehicleApplications")}
            </h2>
            <span className="bg-acr-gray-100 text-acr-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {vehicleCount} {t("admin.parts.vehicles")}
            </span>
          </div>

          <AcrButton variant="primary" size="default" type="button">
            <Plus className="w-4 h-4" />
            Add Application
          </AcrButton>
        </div>
      </AcrCardHeader>

      <AcrCardContent className="px-4 pb-6 lg:px-6">
        {vehicleCount === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-12 border-2 border-dashed border-acr-gray-200 rounded-lg">
            <div className="text-center">
              <Car className="w-12 h-12 text-acr-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-acr-gray-900 mb-2">
                {t("partDetails.empty.noApplications")}
              </h3>
              <p className="text-sm text-acr-gray-500 mb-4">
                {t("partDetails.empty.applicationsDescription")}
              </p>
              <AcrButton variant="primary" size="default" type="button">
                <Plus className="w-4 h-4 mr-2" />
                {t("partDetails.empty.addFirstApplication")}
              </AcrButton>
            </div>
          </div>
        ) : (
          // Data table
          <div className="space-y-4">
            {/* Mobile view - Card layout */}
            <div className="block lg:hidden space-y-3">
              {vehicleApplications.map((app, index) => {
                const brandCode = app.make.charAt(0).toUpperCase();
                const yearRange = `${app.start_year}-${app.end_year}`;
                return (
                  <div
                    key={app.id}
                    className="border border-acr-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center text-white ${
                            brandCode === "H"
                              ? "bg-red-500"
                              : brandCode === "T"
                              ? "bg-blue-500"
                              : brandCode === "N"
                              ? "bg-gray-500"
                              : brandCode === "M"
                              ? "bg-purple-500"
                              : "bg-green-500"
                          }`}
                        >
                          {brandCode}
                        </span>
                        <span className="font-medium text-acr-gray-900">
                          {app.make}
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
                          {t("partDetails.vehicleApps.mobile.model")}
                        </span>{" "}
                        {app.model}
                      </div>
                      <div>
                        <span className="text-acr-gray-500">
                          {t("partDetails.vehicleApps.mobile.years")}
                        </span>{" "}
                        {yearRange}
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
                        {t("partDetails.vehicleApps.table.brand")}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.vehicleApps.table.model")}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.vehicleApps.table.yearRange")}
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-acr-gray-500 uppercase tracking-wider">
                        {t("partDetails.vehicleApps.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-acr-gray-100">
                    {vehicleApplications.map((app) => {
                      const brandCode = app.make.charAt(0).toUpperCase();
                      const yearRange = `${app.start_year}-${app.end_year}`;
                      return (
                        <tr key={app.id} className="hover:bg-acr-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center text-white ${
                                  brandCode === "H"
                                    ? "bg-red-500"
                                    : brandCode === "T"
                                    ? "bg-blue-500"
                                    : brandCode === "N"
                                    ? "bg-gray-500"
                                    : brandCode === "M"
                                    ? "bg-purple-500"
                                    : "bg-green-500"
                                }`}
                              >
                                {brandCode}
                              </span>
                              <span className="text-sm font-medium text-acr-gray-900">
                                {app.make}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-acr-gray-900">
                            {app.model}
                          </td>
                          <td className="py-3 px-4 text-sm text-acr-gray-900">
                            {yearRange}
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
