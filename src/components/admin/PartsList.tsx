'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { Eye, Edit, MoreVertical, Plus } from 'lucide-react';

export function PartsList() {
  const { t } = useLocale();
  
  // Sample data - we'll replace with real API data later
  const sampleParts = [
    {
      id: '1',
      acr_sku: 'ACR-DF-001',
      part_type: 'parts.types.disco',
      position: 'parts.positions.delantero',
      abs_type: 'No',
      specifications: 'Diámetro: 280mm, Espesor: 25mm',
      vehicleCount: 3,
      referenceCount: 5
    },
    {
      id: '2', 
      acr_sku: 'ACR-BL-045',
      part_type: 'parts.types.balero',
      position: 'parts.positions.trasero',
      abs_type: 'Si',
      specifications: 'Patrón: 5×114.3, Tracción: FWD',
      vehicleCount: 8,
      referenceCount: 12
    },
    {
      id: '3',
      acr_sku: 'ACR-AM-078',
      part_type: 'parts.types.amortiguador',
      position: 'parts.positions.delantero',
      abs_type: 'No',
      specifications: 'Tipo: Gas, Longitud: 350mm',
      vehicleCount: 6,
      referenceCount: 9
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-acr-gray-800">
          {t('admin.dashboard.catalogTitle')}
        </h2>
        <button className="bg-acr-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-acr-red-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('admin.parts.newButton')}
        </button>
      </div>

      {/* Mobile Cards View (hidden on desktop) */}
      <div className="lg:hidden space-y-4">
        {sampleParts.map((part) => (
          <div key={part.id} className="bg-white p-4 rounded-lg border border-acr-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="bg-acr-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                  {part.acr_sku}
                </div>
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                  {t(part.part_type as any)}
                </div>
              </div>
              <button className="text-acr-gray-400 hover:text-acr-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-semibold text-acr-gray-800 mt-3 mb-2">
              {t(part.part_type as any)} {t(part.position as any)}
            </h3>
            <p className="text-sm text-acr-gray-500 mb-3">
              {t('admin.search.position')}: {t(part.position as any)} • ABS: {part.abs_type}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-acr-gray-500">{t('admin.parts.specifications')}</span>
                <div className="text-acr-gray-800">
                  {part.specifications.split(', ').map((spec, index) => (
                    <div key={index}>{spec}</div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-acr-gray-500">{t('admin.parts.applications')}</span>
                <div className="text-acr-gray-800">
                  <div>{part.vehicleCount} {t('admin.parts.vehicles')}</div>
                  <div>{part.referenceCount} {t('admin.parts.references')}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-acr-gray-100 text-acr-gray-700 py-2 rounded-lg text-sm hover:bg-acr-gray-200 transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                {t('common.actions.view')}
              </button>
              <button className="flex-1 bg-acr-red-600 text-white py-2 rounded-lg text-sm hover:bg-acr-red-700 transition-colors flex items-center justify-center gap-2">
                <Edit className="w-4 h-4" />
                {t('common.actions.edit')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden lg:block bg-white rounded-lg border border-acr-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-acr-gray-50 border-b border-acr-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.parts.sku')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.search.partType')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.search.position')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.parts.abs')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.parts.specifications')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.parts.applications')}
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-acr-gray-700 uppercase tracking-wider">
                {t('admin.parts.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-acr-gray-100 bg-white">
            {sampleParts.map((part) => (
              <tr key={part.id} className="hover:bg-acr-gray-25 transition-colors">
                <td className="py-3 px-4">
                  <div className="bg-acr-red-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold inline-block">
                    {part.acr_sku}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-acr-gray-900">
                    {t(part.part_type as any)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-acr-gray-700">
                  {t(part.position as any)}
                </td>
                <td className="py-3 px-4 text-sm text-acr-gray-700">
                  {part.abs_type}
                </td>
                <td className="py-3 px-4 text-sm text-acr-gray-600 max-w-xs">
                  <div className="truncate">{part.specifications}</div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="text-acr-gray-900 font-medium">{part.vehicleCount} {t('admin.parts.vehicles')}</div>
                  <div className="text-acr-gray-500 text-xs">{part.referenceCount} {t('admin.parts.references')}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="bg-white border border-acr-gray-300 text-acr-gray-700 px-3 py-1.5 rounded-md text-xs hover:bg-acr-gray-50 transition-colors flex items-center gap-1.5">
                      <Eye className="w-3 h-3" />
                      {t('common.actions.view')}
                    </button>
                    <button className="bg-acr-red-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-acr-red-700 transition-colors flex items-center gap-1.5">
                      <Edit className="w-3 h-3" />
                      {t('common.actions.edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 py-4">
        <span className="text-sm text-acr-gray-500">
          Mostrando 1-20 de 2,347 piezas
        </span>
      </div>
    </div>
  );
}