"use client";

import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { DashboardCards } from "@/components/admin/dashboard/DashboardCards";
import { SearchFilters, SearchTerms } from "@/components/admin/parts/SearchFilters";
import { PartsList } from "@/components/admin/parts/PartsList";
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";
import { useState } from "react";

function AdminPage() {
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

// Export the wrapped component with admin authentication
export default withAdminAuth(AdminPage);
