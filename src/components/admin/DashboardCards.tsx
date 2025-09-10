'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { Settings, Car } from 'lucide-react';

export function DashboardCards() {
  const { t } = useLocale();
  
  return (
    <div className="grid grid-cols-2 gap-4 mb-6 lg:gap-6">
      {/* Total Parts Card */}
      <div className="bg-white p-4 rounded-lg border border-acr-gray-200 lg:p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-acr-gray-100 rounded-md flex items-center justify-center lg:w-10 lg:h-10">
            <Settings className="text-acr-gray-600 w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-acr-gray-800 lg:text-2xl">2,347</div>
            <div className="text-xs text-acr-gray-500 lg:text-sm">{t('admin.dashboard.totalParts')}</div>
          </div>
        </div>
      </div>
      
      {/* Applications Card */}
      <div className="bg-white p-4 rounded-lg border border-acr-gray-200 lg:p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-acr-gray-100 rounded-md flex items-center justify-center lg:w-10 lg:h-10">
            <Car className="text-acr-gray-600 w-4 h-4 lg:w-5 lg:h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-acr-gray-800 lg:text-2xl">156</div>
            <div className="text-xs text-acr-gray-500 lg:text-sm">{t('admin.dashboard.applications')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}