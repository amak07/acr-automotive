"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PublicSearchTerms } from "../search/PublicSearchFilters";

type PublicPartsListProps = {
  searchTerms: PublicSearchTerms;
};

// Mock parts data - Extended for better grid demonstration
const mockParts = [
  {
    id: "1",
    acr_sku: "ACR-BR-001",
    part_type: "MAZA",
    position_type: "DELANTERA",
    abs_type: "Con ABS",
    specifications: "Patrón: 5x114.3, Tracción: FWD",
    applications_count: 12,
    cross_references_count: 3,
  },
  {
    id: "2",
    acr_sku: "ACR-BR-002",
    part_type: "MAZA",
    position_type: "TRASERA",
    abs_type: "Sin ABS",
    specifications: "Patrón: 4x100, Tracción: RWD",
    applications_count: 8,
    cross_references_count: 2,
  },
  {
    id: "3",
    acr_sku: "ACR-SN-001",
    part_type: "BALERO",
    position_type: "DELANTERA",
    abs_type: "Con ABS",
    specifications: "Conector: 2 pines, Longitud: 850mm",
    applications_count: 15,
    cross_references_count: 5,
  },
  {
    id: "4",
    acr_sku: "ACR-KT-001",
    part_type: "KIT_BALEROS",
    position_type: "DELANTERA",
    abs_type: "Con ABS",
    specifications: "Kit completo con retenes",
    applications_count: 9,
    cross_references_count: 4,
  },
  {
    id: "5",
    acr_sku: "ACR-DS-001",
    part_type: "DISCO",
    position_type: "DELANTERA",
    abs_type: "Sin ABS",
    specifications: "Diámetro: 280mm, Ventilado",
    applications_count: 18,
    cross_references_count: 6,
  },
  {
    id: "6",
    acr_sku: "ACR-BR-003",
    part_type: "MAZA",
    position_type: "AMBOS",
    abs_type: "Con ABS",
    specifications: "Patrón: 5x120, Tracción: AWD",
    applications_count: 22,
    cross_references_count: 8,
  },
];

export function PublicPartsList(props: PublicPartsListProps) {
  const { searchTerms } = props;
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-acr-red-600" />
        <span className="ml-2 text-acr-gray-600">Cargando refacciones...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Baleros-Bisa Style Product Grid */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockParts.map((part) => (
            <div
              key={part.id}
              className="bg-white border border-acr-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-acr-gray-300 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-acr-red-500 focus:ring-offset-2 group relative"
              tabIndex={0}
            >
              {/* Product Image - ACR Style */}
              <div className="h-32 bg-white flex items-center justify-center border-b border-acr-gray-200 p-3 relative">
                <img
                  src="/part-placeholder.webp"
                  alt={`${part.part_type} ${part.acr_sku}`}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                />

                {/* Hover "Ver detalles" Strip - At Border */}
                <div className="absolute right-0 bottom-0 transform translate-x-full group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  <div className="bg-white text-black border border-black px-3 py-1 text-xs font-medium shadow-lg">
                    Ver detalles
                  </div>
                </div>
              </div>

              {/* Product Info - Minimal & Clean */}
              <div className="bg-acr-red-50 p-3 text-center">
                {/* SKU - Bold and prominent */}
                <h3 className="font-bold text-lg text-acr-gray-900 font-mono tracking-wider mb-2">
                  {part.acr_sku}
                </h3>

                {/* Part Type - Clean hierarchy */}
                <p className="text-sm text-acr-gray-800 font-semibold mb-1 tracking-wide">
                  {part.part_type}
                </p>

                {/* Brand - Refined */}
                <p className="text-xs text-acr-gray-600 font-medium uppercase tracking-widest">
                  ACR Automotive
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temporary message until API integration */}
      <div className="mt-6 text-center">
        <p className="text-sm text-acr-gray-600">
          Mostrando datos de ejemplo. La integración con la API está pendiente.
        </p>
      </div>
    </div>
  );
}
