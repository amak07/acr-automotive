/**
 * Complete Translation Dictionary
 * 
 * All UI text for ACR Automotive admin interface.
 * Spanish text taken from UX screenshots and Mexican auto parts industry standards.
 * English equivalents for development and international use.
 */

import { Locale, TranslationKeys } from './translation-keys';

export const translations: Record<keyof TranslationKeys, Record<Locale, string>> = {
  // Admin Header
  'admin.header.title': {
    en: 'Parts Catalog',
    es: 'Catálogo de Piezas'
  },
  'admin.header.languageToggle': {
    en: 'Language',
    es: 'Idioma'
  },
  
  // Admin Dashboard
  'admin.dashboard.totalParts': {
    en: 'Total Parts',
    es: 'Total Piezas'
  },
  'admin.dashboard.applications': {
    en: 'Applications',
    es: 'Aplicaciones'
  },
  'admin.dashboard.catalogTitle': {
    en: 'Parts Catalog',
    es: 'Catálogo de Piezas'
  },
  
  // Admin Search & Filters
  'admin.search.placeholder': {
    en: 'Search by ACR SKU or part type...',
    es: 'Buscar por SKU ACR o tipo de pieza...'
  },
  'admin.search.partType': {
    en: 'Part Type',
    es: 'Tipo de Pieza'
  },
  'admin.search.position': {
    en: 'Position',
    es: 'Posición'
  },
  'admin.search.button': {
    en: 'Search',
    es: 'Buscar'
  },
  
  // Admin Parts List
  'admin.parts.newButton': {
    en: 'New Part',
    es: 'Nueva Pieza'
  },
  'admin.parts.sku': {
    en: 'SKU',
    es: 'SKU'
  },
  'admin.parts.actions': {
    en: 'Actions',
    es: 'Acciones'
  },
  'admin.parts.abs': {
    en: 'ABS',
    es: 'ABS'
  },
  'admin.parts.specifications': {
    en: 'Specifications',
    es: 'Especificaciones'
  },
  'admin.parts.applications': {
    en: 'Applications',
    es: 'Aplicaciones'
  },
  'admin.parts.vehicles': {
    en: 'vehicles',
    es: 'vehículos'
  },
  'admin.parts.vehicle': {
    en: 'vehicle',
    es: 'vehículo'
  },
  'admin.parts.references': {
    en: 'references',
    es: 'referencias'
  },
  'admin.parts.reference': {
    en: 'reference',
    es: 'referencia'
  },
  'admin.parts.vehicleApplications': {
    en: 'Vehicle Applications',
    es: 'Aplicaciones de Vehículos'
  },
  'admin.parts.crossReferences': {
    en: 'Cross References',
    es: 'Referencias Cruzadas'
  },
  'admin.parts.pagination': {
    en: 'Showing {{start}}-{{end}} of {{total}} parts',
    es: 'Mostrando {{start}}-{{end}} de {{total}} piezas'
  },
  
  // Common Actions
  'common.actions.view': {
    en: 'See Details',
    es: 'Ver Detalles'
  },
  'common.actions.edit': {
    en: 'Edit',
    es: 'Editar'
  },
  'common.actions.save': {
    en: 'Save',
    es: 'Guardar'
  },
  'common.actions.cancel': {
    en: 'Cancel',
    es: 'Cancelar'
  },
  'common.actions.delete': {
    en: 'Delete',
    es: 'Eliminar'
  },
  'common.actions.search': {
    en: 'Search',
    es: 'Buscar'
  },
  
  // Common States
  'common.loading': {
    en: 'Loading...',
    es: 'Cargando...'
  },
  'common.error': {
    en: 'Error',
    es: 'Error'
  },
  'common.error.generic': {
    en: 'Something went wrong',
    es: 'Algo salió mal'
  },
  'common.error.tryAgain': {
    en: 'Please try again',
    es: 'Por favor, inténtalo de nuevo'
  },
  'common.success': {
    en: 'Success',
    es: 'Éxito'
  },
  
  // Part Types (Technical terms - keep Spanish originals)
  'parts.types.maza': {
    en: 'Wheel Hub/Bearing', // Technical translation
    es: 'MAZA' // Original Spanish term used in industry
  },
  'parts.types.disco': {
    en: 'Brake Disc',
    es: 'Disco de Freno'
  },
  'parts.types.balero': {
    en: 'Bearing',
    es: 'Balero'
  },
  'parts.types.amortiguador': {
    en: 'Shock Absorber',
    es: 'Amortiguador'
  },
  
  // Part Positions
  'parts.positions.delantero': {
    en: 'Front',
    es: 'Delantero'
  },
  'parts.positions.trasero': {
    en: 'Rear',
    es: 'Trasero'
  },
  
  // Search (legacy - keeping for backward compatibility)
  'search.sku': {
    en: 'Search by SKU',
    es: 'Búsqueda por SKU'
  },
  'search.enterSKU': {
    en: 'Enter part number or SKU',
    es: 'Ingrese número de pieza o SKU'
  },
  'search.noResults': {
    en: 'No parts found',
    es: 'No se encontraron piezas'
  },
  'search.loading': {
    en: 'Searching...',
    es: 'Buscando...'
  }
};