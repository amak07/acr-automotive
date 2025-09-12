import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { SearchFilters } from "@/components/admin/SearchFilters";
import { PartsList } from "@/components/admin/PartsList";
import { useState } from "react";
import { AdminPartsQueryParams } from "@/types";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState<AdminPartsQueryParams>({
    limit: 25,
    offset: 0,
    sort_by: "acr_sku",
    sort_order: "asc",
  });

  return (
    <div className="min-h-screen bg-acr-gray-50">
      <AdminHeader />

      <main className="px-4 py-6 max-w-md mx-auto lg:max-w-6xl lg:px-8">
        <DashboardCards />
        <SearchFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <PartsList />
      </main>
    </div>
  );
}
