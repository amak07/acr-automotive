"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Search, XCircleIcon, ChevronDown, ChevronUp } from "lucide-react";
import { AcrButton } from "@/components/acr/Button";
import { AcrSelect } from "@/components/acr/Select";

export type PublicSearchTerms = {
  // Vehicle search
  make: string;
  model: string;
  year: string;
  // ACR Sku or Competitor Sku cross reference lookup
  sku_term: string;
};

type PublicSearchFiltersProps = {
  searchTerms: PublicSearchTerms;
  setSearchTerms: Dispatch<SetStateAction<PublicSearchTerms>>;
};

export function PublicSearchFilters(props: PublicSearchFiltersProps) {
  const { searchTerms, setSearchTerms } = props;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* Vehicle Search Section */}
      <div className="bg-white p-3 rounded-lg border border-acr-gray-200 shadow-sm lg:p-4">
        <h3 className="text-lg font-semibold text-acr-gray-900 mb-3">
          Buscar por Vehículo
        </h3>

        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden space-y-3">
          <AcrSelect.Root
            value={searchTerms.make}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, make: value })
            }
          >
            <AcrSelect.Trigger className="w-full">
              <AcrSelect.Value placeholder="Seleccionar Marca" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="Honda">Honda</AcrSelect.Item>
              <AcrSelect.Item value="Toyota">Toyota</AcrSelect.Item>
              <AcrSelect.Item value="Nissan">Nissan</AcrSelect.Item>
              <AcrSelect.Item value="Mazda">Mazda</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.model}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, model: value })
            }
          >
            <AcrSelect.Trigger className="w-full">
              <AcrSelect.Value placeholder="Seleccionar Modelo" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="Civic">Civic</AcrSelect.Item>
              <AcrSelect.Item value="Accord">Accord</AcrSelect.Item>
              <AcrSelect.Item value="CR-V">CR-V</AcrSelect.Item>
              <AcrSelect.Item value="Pilot">Pilot</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.year}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, year: value })
            }
          >
            <AcrSelect.Trigger className="w-full">
              <AcrSelect.Value placeholder="Año" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="2024">2024</AcrSelect.Item>
              <AcrSelect.Item value="2023">2023</AcrSelect.Item>
              <AcrSelect.Item value="2022">2022</AcrSelect.Item>
              <AcrSelect.Item value="2021">2021</AcrSelect.Item>
              <AcrSelect.Item value="2020">2020</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrButton className="w-full">Buscar</AcrButton>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <AcrSelect.Root
            value={searchTerms.make}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, make: value })
            }
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder="Seleccionar Marca" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="Honda">Honda</AcrSelect.Item>
              <AcrSelect.Item value="Toyota">Toyota</AcrSelect.Item>
              <AcrSelect.Item value="Nissan">Nissan</AcrSelect.Item>
              <AcrSelect.Item value="Mazda">Mazda</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.model}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, model: value })
            }
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder="Seleccionar Modelo" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="Civic">Civic</AcrSelect.Item>
              <AcrSelect.Item value="Accord">Accord</AcrSelect.Item>
              <AcrSelect.Item value="CR-V">CR-V</AcrSelect.Item>
              <AcrSelect.Item value="Pilot">Pilot</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrSelect.Root
            value={searchTerms.year}
            onValueChange={(value) =>
              setSearchTerms({ ...searchTerms, year: value })
            }
          >
            <AcrSelect.Trigger className="flex-1">
              <AcrSelect.Value placeholder="Año" />
            </AcrSelect.Trigger>
            <AcrSelect.Content>
              <AcrSelect.Item value="2024">2024</AcrSelect.Item>
              <AcrSelect.Item value="2023">2023</AcrSelect.Item>
              <AcrSelect.Item value="2022">2022</AcrSelect.Item>
              <AcrSelect.Item value="2021">2021</AcrSelect.Item>
              <AcrSelect.Item value="2020">2020</AcrSelect.Item>
            </AcrSelect.Content>
          </AcrSelect.Root>

          <AcrButton className="whitespace-nowrap">Buscar</AcrButton>
        </div>

        {/* SKU Search Toggle */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-acr-gray-600 hover:text-acr-red-600 transition-colors"
          >
            <span>O buscar por número de parte</span>
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* SKU Search Panel */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showAdvancedFilters
              ? "max-h-32 opacity-100 mt-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-acr-gray-200 pt-4">
            <h4 className="text-md font-medium text-acr-gray-700 mb-3">
              Buscar por Número de Parte
            </h4>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerms.sku_term}
                  onChange={(e) =>
                    setSearchTerms({
                      ...searchTerms,
                      sku_term: e.target.value,
                    })
                  }
                  placeholder="Ingrese número de parte (ej: MOC-123, DEL-456)"
                  className="w-full pl-10 pr-4 py-3 border border-acr-gray-300 rounded-lg focus:ring-2 focus:ring-acr-red-500 focus:border-transparent"
                />
                {searchTerms.sku_term && (
                  <button
                    onClick={() =>
                      setSearchTerms({ ...searchTerms, sku_term: "" })
                    }
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-acr-gray-400 hover:text-acr-gray-600"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AcrButton className="whitespace-nowrap">Buscar</AcrButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
