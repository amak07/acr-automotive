"use client";

import { useState } from "react";

interface MainSearchBarProps {
  onSearch: (results: any[]) => void;
}

// Mock data - Baleros-Bisa style
const mockClases = [
  { value: "MAZA", label: "MAZA" },
  { value: "BALERO", label: "BALERO" },
  { value: "KIT_BALEROS", label: "KIT DE BALEROS" },
  { value: "DISCO", label: "DISCO" },
];

const mockAutomotriz = [
  { value: "TOYOTA", label: "Toyota" },
  { value: "HONDA", label: "Honda" },
  { value: "NISSAN", label: "Nissan" },
  { value: "FORD", label: "Ford" },
  { value: "CHEVROLET", label: "Chevrolet" },
];

const mockModelos: Record<string, Array<{ value: string; label: string }>> = {
  TOYOTA: [
    { value: "CAMRY", label: "Camry" },
    { value: "COROLLA", label: "Corolla" },
    { value: "RAV4", label: "RAV4" },
  ],
  HONDA: [
    { value: "CIVIC", label: "Civic" },
    { value: "ACCORD", label: "Accord" },
    { value: "CR-V", label: "CR-V" },
  ],
};

const mockAnos = [
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
];

export function MainSearchBar({ onSearch }: MainSearchBarProps) {
  const [clase, setClase] = useState("");
  const [automotriz, setAutomotriz] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");

  const handleSearch = () => {
    // Mock search results
    const mockResults = [
      {
        id: "1",
        sku: "ACR-MAZA-001",
        clase: "MAZA",
        marca: "ACR",
        image: "/api/placeholder/150/150"
      },
      {
        id: "2",
        sku: "ACR-MAZA-002",
        clase: "MAZA",
        marca: "ACR",
        image: "/api/placeholder/150/150"
      },
    ];
    onSearch(mockResults);
  };

  const availableModelos = automotriz ? mockModelos[automotriz] || [] : [];

  return (
    <div className="py-8">
      {/* Central Black Search Bar - Baleros-Bisa Style */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="bg-black rounded-3xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Clase (Part Type) */}
            <div>
              <select
                value={clase}
                onChange={(e) => setClase(e.target.value)}
                className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500"
              >
                <option value="">Clase</option>
                {mockClases.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Automotriz (Make) */}
            <div>
              <select
                value={automotriz}
                onChange={(e) => {
                  setAutomotriz(e.target.value);
                  setModelo(""); // Reset dependent dropdown
                }}
                className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500"
              >
                <option value="">Automotriz</option>
                {mockAutomotriz.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo */}
            <div>
              <select
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                disabled={!automotriz}
                className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Modelo</option>
                {availableModelos.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500"
              >
                <option value="">Año</option>
                {mockAnos.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div>
              <button
                onClick={handleSearch}
                className="w-full bg-acr-red-600 hover:bg-acr-red-700 text-white font-bold py-4 px-8 rounded-full h-14 transition-colors uppercase tracking-wide"
              >
                BUSCAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}