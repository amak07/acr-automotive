"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import {
  PublicSearchFilters,
  PublicSearchTerms,
} from "@/components/public/search/PublicSearchFilters";
import { PublicPartsList } from "@/components/public/parts/PublicPartsList";

export default function HomePage() {
  const [searchTerms, setSearchTerms] = useState<PublicSearchTerms>({
    make: "",
    model: "",
    year: "",
    sku_term: "",
  });

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <PublicHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
        <PublicSearchFilters
          searchTerms={searchTerms}
          setSearchTerms={setSearchTerms}
        />
        <div className="mt-8">
          <PublicPartsList searchTerms={searchTerms} />
        </div>
      </main>
    </div>
  );
}
