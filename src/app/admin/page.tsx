import { AdminHeader } from '@/components/admin/AdminHeader';
import { DashboardCards } from '@/components/admin/DashboardCards';
import { SearchFilters } from '@/components/admin/SearchFilters';
import { PartsList } from '@/components/admin/PartsList';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-acr-gray-50">
      <AdminHeader />
      
      <main className="px-4 py-6 max-w-md mx-auto lg:max-w-6xl lg:px-8">
        <DashboardCards />
        <SearchFilters />
        <PartsList />
      </main>
    </div>
  );
}