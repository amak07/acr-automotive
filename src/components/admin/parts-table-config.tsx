'use client';

import { JSX } from "react";
import { Edit } from "lucide-react";
import { TranslationKeys } from "@/lib/i18n/translation-keys";
import { DatabasePartRow } from "@/lib/supabase/utils";

export interface TableColumn {
  key: string;
  label: keyof TranslationKeys;
  render: (value: any, part?: DatabasePartRow) => JSX.Element;
}

export const createPartsTableColumns = (t: (key: keyof TranslationKeys) => string): TableColumn[] => [
  {
    key: "acr_sku",
    label: "admin.parts.sku",
    render: (value: any) => (
      <span className="bg-acr-gray-100 text-acr-gray-800 px-3 py-1.5 rounded-full text-xs font-mono font-medium inline-block min-w-[110px] text-center border border-acr-gray-200">
        {value}
      </span>
    ),
  },
  {
    key: "part_type",
    label: "admin.search.partType",
    render: (value: any) => (
      <span className="text-sm font-medium text-acr-gray-900">{value}</span>
    ),
  },
  {
    key: "vehicle_count",
    label: "admin.parts.vehicleApplications",
    render: (value: any) => (
      <div className="text-sm text-center">
        <div className="text-acr-gray-900 font-medium text-lg">{value || 0}</div>
        <div className="text-acr-gray-500 text-xs">
          {t(value === 1 ? "admin.parts.vehicle" : "admin.parts.vehicles")}
        </div>
      </div>
    ),
  },
  {
    key: "cross_reference_count",
    label: "admin.parts.crossReferences",
    render: (value: any) => (
      <div className="text-sm text-center">
        <div className="text-acr-gray-900 font-medium text-lg">{value || 0}</div>
        <div className="text-acr-gray-500 text-xs">
          {t(value === 1 ? "admin.parts.reference" : "admin.parts.references")}
        </div>
      </div>
    ),
  },
  {
    key: "actions",
    label: "",
    render: (value: any, part?: DatabasePartRow) => (
      <button 
        onClick={() => {
          // TODO: Navigate to part details page
          console.log('Navigate to part details:', part?.id);
        }}
        className="text-acr-red-600 hover:text-acr-red-700 text-sm font-medium underline-offset-4 hover:underline transition-colors"
      >
        {t("common.actions.view")}
      </button>
    ),
  },
];