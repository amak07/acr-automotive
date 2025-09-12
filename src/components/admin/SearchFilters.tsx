"use client";

import { Dispatch, SetStateAction } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { Search } from "lucide-react";
import { AdminPartsQueryParams } from "@/types";

type SearchFiltersProps = {
  searchTerm: AdminPartsQueryParams;
  setSearchTerm: Dispatch<SetStateAction<AdminPartsQueryParams>>;
};

export function SearchFilters(props: SearchFiltersProps) {
  const { t } = useLocale();
  const { searchTerm, setSearchTerm } = props;

  return (
    <div className="bg-white p-4 rounded-lg border border-acr-gray-200 shadow-sm mb-6 lg:p-6">
      {/* Mobile: Stacked Layout */}
      <div className="lg:hidden space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder={t("admin.search.placeholder")}
            value={searchTerm.search}
            onChange={(e) =>
              setSearchTerm({ ...searchTerm, search: e.target.value })
            }
            className="w-full pl-10 pr-4 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Dropdowns - Commented out for now */}
        {/* 
        <div className="grid grid-cols-2 gap-3">
          <select
            value={partType}
            onChange={(e) => setPartType(e.target.value)}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 text-sm bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{t('admin.search.partType')}</option>
            <option value="MAZA">{t('parts.types.maza')}</option>
            <option value="DISCO">{t('parts.types.disco')}</option>
            <option value="BALERO">{t('parts.types.balero')}</option>
            <option value="AMORTIGUADOR">{t('parts.types.amortiguador')}</option>
          </select>

          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="pl-4 pr-8 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 text-sm bg-white appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            <option value="">{t('admin.search.position')}</option>
            <option value="DELANTERO">{t('parts.positions.delantero')}</option>
            <option value="TRASERO">{t('parts.positions.trasero')}</option>
          </select>
        </div>
        */}

        {/* Search Button */}
        <button className="w-full bg-acr-red-600 text-white py-3 rounded-lg font-medium hover:bg-acr-red-700 transition-colors flex items-center justify-center gap-2">
          <Search className="w-4 h-4" />
          {t("admin.search.button")}
        </button>
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden lg:block">
        <div className="flex gap-4 items-end">
          {/* Search Input - Takes more space */}
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.button")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-acr-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={t("admin.search.placeholder")}
                value={searchTerm.search}
                onChange={(e) =>
                  setSearchTerm({ ...searchTerm, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Part Type Filter */}
          {/* <div className="w-48">
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.partType")}
            </label>
            <select
              value={partType}
              onChange={(e) => setPartType(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">Todos</option>
              <option value="MAZA">{t("parts.types.maza")}</option>
              <option value="DISCO">{t("parts.types.disco")}</option>
              <option value="BALERO">{t("parts.types.balero")}</option>
              <option value="AMORTIGUADOR">
                {t("parts.types.amortiguador")}
              </option>
            </select>
          </div> */}

          {/* Position Filter */}
          {/* <div className="w-40">
            <label className="block text-sm font-medium text-acr-gray-700 mb-2">
              {t("admin.search.position")}
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acr-red-500 bg-white appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 12px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "16px",
              }}
            >
              <option value="">Todos</option>
              <option value="DELANTERO">
                {t("parts.positions.delantero")}
              </option>
              <option value="TRASERO">{t("parts.positions.trasero")}</option>
            </select>
          </div> */}

          {/* Search Button */}
          <button className="bg-acr-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-acr-red-700 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" />
            {t("admin.search.button")}
          </button>
        </div>
      </div>
    </div>
  );
}
