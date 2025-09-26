"use client";

import { useState } from "react";
import { AcrSelect, AcrButton } from "@/components/acr";

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
              <AcrSelect.Root value={clase} onValueChange={setClase}>
                <AcrSelect.Trigger className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500">
                  <AcrSelect.Value placeholder="Clase" />
                </AcrSelect.Trigger>
                <AcrSelect.Content>
                  {mockClases.map((option) => (
                    <AcrSelect.Item key={option.value} value={option.value}>
                      {option.label}
                    </AcrSelect.Item>
                  ))}
                </AcrSelect.Content>
              </AcrSelect.Root>
            </div>

            {/* Automotriz (Make) */}
            <div>
              <AcrSelect.Root
                value={automotriz}
                onValueChange={(value) => {
                  setAutomotriz(value);
                  setModelo(""); // Reset dependent dropdown
                }}
              >
                <AcrSelect.Trigger className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500">
                  <AcrSelect.Value placeholder="Automotriz" />
                </AcrSelect.Trigger>
                <AcrSelect.Content>
                  {mockAutomotriz.map((option) => (
                    <AcrSelect.Item key={option.value} value={option.value}>
                      {option.label}
                    </AcrSelect.Item>
                  ))}
                </AcrSelect.Content>
              </AcrSelect.Root>
            </div>

            {/* Modelo */}
            <div>
              <AcrSelect.Root
                value={modelo}
                onValueChange={setModelo}
                disabled={!automotriz}
              >
                <AcrSelect.Trigger className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500 disabled:bg-gray-100 disabled:text-gray-400">
                  <AcrSelect.Value placeholder="Modelo" />
                </AcrSelect.Trigger>
                <AcrSelect.Content>
                  {availableModelos.map((option) => (
                    <AcrSelect.Item key={option.value} value={option.value}>
                      {option.label}
                    </AcrSelect.Item>
                  ))}
                </AcrSelect.Content>
              </AcrSelect.Root>
            </div>

            {/* Año */}
            <div>
              <AcrSelect.Root value={ano} onValueChange={setAno}>
                <AcrSelect.Trigger className="w-full bg-white text-black rounded-full h-14 px-4 text-center font-medium border-0 focus:ring-2 focus:ring-acr-red-500">
                  <AcrSelect.Value placeholder="Año" />
                </AcrSelect.Trigger>
                <AcrSelect.Content>
                  {mockAnos.map((option) => (
                    <AcrSelect.Item key={option.value} value={option.value}>
                      {option.label}
                    </AcrSelect.Item>
                  ))}
                </AcrSelect.Content>
              </AcrSelect.Root>
            </div>

            {/* Search Button */}
            <div>
              <AcrButton
                onClick={handleSearch}
                variant="primary"
                className="w-full rounded-full h-14 uppercase tracking-wide font-bold"
              >
                BUSCAR
              </AcrButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}