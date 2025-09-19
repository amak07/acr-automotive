"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { AcrButton, AcrCard } from "@/components/acr";
import { Settings, Eye, Save, MapPin, Shield, Zap, Wrench } from "lucide-react";

interface PartDetailsHeaderProps {
  acrSku: string;
  partType?: string;
  vehicleCount?: number;
  crossReferenceCount?: number;
  positionType?: string;
  absType?: string;
  driveType?: string;
  boltPattern?: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export function PartDetailsHeader({
  acrSku,
  partType,
  vehicleCount = 0,
  crossReferenceCount = 0,
  positionType,
  absType,
  driveType,
  boltPattern,
  onSave,
  isSaving = false,
}: PartDetailsHeaderProps) {
  const { t } = useLocale();

  // Helper function to get icon for stats with colors
  const getStatIcon = (index: number) => {
    const iconConfigs = [
      { icon: MapPin, bgColor: "bg-green-100", textColor: "text-green-600" }, // Applications
      { icon: Shield, bgColor: "bg-purple-100", textColor: "text-purple-600" }, // Cross Refs
      { icon: Zap, bgColor: "bg-blue-100", textColor: "text-blue-600" }, // Position
      {
        icon: Settings,
        bgColor: "bg-orange-100",
        textColor: "text-orange-600",
      }, // ABS
      { icon: Wrench, bgColor: "bg-yellow-100", textColor: "text-yellow-600" }, // Drive
      { icon: Settings, bgColor: "bg-cyan-100", textColor: "text-cyan-600" }, // Bolt Pattern
    ];
    const config = iconConfigs[index % iconConfigs.length];
    const IconComponent = config.icon;
    return {
      icon: <IconComponent className={`w-4 h-4 ${config.textColor}`} />,
      bgColor: config.bgColor,
    };
  };

  // Separate counts from specifications for better layout
  const countStats = [
    {
      label: t("admin.parts.applications"),
      value: vehicleCount.toString(),
      icon: 0,
      type: "count",
    },
    {
      label: t("admin.dashboard.crossReferences"),
      value: crossReferenceCount.toString(),
      icon: 1,
      type: "count",
    },
  ];

  // Helper function to display proper value or "Not Specified"
  const formatSpecValue = (value: string | undefined | null) => {
    if (!value || value.startsWith("__unspecified_")) {
      return t("common.notSpecified");
    }
    return value;
  };

  // Part specifications for 4-column layout - show all specs
  const specStats = [
    {
      label: t("partDetails.basicInfo.position"),
      value: formatSpecValue(positionType),
      icon: 2,
      type: "spec",
    },
    {
      label: t("parts.labels.abs"),
      value: formatSpecValue(absType),
      icon: 3,
      type: "spec",
    },
    {
      label: t("parts.labels.drive"),
      value: formatSpecValue(driveType),
      icon: 4,
      type: "spec",
    },
    {
      label: t("parts.labels.boltPattern"),
      value: formatSpecValue(boltPattern),
      icon: 5,
      type: "spec",
    },
  ];

  // For mobile, combine all stats in list format
  const mobileStats = [...countStats, ...specStats];

  return (
    <AcrCard variant="default" padding="none" className="mb-6 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 border-b border-acr-gray-200 lg:px-6">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-acr-red-100 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-acr-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-acr-gray-900">{acrSku}</h1>
              {partType && (
                <p className="text-sm text-acr-gray-600">
                  <span className="mr-1">
                    {t("partDetails.header.partLabel")}:
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    {partType}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex gap-2">
            <AcrButton
              variant="secondary"
              size="sm"
              className="flex-1"
              type="button"
            >
              <Eye className="w-4 h-4" />
            </AcrButton>
            <AcrButton
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2"
              type="submit"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">
                    {t("common.actions.saving")}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("partDetails.actions.saveChanges")}
                  </span>
                </>
              )}
            </AcrButton>
          </div>
        </div>

        {/* Desktop Layout - Redesigned */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-acr-red-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-acr-red-600" />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold text-acr-gray-900">
                  {acrSku}
                </h1>
                {partType && (
                  <p className="text-sm text-acr-gray-600">
                    <span className="mr-1">
                      {t("partDetails.header.partLabel")}:
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                      {partType}
                    </span>
                  </p>
                )}
              </div>
              {/* Count Stats next to title */}
              <div className="flex items-center gap-6 pl-6 border-l border-acr-gray-200">
                {countStats.map((stat, index) => {
                  const iconConfig = getStatIcon(stat.icon);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 ${iconConfig.bgColor} rounded-md flex items-center justify-center`}
                      >
                        {iconConfig.icon}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-acr-gray-800">
                          {stat.value}
                        </div>
                        <div className="text-xs text-acr-gray-500">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="flex items-center gap-3">
            <AcrButton variant="secondary" size="default" type="button">
              <Eye className="w-4 h-4 mr-2" />
              Preview
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

      {/* Specifications Section */}
      {
        <div className="px-4 py-4 lg:px-6 border-t border-acr-gray-200">
          {/* Mobile Layout - Vertical List */}
          <div className="space-y-3 lg:hidden">
            {mobileStats.map((stat, index) => {
              const iconConfig = getStatIcon(stat.icon);
              return (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 ${iconConfig.bgColor} rounded-md flex items-center justify-center`}
                  >
                    {iconConfig.icon}
                  </div>
                  <div>
                    <div
                      className={
                        stat.type === "count"
                          ? "text-lg font-semibold text-acr-gray-800"
                          : "text-sm font-medium text-acr-gray-800 truncate"
                      }
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-acr-gray-500">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Layout - 4-Column Grid for Specifications */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-acr-gray-700">
                {t("partDetails.header.specifications")}
              </h3>
              <div className="flex-1 h-px bg-acr-gray-200"></div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {specStats.map((stat, index) => {
                const iconConfig = getStatIcon(stat.icon);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 ${iconConfig.bgColor} rounded-md flex items-center justify-center`}
                    >
                      {iconConfig.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-acr-gray-800 truncate">
                        {stat.value}
                      </div>
                      <div className="text-xs text-acr-gray-500">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
    </AcrCard>
  );
}
