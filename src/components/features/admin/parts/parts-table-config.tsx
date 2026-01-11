"use client";

import { JSX, useState } from "react";
import {
  Copy,
  Check,
  MapPin,
  Wrench,
  Car,
  Settings,
  FileText,
  Link2,
  Eye,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import { TranslationKeys } from "@/lib/i18n/translation-keys";
import { PartSummary } from "@/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AcrTableColumn } from "@/components/acr";
import { ReadonlyURLSearchParams } from "next/navigation";

export interface TableColumn {
  key: string;
  label?: keyof TranslationKeys;
  render: (
    value: any,
    part?: PartSummary,
    router?: AppRouterInstance
  ) => JSX.Element;
}

/**
 * Creates AcrTable column configuration for the parts list
 */
export const createAcrPartsTableColumns = (
  t: (key: keyof TranslationKeys) => string,
  router?: AppRouterInstance,
  searchParams?: ReadonlyURLSearchParams | null
): AcrTableColumn<PartSummary>[] => [
  {
    key: "acr_sku",
    label: t("admin.parts.sku"),
    render: (value: any) => {
      const CopyableSKU = () => {
        const [copied, setCopied] = useState(false);

        const handleCopy = async (e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent row click
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error("Failed to copy SKU:", err);
          }
        };

        return (
          <button
            onClick={handleCopy}
            className="bg-acr-gray-100 hover:bg-acr-blue-100 border-2 border-transparent hover:border-acr-blue-300
                       px-3 py-1.5 rounded-full text-sm font-mono font-bold text-acr-gray-800
                       transition-all duration-200 cursor-pointer flex items-center gap-1.5 min-w-[120px] justify-center
                       focus:outline-none focus:ring-2 focus:ring-acr-blue-500"
          >
            {value}
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 opacity-60" />
            )}
          </button>
        );
      };

      return <CopyableSKU />;
    },
  },
  {
    key: "part_type",
    label: t("admin.search.partType"),
    render: (value: any) => (
      <span className="text-sm font-medium text-acr-gray-900">
        {value || ""}
      </span>
    ),
  },
  {
    key: "specifications",
    label: t("admin.parts.specifications"),
    render: (value: any, part?: PartSummary) => {
      const hasSpecs =
        part?.position_type ||
        part?.abs_type ||
        part?.drive_type ||
        part?.bolt_pattern ||
        part?.specifications;

      if (!hasSpecs) {
        return (
          <div className="text-xs min-w-[140px] text-left text-acr-gray-400 italic py-2">
            {t("parts.labels.noNotes")}
          </div>
        );
      }

      return (
        <div className="text-xs space-y-0.5 min-w-[140px]">
          {part?.position_type && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-acr-gray-500" />
              <span className="text-acr-gray-600 text-xs uppercase font-medium">
                {t("parts.labels.position")}:
              </span>
              <span className="text-acr-gray-700">{part.position_type}</span>
            </div>
          )}
          {part?.abs_type && (
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-acr-gray-500" />
              <span className="text-acr-gray-600 text-xs uppercase font-medium">
                {t("parts.labels.abs")}:
              </span>
              <span className="text-acr-gray-700">{part.abs_type}</span>
            </div>
          )}
          {part?.drive_type && (
            <div className="flex items-center gap-1.5">
              <Car className="w-3 h-3 text-acr-gray-500" />
              <span className="text-acr-gray-600 text-xs uppercase font-medium">
                {t("parts.labels.drive")}:
              </span>
              <span className="text-acr-gray-700">{part.drive_type}</span>
            </div>
          )}
          {part?.bolt_pattern && (
            <div className="flex items-center gap-1.5">
              <Settings className="w-3 h-3 text-acr-gray-500" />
              <span className="text-acr-gray-600 text-xs uppercase font-medium">
                {t("parts.labels.bolts")}:
              </span>
              <span className="text-acr-gray-700 font-mono">
                {part.bolt_pattern}
              </span>
            </div>
          )}
          {part?.specifications && (
            <div
              className="flex items-center gap-1.5 text-acr-gray-500 italic truncate max-w-[120px]"
              title={part.specifications}
            >
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{part.specifications}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: "data_summary",
    label: t("admin.parts.dataRelations"),
    headerClassName: "text-left",
    render: (value: any, part?: PartSummary) => (
      <div className="text-xs space-y-1 min-w-[100px] text-left">
        <div className="flex items-center justify-start gap-1.5">
          <Car className="w-3 h-3 text-acr-gray-500" />
          <span className="text-acr-gray-900 font-medium">
            {part?.vehicle_count || 0}
          </span>
          <span className="text-acr-gray-500">
            {t(
              (part?.vehicle_count || 0) === 1
                ? "admin.parts.vehicle"
                : "admin.parts.vehicles"
            )}
          </span>
        </div>
        <div className="flex items-center justify-start gap-1.5">
          <Link2 className="w-3 h-3 text-acr-gray-500" />
          <span className="text-acr-gray-900 font-medium">
            {part?.cross_reference_count || 0}
          </span>
          <span className="text-acr-gray-500">
            {t(
              (part?.cross_reference_count || 0) === 1
                ? "admin.parts.reference"
                : "admin.parts.references"
            )}
          </span>
        </div>
      </div>
    ),
  },
];
