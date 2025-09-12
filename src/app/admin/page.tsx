"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { SearchFilters, SearchTerms } from "@/components/admin/SearchFilters";
import { PartsList } from "@/components/admin/PartsList";
import { useState } from "react";

export default function AdminPage() {
  const [searchTerms, setSearchTerms] = useState<SearchTerms>({
    search: "",
    part_type: "",
    position_type: "",
    abs_type: "",
    drive_type: "",
    bolt_pattern: "",
  });

  return (
    <div className="min-h-screen bg-acr-gray-50">
      <AdminHeader />

      <main className="px-4 py-6 max-w-md mx-auto lg:max-w-6xl lg:px-8">
        <DashboardCards />
        <SearchFilters
          searchTerms={searchTerms}
          setSearchTerms={setSearchTerms}
        />
        <PartsList searchTerms={searchTerms} />
      </main>
    </div>
  );
}
