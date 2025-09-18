"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { SearchFilters, SearchTerms } from "@/components/admin/SearchFilters";
import { PartsList } from "@/components/admin/PartsList";
import { useState } from "react";

export default function AdminPage() {
  const [searchTerms, setSearchTerms] = useState<SearchTerms>({
    search: "",
    part_type: "__all__",
    position_type: "__all__",
    abs_type: "__all__",
    drive_type: "__all__",
    bolt_pattern: "__all__",
  });

  return (
    <div className="min-h-screen bg-acr-gray-100">
      <AdminHeader />

      <main className="px-4 py-6 mx-auto lg:max-w-6xl lg:px-8">
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
